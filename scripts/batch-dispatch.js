export async function main(ns) {

    let serversUsedForBatching = [];
    const nameOfServersUsedFile = "data/serversUsedForBatching.txt";
    const batchQueuesFileName = "data/batchQueue.txt"
    const hackScript = 'scripts/advanced-hacks/hack.js'
    const growScript = 'scripts/advanced-hacks/grow.js'
    const weakenScript = 'scripts/advanced-hacks/weaken.js'

    const ramNeededForWeaken = ns.getScriptRam(weakenScript);
    const ramNeededForGrow = ns.getScriptRam(growScript);
    const ramNeededForHack = ns.getScriptRam(hackScript);

    if (ns.fileExists(nameOfServersUsedFile)) {
        serversUsedForBatching = JSON.parse(ns.read(nameOfServersUsedFile))
    }

    if (!serversUsedForBatching.includes("home")) {
        serversUsedForBatching.push("home")
    }

    let batchQueueForDifferentTargets = new Map();
    if (ns.fileExists(batchQueuesFileName)) {
        batchQueueForDifferentTargets = new Map(JSON.parse(ns.read(batchQueuesFileName)));
    }

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const targetNames = Array.from(batchQueueForDifferentTargets.keys());
    const player = ns.getPlayer();

    giveBatchQueueStructure(targetNames, batchQueueForDifferentTargets);
    cleanFinishedJobsFromQueue(targetNames, batchQueueForDifferentTargets);
    addServerToHackingPoolIfNeedBe(serversUsedForBatching, ns, batchQueueForDifferentTargets, enviroment);
    addNewTargetsToQueueIfNeeded(batchQueueForDifferentTargets, targetNames, ns, enviroment);


    for (const nameOfTarget of targetNames) {
        const targetServer = ns.getServer(nameOfTarget);
        const batchForTarget = batchQueueForDifferentTargets.get(nameOfTarget);

        prepServerForBatching(targetServer, batchForTarget, ns, player, serversUsedForBatching, batchQueueForDifferentTargets, nameOfTarget);
        // add jobs to batches
    }

    //execute commands
    for (const nameOfTarget of targetNames) {
        const batchForTarget = batchQueueForDifferentTargets.get(nameOfTarget);

        const now = new Date();

        for (let i = 0; i < batchForTarget.batchesQueue.length; i++) {
            const batchOfJobs = batchForTarget.batchesQueue[i];

            for (let y = 0; y < batchOfJobs.jobs.length; y++) {
                const job = batchOfJobs.jobs[y];

                const targetServer = ns.getServer(nameOfTarget);

                if (job.executing === false) {

                    const freeMachine = getServerWithMostUnallocatedSpace(ns, serversUsedForBatching, batchQueueForDifferentTargets);
                    let script;
                    let numberOfThreads;
                    let memoryUsed;
                    let shouldExecute = false;

                    if (job.type.startsWith("weaken")) {
                        script = weakenScript;

                        let amountToWeaken = server.hackDifficulty - server.minDifficulty;

                        if (job.type === "weaken-after-hack") {
                            amountToWeaken = batchForTarget.securityWeNeedToReduceAfterFullHack;
                        }

                        if (job.type === "weaken-after-grow") {
                            amountToWeaken = batchForTarget.securityWeNeedToReduceAfterFullGrowth;
                        }

                        numberOfThreads = getNumberOfThreadsToWeaken(ns, freeMachine, amountToWeaken);
                        memoryUsed = ramNeededForWeaken * numberOfThreads;

                        const ifStartedNowWeakenDoneAt = getWeakenEndDate(ns, targetServer, player);
                        if (new Date(job.endAfter) < ifStartedNowWeakenDoneAt && ifStartedNowWeakenDoneAt < new Date(job.endBefore)) {
                            shouldExecute = true;
                        }
                    }

                    if (job.type.startsWith("grow")) {
                        script = growScript;

                        if (job.type !== "grow-dynamic") {
                            targetServer.moneyAvailable = 0;
                        }

                        numberOfThreads = getGrowThreads(ns, targetServer, player, freeMachine);
                        memoryUsed = ramNeededForGrow * numberOfThreads;

                        const ifStartedNowGrowDoneAt = getGrowEndDate(ns, targetServer, player);
                        if (new Date(job.endAfter) < ifStartedNowGrowDoneAt && ifStartedNowGrowDoneAt < new Date(job.endBefore)) {
                            shouldExecute = true;
                        }
                    }

                    if (job.type.startsWith("hack")) {
                        script = hackScript;

                        if (job.type === "hack") {
                            targetServer.moneyAvailable = targetServer.moneyMax;
                        }

                        numberOfThreads = getHackThreadsForTotalStealing(ns, targetServer, player, freeMachine);
                        memoryUsed = ramNeededForHack * numberOfThreads;

                        const ifStartedNowHackDoneAt = getHackEndDate(ns, targetServer, player);
                        if (new Date(job.endAfter) < ifStartedNowHackDoneAt && ifStartedNowHackDoneAt < new Date(job.endBefore)) {
                            shouldExecute = true;
                        }
                    }

                    if (shouldExecute) {
                        ns.scp(script, freeMachine.hostname);
                        ns.exec(script, freeMachine.hostname, numberOfThreads, nameOfTarget);

                        job.ramCost = memoryUsed;
                        job.executing = true;
                        job.machineRunningOn = freeMachine.hostName;

                        if (!batchOfJobs.startTime) {
                            batchOfJobs.startTime = new Date();
                        }
                    }
                }
            }
        }
    }

    ns.rm(nameOfServersUsedFile);
    ns.write(nameOfServersUsedFile, JSON.stringify(serversUsedForBatching), "W")

    ns.rm(batchQueuesFileName);
    ns.write(batchQueuesFileName, JSON.stringify(Array.from(batchQueueForDifferentTargets.entries()), "W"));

    ns.run('scripts/advanced-dispatch.js');
}

class BatchQueueForTarget {
    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    targetMachineSaturatedWithAttacks = false;

    prepStage = true;

    weakeningDoneAfter;
    successfulWeakening = false;

    growDoneAfter;
    successfulGrowing = false;

    hackDoneAfter;
    successfulHacking = false;

    securityWeNeedToReduceAfterFullHack;
    securityWeNeedToReduceAfterFullGrowth;

    batchesQueue = [];

    getAllocatedMemory(machineRunningOn) {
        return this.batchesQueue
            .reduce((acc, x) => acc.concat(x.jobs), [])
            .filter(x => x.machineRunningOn === machineRunningOn)
            .reduce((acc, x) => acc + x, 0);
    }
}

class BatchOfJobs {
    jobs = [];
    //6 second window? 2 cycles seems like enough for each step.

    startTime;

    wholeBatchFinishsBefore() {
        return Math.max(...this.jobs.map(x => new Date(x.endBefore)))
    }

    constructor(obj) {
        obj && Object.assign(this, obj);
    }
}

class JobHasTo {
    executing = false;
    ramCost = 0;
    machineRunningOn;

    constructor(endAfter, endBefore, type) {
        this.endAfter = endAfter;
        this.endBefore = endBefore;
        this.type = type;
        // this.types = ["grow", "hack", "weaken-after-hack", "weaken-after-grow",
        //     "weaken-dynamic", "grow-dynamic", "hack-dynamic"]
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

function prepServerForBatching(targetServer, batchForTarget, ns, player, serversUsedForBatching, batchQueueForTargetAllTargets, nameOfTarget) {

    const amountToWeaken = targetServer.hackDifficulty - targetServer.minDifficulty;
    const serverHasMaxMoney = targetServer.moneyMax === targetServer.moneyAvailable;
    const currentTime = new Date();

    if (amountToWeaken === 0 && serverHasMaxMoney && batchForTarget.securityWeNeedToReduceAfterFullHack && batchForTarget.securityWeNeedToReduceAfterFullGrowth && batchForTarget.prepStage) {
        batchForTarget.prepStage = false;
        batchForTarget.targetMachineSaturatedWithAttacks = false;
    }

    if (batchForTarget.prepStage) {

        if (batchForTarget.successfulWeakening === false) {
            if (currentTime > new Date(batchForTarget.weakeningDoneAfter) || !batchForTarget.weakeningDoneAfter) {
                if (amountToWeaken !== 0) {
                    let endDate = new Date();
                    endDate = getWeakenEndDate(ns, targetServer, player);
                    addSecondsToDate(endDate, 10);

                    const job = new JobHasTo(new Date(), endDate, "weaken-dynamic");
                    const batchOfJobs = new BatchOfJobs();
                    batchOfJobs.jobs.push(job);

                    batchForTarget.batchesQueue.push(batchOfJobs);
                    batchForTarget.weakeningDoneAfter = endDate;
                } else if (amountToWeaken === 0) {
                    batchForTarget.successfulWeakening = true;
                }
            }
        }

        if (batchForTarget.successfulWeakening && batchForTarget.successfulGrowing === false) {
            if (currentTime > new Date(batchForTarget.growDoneAfter) || !batchForTarget.growDoneAfter) {

                if (serverHasMaxMoney === false) {

                    if (targetServer.moneyAvailable === 0) {
                        const serverDoingHackin = getServerWithMostUnallocatedSpace(ns, serversUsedForBatching, batchQueueForTargetAllTargets);
                        const growThreads = getGrowThreads(ns, targetServer, player, serverDoingHackin);
                        batchForTarget.securityWeNeedToReduceAfterFullGrowth = ns.growthAnalyzeSecurity(growThreads, nameOfTarget, serverDoingHackin.cpuCores);
                    }

                    let endDate = getGrowEndDate(ns, targetServer, player);
                    addSecondsToDate(endDate, 10);

                    const job = new JobHasTo(new Date(), endDate, "grow-dynamic");
                    const batchOfJobs = new BatchOfJobs();
                    batchOfJobs.jobs.push(job);

                    batchForTarget.batchesQueue.push(batchOfJobs);
                    batchForTarget.growDoneAfter = endDate;
                }


                if (serverHasMaxMoney) {
                    batchForTarget.successfulGrowing = true;
                    batchForTarget.successfulWeakening = false;
                }
            }
        }

        if (batchForTarget.successfulGrowing && batchForTarget.successfulHacking === false) {

            if (currentTime > new Date(batchForTarget.hackDoneAfter) || !batchForTarget.hackDoneAfter) {
                if (serverHasMaxMoney) {
                    if (currentTime > new Date(batchForTarget.hackDoneAfter)) {

                        batchForTarget.successfulWeakening = false;
                        batchForTarget.successfulGrowing = false;
                        batchForTarget.successfulHacking = false;
                        batchForTarget.hackDoneAfter = undefined;

                    } else {
                        const hackThreads = getHackThreadsForTotalStealing(ns, nameOfTarget, targetServer);
                        batchForTarget.securityWeNeedToReduceAfterFullHack = ns.hackAnalyzeSecurity(hackThreads, nameOfTarget);

                        let endDate = getHackEndDate(ns, targetServer, player);
                        addSecondsToDate(endDate, 10);

                        const job = new JobHasTo(new Date(), endDate, "hack-dynamic");
                        const batchOfJobs = new BatchOfJobs();
                        batchOfJobs.jobs.push(job);

                        batchForTarget.batchesQueue.push(batchOfJobs);
                        batchForTarget.hackDoneAfter = endDate;
                    }
                }

                if (targetServer.moneyAvailable === 0) {
                    batchForTarget.successfulGrowing = false;
                    batchForTarget.successfulWeakening = false;
                    batchForTarget.successfulHacking = true;
                }
            }
        }
    }
}

function addServerToHackingPoolIfNeedBe(serversUsedForBatching, ns, batchQueue, enviroment) {
    const freeRamOnMachines = [];
    for (const serverName of serversUsedForBatching) {

        const freeMemoryOnServer = getUnallocatedMemoryOnServer(ns, serverName, batchQueue);

        freeRamOnMachines.push(freeMemoryOnServer);
    }


    if (Math.min(...freeRamOnMachines) < 100) {
        const allPurchasedMachines = enviroment
            .filter(x => x.server.purchasedByPlayer && !serversUsedForBatching.includes(x.name))
            .sort((b, a) => b.server.maxRam - a.server.maxRam);

        if (allPurchasedMachines.length > 0) {
            const serverToAdd = allPurchasedMachines.pop();
            ns.killall(serverToAdd.name);
            serversUsedForBatching.push(serverToAdd.name);
        }
    }
}

function getServerWithMostUnallocatedSpace(ns, serversUsedForBatching, batchQueueForTargetAllTargets) {
    let server;
    let serversUnallocatedSpace;
    for (let i = 0; i < serversUsedForBatching.length; i++) {
        const serverName = serversUsedForBatching[i];
        if (!server) {
            serversUnallocatedSpace = getUnallocatedMemoryOnServer(ns, serverName, batchQueueForTargetAllTargets);
            server = getServer(ns, serverName);
        } else {
            const nextServersUnallocatedSpace = getUnallocatedMemoryOnServer(ns, serverName, batchQueueForTargetAllTargets);

            if (nextServersUnallocatedSpace > serversUnallocatedSpace) {
                serversUnallocatedSpace = serversUnallocatedSpace;
                server = getServer(ns, serverName);
            }
        }
    }

    return server;
}

function getUnallocatedMemoryOnServer(ns, serverName, batchQueue) {
    const server = getServer(ns, serverName);
    const serverMaxMemory = server.maxRam;

    let reservedMemory = Array.from(batchQueue.values())
        .reduce((acc, x) => acc + x.getAllocatedMemory(serverName), 0);

    const freeMemoryOnServer = serverMaxMemory - reservedMemory;

    return freeMemoryOnServer;
}

function giveBatchQueueStructure(targetNames, batchQueue) {
    for (const target of targetNames) {
        let targetObject = batchQueue.get(target);
        targetObject = new BatchQueueForTarget(targetObject);

        for (let i = 0; i < targetObject.batchesQueue.length; i++) {
            targetObject.batchesQueue[i] = new BatchOfJobs(targetObject.batchesQueue[i]);
        }

        batchQueue.set(target, targetObject);
    }
}

function getServer(ns, serverName) {
    const server = ns.getServer(serverName);

    if (serverName === "home") {
        server.maxRam -= 32;
        server.ramUsed -= 32;

        if (server.ramUsed < 0) {
            server.ramUsed = 0;
        }
    }

    return server;
}

function cleanFinishedJobsFromQueue(targetNames, batchQueue) {
    for (const target of targetNames) {
        const batch = batchQueue.get(target);
        const currentTime = new Date();

        for (let i = batch.batchesQueue.length - 1; i > -1; i--) {
            const job = batch.batchesQueue[i];
            if (job.wholeBatchFinishsBefore() < currentTime) {
                batch.targetMachineSaturatedWithAttacks = true;
                batch.batchesQueue.splice(i, 1);
            }
        }
    }
}

function addNewTargetsToQueueIfNeeded(batchQueue, targetNames, ns, enviroment) {
    if (batchQueue.size === 0 || targetNames.map(x => batchQueue.get(x)).every(x => x.targetMachineSaturatedWithAttacks)) {
        const helpers = new Helpers(ns);
        const portsWeCanPop = helpers.numberOfPortsWeCanPop();
        const currentHackingLevel = ns.getHackingLevel();

        const allHackableMachines = enviroment
            .filter(x => x.server.requiredHackingSkill < currentHackingLevel)
            .filter(x => x.server.numOpenPortsRequired <= portsWeCanPop || x.server.purchasedByPlayer);

        allHackableMachines
            .filter(x => !x.server.hasAdminRights)
            .map(x => helpers.hackMachine(x.name));

        // we can probabably refine this to account for difficulty. 
        const allMachinesByOrderOfValue = allHackableMachines
            .filter(x => !x.server.purchasedByPlayer && x.server.moneyMax !== 0 && !targetNames.includes(x.name))
            .sort((a, b) => b.server.moneyMax - a.server.moneyMax);

        const mostValuableMachine = allMachinesByOrderOfValue[0];

        batchQueue.set(mostValuableMachine.name, new BatchQueueForTarget());
    }
}

function getHackThreadsForTotalStealing(ns, theTarget, targetServer) {
    return Math.ceil(ns.hackAnalyzeThreads(theTarget, targetServer.moneyAvailable));
}

function getGrowThreads(ns, serverToHack, player, serverDoingHackin) {
    return Math.ceil(ns.formulas.hacking.growThreads(serverToHack, player, serverToHack.moneyMax, serverDoingHackin.cpuCores));
}

function addSecondsToDate(date, secondsToAdd) {
    date.setSeconds(date.getSeconds() + secondsToAdd);
}

function addMillisecondsToDate(date, msToAdd) {
    date.setMilliseconds(date.getMilliseconds() + msToAdd);
}

function getWeakenEndDate(ns, targetServer, player) {
    let endDate = new Date();
    const howLongToWeaken = ns.formulas.hacking.weakenTime(targetServer, player);

    endDate.setMilliseconds(endDate.getMilliseconds() + howLongToWeaken);
    return endDate;
}

function getGrowEndDate(ns, targetServer, player) {
    let endDate = new Date();
    const howLongToGrow = ns.formulas.hacking.growTime(targetServer, player);

    endDate.setMilliseconds(endDate.getMilliseconds() + howLongToGrow);
    return endDate;
}

function getHackEndDate(ns, targetServer, player) {
    let endDate = new Date();
    const howLongToHack = ns.formulas.hacking.hackTime(targetServer, player);

    endDate.setMilliseconds(endDate.getMilliseconds() + howLongToHack);
    return endDate;
}

function getNumberOfThreadsToWeaken(ns, serverDoingHackin, amountToWeaken) {
    let numberOfThreadsToWeaken = 0;
    let foundNumberOfThreads = false;
    while (!foundNumberOfThreads) {
        numberOfThreadsToWeaken++;

        const amountNumberOfThreadsWillWeaken = Math.ceil(ns.weakenAnalyze(numberOfThreadsToWeaken, serverDoingHackin.cpuCores));
        if (amountNumberOfThreadsWillWeaken > amountToWeaken) {
            foundNumberOfThreads = true;
        }
    }

    //add a small margin
    numberOfThreadsToWeaken += 10;
    return numberOfThreadsToWeaken;
}
