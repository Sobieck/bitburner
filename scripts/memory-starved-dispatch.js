const hackScript = 'scripts/advanced-hacks/hack.js';
const growScript = 'scripts/advanced-hacks/grow.js';
const weakenScript = 'scripts/advanced-hacks/weaken.js';

let ranOnHomeThisTime = false;

export async function main(ns) {

    const memoryStarvedQueueFileName = 'data/memoryStarvedQueue.txt';
    const batchQueuesFileName = "data/batchQueue.txt";
    ranOnHomeThisTime = false;


    const homeMemoryLimitations = JSON.parse(ns.read("data/ramToReserveOnHome.txt"));


    let batchTargets = [];
    if (ns.fileExists(batchQueuesFileName)) {
        const batchQueue = JSON.parse(ns.read(batchQueuesFileName));
        batchTargets = batchQueue.map(x => x[0]);
    }


    let memoryStarvedQueue = new Map();
    if (ns.fileExists(memoryStarvedQueueFileName)) {
        memoryStarvedQueue = new Map(JSON.parse(ns.read(memoryStarvedQueueFileName)));
    }

    cleanProcessesAttackingBatchTarget(ns, memoryStarvedQueue, batchTargets);

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const allHackedMachines = enviroment
        .filter(x => x.server.hasAdminRights);

    let allMachinesByOrderOfValue = allHackedMachines
        .filter(x => !x.server.purchasedByPlayer && !batchTargets.includes(x.name) && x.server.moneyMax > 0)
        .sort((a, b) => b.server.moneyMax - a.server.moneyMax)
        .map(x => new HackedRecord(
            x.name,
            x.server.moneyMax,
            x.server.minDifficulty,
            x.server.hackDifficulty,
            x.server.moneyAvailable,
        ))

    seeIfWeNeedToDoNextStep(ns, memoryStarvedQueue);

    const machinesNextInQueueToHack = getMachinesToHack(allMachinesByOrderOfValue, memoryStarvedQueue, ns);

    const hackQueue = [];
    const growAndWeakenQueue = [];

    machinesNextInQueueToHack.forEach(machineInQuestion => {
        if (machineInQuestion.needsWeakening() || machineInQuestion.needsGrowing()) {
            growAndWeakenQueue.push(machineInQuestion);
        } else {
            hackQueue.push(machineInQuestion);
        }
    });

    for (const target of hackQueue) {
        let numberOfThreads = Math.ceil(ns.hackAnalyzeThreads(target.name, target.moneyAvailable));

        await executeScriptAcrossFleet(ns, hackScript, enviroment, homeMemoryLimitations, numberOfThreads, target, memoryStarvedQueue);
    }

    for (const target of growAndWeakenQueue) {
        let threadsNeeded;
        let script;

        if (target.needsGrowing()) {
            script = growScript;
            const serverToHack = getServer(ns, target.name, homeMemoryLimitations);
            const player = ns.getPlayer();

            if (ns.fileExists('Formulas.exe')) {
                threadsNeeded = Math.ceil(ns.formulas.hacking.growThreads(serverToHack, player, serverToHack.moneyMax, 1));
            } else {
                threadsNeeded = Math.ceil(ns.hackAnalyzeThreads(target.name, target.moneyAvailable)) * 5;
            }

            // if (machineToRunOn && machineToRunOn.cpuCores > 1 && ns.fileExists('Formulas.exe')) {
            //     threadsNeeded = Math.ceil(ns.formulas.hacking.growThreads(serverToHack, player, serverToHack.moneyMax, machineToRunOn.cpuCores));
            // }
        }

        if (target.needsWeakening()) {
            script = weakenScript;
            const amountToWeaken = target.hackDifficulty - target.minDifficulty;

            threadsNeeded = getNumberOfThreadsToWeaken(ns, 1, amountToWeaken);



            // if (machineToRunOn && machineToRunOn.cpuCores > 1) {
            //     threadsNeeded = getNumberOfThreadsToWeaken(ns, machineToRunOn.cpuCores, amountToWeaken);
            // }
        }

        await executeScriptAcrossFleet(ns, script, enviroment, homeMemoryLimitations, threadsNeeded, target, memoryStarvedQueue);
    }

    ns.rm(memoryStarvedQueueFileName);
    ns.write(memoryStarvedQueueFileName, JSON.stringify(Array.from(memoryStarvedQueue.entries()), "W"));
}

async function executeScriptAcrossFleet(ns, script, enviroment, homeMemoryLimitations, numberOfThreadsWanted, target, memoryStarvedQueue) {
    const ramNeededForOneThread = ns.getScriptRam(script);

    let numberOfThreadsLeft = numberOfThreadsWanted;
    let serversExausted = false;

    while (numberOfThreadsLeft > 0 && serversExausted === false) {
        const result = getMachineWithNumberOfThreads(ns, enviroment, numberOfThreadsLeft, ramNeededForOneThread, homeMemoryLimitations);

        if (!result.machineToRunOn || result.threads <= 0) {
            serversExausted = true;
        } else {
            const machineToRunOn = result.machineToRunOn.hostname;
            const threads = result.threads

            ns.scp(script, machineToRunOn);
            const pid = ns.exec(script, machineToRunOn, threads, target.name);

            if (pid !== 0) {
                if(machineToRunOn === "home"){
                    ranOnHomeThisTime = true;
                }
                target.pids.push(pid);
                target.runningOn.push({ machineToRunOn, threads })
            }

            numberOfThreadsLeft -= threads;

            memoryStarvedQueue.set(target.name, target);
        }
    }
}

function getMachineWithNumberOfThreads(ns, enviroment, threads, ramCostPerThread, homeMemoryLimitations) {
    let machineToRunOn;
    const buyOrUpgradeServerFlag = 'buyOrUpgradeServerFlag.txt';
    let originalAmountNeeded = ramCostPerThread * threads;

    let globalMaxAmountNeeded = 0;

    if (ns.fileExists(buyOrUpgradeServerFlag)) {
        globalMaxAmountNeeded = JSON.parse(ns.read(buyOrUpgradeServerFlag));
    }

    if (originalAmountNeeded > globalMaxAmountNeeded) {
        globalMaxAmountNeeded = originalAmountNeeded;
        ns.rm(buyOrUpgradeServerFlag);
        ns.write(buyOrUpgradeServerFlag, globalMaxAmountNeeded, "W");
    }

    while (threads > 0 && !machineToRunOn) {
        threads--;

        machineToRunOn = getMachineWithEnoughRam(ns, threads * ramCostPerThread, enviroment, homeMemoryLimitations)

        if(machineToRunOn && machineToRunOn.maxRam > 200 && threads < 20){
            machineToRunOn = undefined;
        }

        if(machineToRunOn && machineToRunOn.maxRam > 900 && threads < 90){
            machineToRunOn = undefined;
        }
    }

    return { threads, machineToRunOn };
}

function getMachineWithEnoughRam(ns, ramNeeded, enviroment, homeMemoryLimitations) {
    let machineToRunOn;

    const allHackableMachines = enviroment
        .filter(x => x.server.hasAdminRights);

    if (!ranOnHomeThisTime) {
        const homeServer = getServer(ns, "home", homeMemoryLimitations);

        allHackableMachines.push({ name: "home", server: homeServer })
    }

    const machinesWithRamAvailable = allHackableMachines
        .filter(x => x.server.ramUsed < x.server.maxRam && x.server.maxRam !== 0);

    const serversWithEnoughRam = machinesWithRamAvailable
        .filter(x => (x.server.maxRam - x.server.ramUsed) > ramNeeded)
        .sort((b, a) => b.server.maxRam - a.server.maxRam);

    for (const potentialServerToRun of serversWithEnoughRam) {
        const server = getServer(ns, potentialServerToRun.name, homeMemoryLimitations);
        const freeRam = server.maxRam - server.ramUsed;
        if (freeRam > ramNeeded) {
            machineToRunOn = server;
            break;
        }
    }

    return machineToRunOn;
}


function getServer(ns, serverName, homeMemoryLimitations) {
    const server = ns.getServer(serverName);

    if (serverName === "home") {

        let ramToReserve = homeMemoryLimitations.ramToReserve;

        if (server.maxRam < ramToReserve) {
            ramToReserve = homeMemoryLimitations.ramToReserveInLimitedEnvironment;
        }

        server.maxRam -= ramToReserve;

        const freeRam = server.maxRam - server.ramUsed

        if (freeRam < 0) {
            server.ramUsed = server.maxRam;
        }
    }

    return server;
}

function cleanProcessesAttackingBatchTarget(ns, memoryStarvedQueue, batchTargets) {
    for (const machineBeingHacked of memoryStarvedQueue) {
        const whoTheyHackin = machineBeingHacked[0];

        if (batchTargets.includes(whoTheyHackin)) {
            const hackinRecord = memoryStarvedQueue.get(whoTheyHackin);
            for (const pid of hackinRecord.pids) {
                ns.kill(pid);
            }

            memoryStarvedQueue.delete(whoTheyHackin);
        }
    }
}


function getMachinesToHack(hackableMachinesInTheEnvironment, memoryStarvedQueue, ns) {
    const machinesNextInQueueToHack = [];
    const doNotAdd = [];

    for (const hackableMachine of hackableMachinesInTheEnvironment) {
        if (memoryStarvedQueue.has(hackableMachine.name)) {
            const record = memoryStarvedQueue.get(hackableMachine.name);
            if (record.readyForNextProcess) {
                machinesNextInQueueToHack.push(hackableMachine);
            }

            doNotAdd.push(hackableMachine);
        }
    }

    for (const hackableMachine of hackableMachinesInTheEnvironment) {
        if (!doNotAdd.find(x => x.name === hackableMachine.name)) {
            machinesNextInQueueToHack.push(hackableMachine);
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
        this.pids = [];

        this.runningOn = [];

        this.isHacking = false;
        this.readyForNextProcess = false;
    }

    needsWeakening() {
        return this.hackDifficulty > this.securityThreshholdTarget;
    }

    needsGrowing() {
        return this.moneyAvailable < this.moneyThreshhold;
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

function seeIfWeNeedToDoNextStep(ns, recordOfWhoIsBeingHacked) {
    for (const companyBeingHacked of recordOfWhoIsBeingHacked.keys()) {
        const record = recordOfWhoIsBeingHacked.get(companyBeingHacked);

        if (record.pids.every(x => !ns.isRunning(x))) {
            if (record.isHacking) {
                recordOfWhoIsBeingHacked.delete(companyBeingHacked)
            } else {
                record.readyForNextProcess = true;
            }
        }
    }
}