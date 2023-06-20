//need to make it so we have a one to one ratio. no multiplies like we are seeing now.
// the ten most valuable servers need to be tackled by owned machines and local.

/** @param {NS} ns */
//run scripts/advanced-dispatch.js 
export async function main(ns) {
    //home just gets put in the queue, and filtered out of hack if we have more than 5 purchased servers.

    const helpers = new Helpers(ns);
    const nameOfrecordOfWhoIsBeingHacked = 'data/recordOfWhoIsBeingHacked.txt';
    const nameOfDataOnWhatHappensEachRound = 'data/dataOnWhatHappensEachRound.txt';
    const hackScript = 'scripts/advanced-hacks/hack.js'
    const growScript = 'scripts/advanced-hacks/grow.js'
    const weakenScript = 'scripts/advanced-hacks/weaken.js'

    const portsWeCanPop = helpers.numberOfPortsWeCanPop();
    const currentHackingLevel = ns.getHackingLevel();
    const countOfPurchasedServers = ns.getPurchasedServers().length;
    const spaceRequireForOtherPrograms = 0;

    let recordOfWhoIsBeingHacked = new Map();
    let dataOnWhatHappensEachRound = [];
    let roundData = new RoundData();

    if (ns.fileExists(nameOfrecordOfWhoIsBeingHacked)) {
        recordOfWhoIsBeingHacked = new Map(JSON.parse(ns.read(nameOfrecordOfWhoIsBeingHacked)));
    }

    if (ns.fileExists(nameOfDataOnWhatHappensEachRound)) {
        dataOnWhatHappensEachRound = JSON.parse(ns.read(nameOfDataOnWhatHappensEachRound));
    }

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));

    clearDeletedServersOfWhoIsBeingHacked(recordOfWhoIsBeingHacked, enviroment);

    const allHackableMachines = enviroment
        .filter(x => x.server.requiredHackingSkill < currentHackingLevel)
        .filter(x => x.server.numOpenPortsRequired <= portsWeCanPop || x.server.purchasedByPlayer);

    allHackableMachines
        .filter(x => !x.server.hasAdminRights)
        .map(x => helpers.hackMachine(x.name));

    const allMachinesByOrderOfValue = allHackableMachines
        .filter(x => !x.server.purchasedByPlayer && x.server.moneyMax !== 0)
        .sort((a, b) => b.server.moneyMax - a.server.moneyMax);

    const homeServer = ns.getServer("home")
    homeServer.maxRam -= 20;
    homeServer.ramUsed -= 20;

    if (homeServer.ramUsed < 0) {
        homeServer.ramUsed = 0;
    }

    allHackableMachines.push({ name: "home", server: homeServer })

    const freeMachines = allHackableMachines
        .filter(x => x.server.ramUsed === 0 && x.server.maxRam !== 0)
        .sort((b, a) => b.server.maxRam - a.server.maxRam);

    roundData.countOfFreeMachines = freeMachines.length;

    const machinesNextInQueueToHack = getMachinesToHack();

    const hackQueue = [];
    const growAndWeakenQueue = [];

    // figure out what needs to happen to items in the queue
    machinesNextInQueueToHack.forEach(machineNextToHack => {
        const machineInQuestion = allMachinesByOrderOfValue
            .map(x => new HackedRecord(
                x.name,
                x.server.moneyMax,
                x.server.minDifficulty,
                x.server.hackDifficulty,
                x.server.moneyAvailable,
            ))
            .find(x => x.name === machineNextToHack.name);

        if (machineInQuestion.needsWeakening() || machineInQuestion.needsGrowing()) {
            growAndWeakenQueue.push(machineInQuestion);
        } else {
            hackQueue.push(machineInQuestion);
        }
    });

    const topMachines = allMachinesByOrderOfValue.splice(0, countOfPurchasedServers + 1).map(x => x.name);
    const ramNeededForHack = ns.getScriptRam(hackScript);

    hackQueue.forEach(target => {
        let machineToRunOn = freeMachines.pop();

        if (machineToRunOn.name === "home" && countOfPurchasedServers >= 5 && freeMachines.length > 0) {
            const nextMachine = freeMachines.pop();
            freeMachines.push(machineToRunOn);
            machineToRunOn = nextMachine;
        }

        if ((!machineToRunOn.server.purchasedByPlayer || !machineToRunOn.name === "home") && topMachines.includes(target.name)) {
            freeMachines.push(machineToRunOn);
            // ns.tprint("Broke out of hack queue with servers left.")
        } else {
            
            const threadsNeeded = Math.floor((machineToRunOn.server.maxRam - spaceRequireForOtherPrograms) / ramNeededForHack)

            ns.scp(hackScript, machineToRunOn.name);
            ns.exec(hackScript, machineToRunOn.name, threadsNeeded, target.name);

            target.hacking();
            recordOfWhoIsBeingHacked.set(machineToRunOn.name, target);
            roundData.addNewThreadsHacking(threadsNeeded);
        }
    });


    const ramNeededForWeaken = ns.getScriptRam(weakenScript);
    const ramNeededForGrow = ns.getScriptRam(growScript);
    growAndWeakenQueue.map(target => {
        const machineToRunOn = freeMachines.pop();

        if ((!machineToRunOn.server.purchasedByPlayer || !machineToRunOn.name === "home") && topMachines.includes(target.name)) {
            freeMachines.push(machineToRunOn);
            // ns.tprint("Broke out of hack queue with servers left.")
        } else {
            //grow default
            let script = growScript;
            let threadsNeeded = Math.floor((machineToRunOn.server.maxRam - spaceRequireForOtherPrograms) / ramNeededForGrow)

            if (target.needsWeakening()) {
                script = weakenScript;
                threadsNeeded = Math.floor((machineToRunOn.server.maxRam - spaceRequireForOtherPrograms) / ramNeededForWeaken)
            }


            ns.scp(script, machineToRunOn.name);
            ns.exec(script, machineToRunOn.name, threadsNeeded, target.name);


            if (target.needsWeakening()) {
                target.weakening();
                roundData.addNewThreadsWeakening(threadsNeeded);
            } else {
                target.growing();
                roundData.addThreadsGrowing(threadsNeeded);
            }

            recordOfWhoIsBeingHacked.set(machineToRunOn.name, target);
        }
    });


    ns.rm(nameOfrecordOfWhoIsBeingHacked);
    ns.write(nameOfrecordOfWhoIsBeingHacked, JSON.stringify(Array.from(recordOfWhoIsBeingHacked.entries()), "W"));

    dataOnWhatHappensEachRound.push(roundData);
    ns.rm(nameOfDataOnWhatHappensEachRound);
    ns.write(nameOfDataOnWhatHappensEachRound, JSON.stringify(dataOnWhatHappensEachRound), "W")

    function getMachinesToHack() {
        const machinesNextInQueueToHack = [];

        // figure out who has already been worked on.
        freeMachines.forEach(freeMachine => {
            if (recordOfWhoIsBeingHacked.has(freeMachine.name)) {
                const recordOfHacking = recordOfWhoIsBeingHacked.get(freeMachine.name);
                if (recordOfHacking.hacking === false) {
                    machinesNextInQueueToHack.push(recordOfHacking.server);
                }

                recordOfWhoIsBeingHacked.delete(freeMachine.name);
            }
        });

        const machinesCurrentlyBeingHacked = Array.from(recordOfWhoIsBeingHacked.entries()).map(x => x[1].name);

        let i = 0;
        while (machinesNextInQueueToHack.length < roundData.countOfFreeMachines) {
            if (i >= allMachinesByOrderOfValue.length) {
                break;
            }

            const nextMostValuableTarget = allMachinesByOrderOfValue[i];

            if (!machinesCurrentlyBeingHacked.includes(nextMostValuableTarget.name)) {
                machinesNextInQueueToHack.push(nextMostValuableTarget);
            }

            i++;
        }
        return machinesNextInQueueToHack;
    }

    function clearDeletedServersOfWhoIsBeingHacked(recordOfWhoIsBeingHacked, enviroment) {
        const machinesWhoAreHackin = Array.from(recordOfWhoIsBeingHacked.entries()).map(x => x[0]);
        const namesOfMachinesInTheEnvironment = enviroment.map(x => x.name);

        machinesWhoAreHackin
            .map(machineWhoIsHackin => {
                if (!namesOfMachinesInTheEnvironment.includes(machineWhoIsHackin) && machineWhoIsHackin !== "home") {
                    recordOfWhoIsBeingHacked.delete(machineWhoIsHackin);
                    ns.tprint(machineWhoIsHackin);
                }
            });
    }
}

export class RoundData {
    countOfFreeMachines = 0;
    newThreadsHacking = 0;
    newThreadsWeakening = 0;
    newThreadsGrowing = 0;
    totalThreadsAllocated = 0

    addNewThreadsHacking(threads) {
        this.newThreadsHacking += threads;
        this.calculateTotal();
    }

    addNewThreadsWeakening(threads) {
        this.newThreadsWeakening += threads;
        this.calculateTotal();
    }

    addThreadsGrowing(threads) {
        this.newThreadsGrowing += threads;
        this.calculateTotal();
    }

    calculateTotal() {
        this.totalThreadsAllocated = this.newThreadsGrowing + this.newThreadsHacking + this.newThreadsWeakening;
    }
}

export class HackedRecord {
    constructor(name, maxMoney, minSecurityThreashhold, hackDifficulty, moneyAvailable) {
        this.name = name;
        this.moneyThreshhold = maxMoney * 0.75;
        this.securityThreshholdTarget = minSecurityThreashhold + 5;
        this.hackDifficulty = hackDifficulty;
        this.moneyAvailable = moneyAvailable;


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

    hackMachine(hostName) {
        if (this.fileExists("BruteSSH.exe")) {
            this.ns.brutessh(hostName);
        }

        if (this.fileExists("FTPCrack.exe")) {
            this.ns.ftpcrack(hostName);
        }

        if (this.fileExists("relaySMTP.exe")) {
            this.ns.relaysmtp(hostName)
        }

        if (this.fileExists("HTTPWorm.exe")) {
            this.ns.httpworm(hostName)
        }

        if (this.fileExists("SQLInject.exe")) {
            this.ns.sqlinject(hostName)
        }

        this.ns.nuke(hostName);
        this.ns.killall(hostName);

        if (hostName !== "home") {
            this.ns
                .ls(hostName, '.js')
                .map(y => this.ns.rm(y, hostName))
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