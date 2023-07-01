/** @param {NS} ns */
//run scripts/advanced-dispatch.js 
export async function main(ns) {

    const helpers = new Helpers(ns);
    const nameOfrecordOfWhoIsBeingHacked = 'data/recordOfWhoIsBeingHacked.txt';
    const batchQueuesFileName = "data/batchQueue.txt";

    const hackScript = 'scripts/advanced-hacks/hack-until-worked.js';
    const growScript = 'scripts/advanced-hacks/grow.js';
    const weakenScript = 'scripts/advanced-hacks/weaken.js';


    let batchTargets = [];

    const portsWeCanPop = helpers.numberOfPortsWeCanPop();
    const currentHackingLevel = ns.getHackingLevel();

    let recordOfWhoIsBeingHacked = new Map();

    if (ns.fileExists(nameOfrecordOfWhoIsBeingHacked)) {
        recordOfWhoIsBeingHacked = new Map(JSON.parse(ns.read(nameOfrecordOfWhoIsBeingHacked)));
    }

    if (ns.fileExists(batchQueuesFileName)) {
        const batchQueue = JSON.parse(ns.read(batchQueuesFileName));
        batchTargets = batchQueue.map(x => x[0]);
    }

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));

    const allHackableMachines = enviroment
        .filter(x => x.server.requiredHackingSkill < currentHackingLevel)
        .filter(x => x.server.numOpenPortsRequired <= portsWeCanPop || x.server.purchasedByPlayer);

    allHackableMachines
        .filter(x => !x.server.hasAdminRights)
        .map(x => helpers.hackMachine(x.name));

    const allMachinesByOrderOfValue = allHackableMachines
        .filter(x => !x.server.purchasedByPlayer && !batchTargets.includes(x.name) && x.server.moneyMax > 0)
        .sort((a, b) => b.server.moneyMax - a.server.moneyMax)
        .map(x => new HackedRecord(
            x.name,
            x.server.moneyMax,
            x.server.minDifficulty,
            x.server.hackDifficulty,
            x.server.moneyAvailable,
        ));

    cleanProcessesAttackingBatchTarget(ns, recordOfWhoIsBeingHacked, batchTargets);

    const machinesNextInQueueToHack = getMachinesToHack(allMachinesByOrderOfValue, recordOfWhoIsBeingHacked, ns);

    const hackQueue = [];
    const growAndWeakenQueue = [];

    machinesNextInQueueToHack.forEach(machineInQuestion => {
        if (machineInQuestion.needsWeakening() || machineInQuestion.needsGrowing()) {
            growAndWeakenQueue.push(machineInQuestion);
        } else {
            hackQueue.push(machineInQuestion);
        }
    });

    const ramNeededForOneHackThread = ns.getScriptRam(hackScript);

    hackQueue.forEach(target => {

        let numberOfThreads = Math.ceil(ns.hackAnalyzeThreads(target.name, target.moneyAvailable));
        const ramNeeded = ramNeededForOneHackThread * numberOfThreads;
        let machineToRunOn = getMachineWithEnoughRam(ns, ramNeeded, enviroment);

        if (!machineToRunOn){
            [numberOfThreads, machineToRunOn] = getMachineWithNumberOfThreads(ns, enviroment, numberOfThreads, ramNeededForOneHackThread);
        }

        if (machineToRunOn) {
            ns.scp(hackScript, machineToRunOn.hostname);
            const pid = ns.exec(hackScript, machineToRunOn.hostname, numberOfThreads, target.name);

            target.hacking();
            target.machineRunningOn = machineToRunOn.hostname;
            target.pid = pid;
            recordOfWhoIsBeingHacked.set(target.name, target);
        }
    });


    const ramNeededForWeaken = ns.getScriptRam(weakenScript);
    const ramNeededForGrow = ns.getScriptRam(growScript);
    growAndWeakenQueue.map(target => {
        let machineToRunOn;
        let threadsNeeded;
        let script;

        if (target.needsGrowing()) {
            target.growing();

            script = growScript;
            const serverToHack = getServer(ns, target.name);
            const player = ns.getPlayer();

            if (ns.fileExists('Formulas.exe')) {
                threadsNeeded = Math.ceil(ns.formulas.hacking.growThreads(serverToHack, player, serverToHack.moneyMax, 1));
            } else {
                threadsNeeded = Math.ceil(ns.hackAnalyzeThreads(target.name, target.moneyAvailable)) * 5;

                if(threadsNeeded === 0){
                    threadsNeeded = 5000;
                }
            }

            machineToRunOn = getMachineWithEnoughRam(ns, threadsNeeded * ramNeededForGrow, enviroment);

            if (!machineToRunOn){
                [threadsNeeded, machineToRunOn] = getMachineWithNumberOfThreads(ns, enviroment, threadsNeeded, ramNeededForGrow);
            }

            if (machineToRunOn && machineToRunOn.cpuCores > 1 && ns.fileExists('Formulas.exe')) {
                threadsNeeded = Math.ceil(ns.formulas.hacking.growThreads(serverToHack, player, serverToHack.moneyMax, machineToRunOn.cpuCores));
            }
        }

        if (target.needsWeakening()) {
            target.weakening();

            script = weakenScript;
            const amountToWeaken = target.hackDifficulty - target.minDifficulty;

            threadsNeeded = getNumberOfThreadsToWeaken(ns, 1, amountToWeaken);

            machineToRunOn = getMachineWithEnoughRam(ns, threadsNeeded * ramNeededForWeaken, enviroment);

            if (!machineToRunOn){
                [threadsNeeded, machineToRunOn] = getMachineWithNumberOfThreads(ns, enviroment, threadsNeeded, ramNeededForWeaken);
            }

            if (machineToRunOn && machineToRunOn.cpuCores > 1) {
                threadsNeeded = getNumberOfThreadsToWeaken(ns, machineToRunOn.cpuCores, amountToWeaken);
            }
        }



        if (machineToRunOn) {
            ns.scp(script, machineToRunOn.hostname);
            const pid = ns.exec(script, machineToRunOn.hostname, threadsNeeded, target.name);
            target.machineRunningOn = machineToRunOn.hostname;
            target.pid = pid;

            recordOfWhoIsBeingHacked.set(target.name, target);
        }
    });

    ns.rm(nameOfrecordOfWhoIsBeingHacked);
    ns.write(nameOfrecordOfWhoIsBeingHacked, JSON.stringify(Array.from(recordOfWhoIsBeingHacked.entries()), "W"));

    function cleanProcessesAttackingBatchTarget(ns, recordOfWhoIsBeingHacked, batchTargets) {
        for (const machineHackin of recordOfWhoIsBeingHacked) {
            const whoTheyHackin = machineHackin[0];

            if (batchTargets.includes(whoTheyHackin)) {
                ns.kill(recordOfWhoIsBeingHacked.get(whoTheyHackin).pid);
                recordOfWhoIsBeingHacked.delete(whoTheyHackin);
            }
        }
    }
}

function getMachineWithNumberOfThreads(ns, enviroment, threads, ramCostPerThread){
    let machineToRunOn;
    const buyOrUpgradeServerFlag = 'buyOrUpgradeServerFlag.txt';
    let originalAmountNeeded = ramCostPerThread * threads;

    let globalMaxAmountNeeded = 0;

    if(ns.fileExists(buyOrUpgradeServerFlag)){
        globalMaxAmountNeeded = JSON.parse(ns.read(buyOrUpgradeServerFlag));
    }

    if(originalAmountNeeded > globalMaxAmountNeeded){
        globalMaxAmountNeeded = originalAmountNeeded;
        ns.rm(buyOrUpgradeServerFlag);
        ns.write(buyOrUpgradeServerFlag, globalMaxAmountNeeded, "W");
    }
    
    while(threads > 0 && !machineToRunOn){
        threads--;

        machineToRunOn = getMachineWithEnoughRam(ns, threads * ramCostPerThread, enviroment)
    }  

    return [ threads, machineToRunOn ];
}

function getMachineWithEnoughRam(ns, ramNeeded, enviroment) {
    let machineToRunOn;

    const helpers = new Helpers(ns);
    const portsWeCanPop = helpers.numberOfPortsWeCanPop();
    const currentHackingLevel = ns.getHackingLevel();

    const allHackableMachines = enviroment
        .filter(x => x.server.requiredHackingSkill < currentHackingLevel)
        .filter(x => x.server.numOpenPortsRequired <= portsWeCanPop || x.server.purchasedByPlayer);

    const homeServer = getServer(ns, "home");

    allHackableMachines.push({ name: "home", server: homeServer })

    const machinesWithRamAvailable = allHackableMachines
        .filter(x => x.server.ramUsed < x.server.maxRam && x.server.maxRam !== 0);

    const serversWithEnoughRam = machinesWithRamAvailable
        .filter(x => (x.server.maxRam - x.server.ramUsed) > ramNeeded)
        .sort((b, a) => b.server.maxRam  - a.server.maxRam);

    for (const potentialServerToRun of serversWithEnoughRam) {
        const server = getServer(ns, potentialServerToRun.name);
        const freeRam = server.maxRam - server.ramUsed;
        if (freeRam > ramNeeded) {
            machineToRunOn = server;
            break;
        }
    }

    return machineToRunOn;
}


function getServer(ns, serverName) {
    const server = ns.getServer(serverName);

    if (serverName === "home") {
        server.maxRam -= 128;
        server.ramUsed -= 128;

        if (server.ramUsed < 0) {
            server.ramUsed = 0;
        }
    }

    return server;
}

function getMachinesToHack(hackableMachinesInTheEnvironment, recordOfWhoIsBeingHacked, ns) {
    const machinesNextInQueueToHack = [];
    const namesOfMachinesBeingHacked = Array.from(recordOfWhoIsBeingHacked.keys());

    for (const hackableMachine of hackableMachinesInTheEnvironment) {
        if (!namesOfMachinesBeingHacked.includes(hackableMachine.name)) {
            machinesNextInQueueToHack.push(hackableMachine);
        } else {
            const recordOfHackin = recordOfWhoIsBeingHacked.get(hackableMachine.name);
            const moneyChange = recordOfHackin.moneyAvailable - hackableMachine.moneyAvailable;
            const difficultyChange = recordOfHackin.hackDifficulty - hackableMachine.hackDifficulty;

            if (moneyChange !== 0 || difficultyChange !== 0) {
                machinesNextInQueueToHack.push(hackableMachine);
            }
        }
    }

    return machinesNextInQueueToHack;
}

export class HackedRecord {
    constructor(name, maxMoney, minDifficulty, hackDifficulty, moneyAvailable) {
        this.name = name;
        this.moneyThreshhold = maxMoney * 0.75;
        this.securityThreshholdTarget = minDifficulty + 5;
        this.hackDifficulty = hackDifficulty;
        this.moneyAvailable = moneyAvailable;
        this.minDifficulty = minDifficulty;
        this.machineRunningOn;
        this.pid;

        this.isWeakening = false;
        this.isGrowing = false;
        this.isHacking = false;
    }

    needsWeakening() {
        return this.hackDifficulty > this.securityThreshholdTarget;
    }

    needsGrowing() {
        return this.moneyAvailable < this.moneyThreshhold;
    }

    weakening() {
        this.isWeakening = true;
        this.isGrowing = false;
        this.isHacking = false;
    }

    growing() {
        this.isWeakening = false;
        this.isGrowing = true;
        this.isHacking = false;
    }

    hacking() {
        this.isWeakening = false;
        this.isGrowing = false;
        this.isHacking = true;
    }
}

export class Helpers {
    constructor(ns) {
        this.ns = ns;
    }

    hackMachine(hostname) {
        if (this.fileExists("BruteSSH.exe")) {
            this.ns.brutessh(hostname);
        }

        if (this.fileExists("FTPCrack.exe")) {
            this.ns.ftpcrack(hostname);
        }

        if (this.fileExists("relaySMTP.exe")) {
            this.ns.relaysmtp(hostname)
        }

        if (this.fileExists("HTTPWorm.exe")) {
            this.ns.httpworm(hostname)
        }

        if (this.fileExists("SQLInject.exe")) {
            this.ns.sqlinject(hostname)
        }

        this.ns.nuke(hostname);
        this.ns.killall(hostname);

        if (hostname !== "home") {
            this.ns
                .ls(hostname, '.js')
                .map(y => this.ns.rm(y, hostname))
        }
    }

    numberOfPortsWeCanPop() {
        let portsWeCanPop = 0;
        if (this.fileExists("BruteSSH.exe")) {
            portsWeCanPop++;
        }

        if (this.fileExists("FTPCrack.exe")) {
            portsWeCanPop++;
        }

        if (this.fileExists("relaySMTP.exe")) {
            portsWeCanPop++;
        }

        if (this.fileExists("HTTPWorm.exe")) {
            portsWeCanPop++;
        }

        if (this.fileExists("SQLInject.exe")) {
            portsWeCanPop++;
        }

        return portsWeCanPop;
    }

    fileExists(fileName) {
        return this.ns.fileExists(fileName, "home");
    }
}

function getNumberOfThreadsToWeaken(ns, cpuCores, amountToWeaken) {
    let numberOfThreadsToWeaken = 0;
    let foundNumberOfThreads = false;
    while (!foundNumberOfThreads) {
        numberOfThreadsToWeaken++;

        const amountNumberOfThreadsWillWeaken = Math.ceil(ns.weakenAnalyze(numberOfThreadsToWeaken, cpuCores));
        if (amountNumberOfThreadsWillWeaken > amountToWeaken) {
            foundNumberOfThreads = true;
        }
    }

    //add a small margin
    numberOfThreadsToWeaken += 20;
    return numberOfThreadsToWeaken;
}