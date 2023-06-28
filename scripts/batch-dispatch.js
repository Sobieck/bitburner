export async function main(ns) {

    let serversUsedForBatching = [];
    const nameOfServersUsedFile = "data/serversUsedForBatching.txt";
    const batchQueuesFileName = "data/batchQueue.txt"


    if (ns.fileExists(nameOfServersUsedFile)) {
        serversUsedForBatching = JSON.parse(ns.read(nameOfServersUsedFile))
    }

    let batchQueueForDifferentTargets = new Map();
    if (ns.fileExists(batchQueuesFileName)) {
        batchQueueForDifferentTargets = new Map(JSON.parse(ns.read(batchQueuesFileName)));
    }

    if (!serversUsedForBatching.includes("home")) {
        serversUsedForBatching.push("home");
    }

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const targetNames = Array.from(batchQueueForDifferentTargets.keys());
    const player = ns.getPlayer();

    giveBatchQueueStructure(targetNames, batchQueueForDifferentTargets);
    cleanFinishedJobsFromQueue(targetNames, batchQueueForDifferentTargets);
    addNewTargetsToQueueIfNeeded(batchQueueForDifferentTargets, targetNames, ns, enviroment);

    for (const nameOfTarget of targetNames) {
        const targetServer = ns.getServer(nameOfTarget);
        const batchForTarget = batchQueueForDifferentTargets.get(nameOfTarget);

        prepServerForBatching(targetServer, batchForTarget, ns, player, serversUsedForBatching, batchQueueForDifferentTargets, nameOfTarget);
        // add jobs to batches


        if (batchForTarget.prepStage === false) {

            if (batchForTarget.batchesQueue.length === 0 || batchForTarget.batchesQueue.every(x => new Date() > new Date(x.startTime))) {
                const batch = new BatchOfJobs();

                const secondsToPadEndTime = 20;
                const msToPadStartTime = 20;

                const defaultStartTime = getWeakenEndDate(ns, targetServer, player);
                addSecondsToDate(defaultStartTime, 40);

                const noJobsRunningAfter = batchForTarget.thereAreNoJobsRunningAfter();

                let noMoreJobsAfter = new Date(noJobsRunningAfter);

                if (noJobsRunningAfter < 0) {
                    noMoreJobsAfter = new Date(defaultStartTime);
                }

                const hackStart = createNewDataFromOldDateAndAddMilliseconds(noMoreJobsAfter, msToPadStartTime);
                const hackEnd = createNewDataFromOldDateAndAddSeconds(hackStart, secondsToPadEndTime);

                batch.jobs.push(new JobHasTo(hackStart, hackEnd, "hack"))

                const weakenAfterhackStart = createNewDataFromOldDateAndAddMilliseconds(hackEnd, msToPadStartTime);
                const weakenAfterHackEnd = createNewDataFromOldDateAndAddSeconds(weakenAfterhackStart, secondsToPadEndTime);

                batch.jobs.push(new JobHasTo(weakenAfterhackStart, weakenAfterHackEnd, "weaken-after-hack"))

                const growStart = createNewDataFromOldDateAndAddMilliseconds(weakenAfterHackEnd, msToPadStartTime);
                const growEnd = createNewDataFromOldDateAndAddSeconds(growStart, secondsToPadEndTime);

                batch.jobs.push(new JobHasTo(growStart, growEnd, "grow"))

                const weakenAfterGrowStart = createNewDataFromOldDateAndAddMilliseconds(growEnd, msToPadStartTime);
                const weakenAfterGrowEnd = createNewDataFromOldDateAndAddSeconds(weakenAfterGrowStart, secondsToPadEndTime);

                batch.jobs.push(new JobHasTo(weakenAfterGrowStart, weakenAfterGrowEnd, "weaken-after-grow"))

                batchForTarget.batchesQueue.push(batch);
            }
        }
    }

    await executeJobs(ns, targetNames, batchQueueForDifferentTargets, serversUsedForBatching, player, enviroment);

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
    originalNumberOfThreadsForFullMoney;

    batchesQueue = [];

    getAllocatedMemory(machineRunningOn) {
        return this.batchesQueue
            .reduce((acc, x) => acc.concat(x.jobs), [])
            .filter(x => x.machineRunningOn === machineRunningOn)
            .reduce((acc, x) => acc + x, 0);
    }

    thereAreNoJobsRunningAfter() {
        return Math.max(...this.batchesQueue.map(x => x.wholeBatchFinishsBefore()));
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

async function executeJobs(ns, targetNames, batchQueueForDifferentTargets, serversUsedForBatching, player) {
    const hackScript = 'scripts/advanced-hacks/hack.js';
    const growScript = 'scripts/advanced-hacks/grow.js';
    const weakenScript = 'scripts/advanced-hacks/weaken.js';

    const ramNeededForWeaken = ns.getScriptRam(weakenScript);
    const ramNeededForGrow = ns.getScriptRam(growScript);
    const ramNeededForHack = ns.getScriptRam(hackScript);

    for (const nameOfTarget of targetNames) {
        const batchForTarget = batchQueueForDifferentTargets.get(nameOfTarget);

        for (let i = 0; i < batchForTarget.batchesQueue.length; i++) {
            const batchOfJobs = batchForTarget.batchesQueue[i];

            for (let y = 0; y < batchOfJobs.jobs.length; y++) {
                const job = batchOfJobs.jobs[y];

                const targetServer = ns.getServer(nameOfTarget);

                if (job.executing === false) {

                    let freeMachine = getServerWithMostUnallocatedSpace(ns, serversUsedForBatching, batchQueueForDifferentTargets);
                    let script;
                    let numberOfThreads;
                    let ramCost;
                    let shouldExecute = false;

                    if (job.type.startsWith("weaken")) {
                        script = weakenScript;

                        let amountToWeaken = targetServer.hackDifficulty - targetServer.minDifficulty;

                        if (job.type === "weaken-after-hack") {
                            amountToWeaken = batchForTarget.securityWeNeedToReduceAfterFullHack;
                        }

                        if (job.type === "weaken-after-grow") {
                            amountToWeaken = batchForTarget.securityWeNeedToReduceAfterFullGrowth;
                        }

                        numberOfThreads = getNumberOfThreadsToWeaken(ns, freeMachine, amountToWeaken);
                        ramCost = ramNeededForWeaken * numberOfThreads;

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
                        ramCost = ramNeededForGrow * numberOfThreads;

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


                        numberOfThreads = getHackThreadsForTotalStealing(ns, nameOfTarget, targetServer);

                        if (numberOfThreads === -1) {
                            numberOfThreads = batchForTarget.originalNumberOfThreadsForFullMoney;
                        }

                        ramCost = ramNeededForHack * numberOfThreads;

                        const ifStartedNowHackDoneAt = getHackEndDate(ns, targetServer, player);
                        if (new Date(job.endAfter) < ifStartedNowHackDoneAt && ifStartedNowHackDoneAt < new Date(job.endBefore)) {
                            shouldExecute = true;
                        }
                    }

                    if (shouldExecute) {
                        if (freeMachine.maxRam - freeMachine.ramUsed < ramCost) {
                            await addServerToHackingPool(serversUsedForBatching, ns, batchQueueForDifferentTargets);
                            y--;
                            continue;
                        }

                        ns.tprint(script, " ", freeMachine.hostname," ", numberOfThreads," " ,nameOfTarget)

                        ns.scp(script, freeMachine.hostname);
                        ns.exec(script, freeMachine.hostname, numberOfThreads, nameOfTarget);

                        job.ramCost = ramCost;
                        job.executing = true;
                        job.machineRunningOn = freeMachine.hostname;

                        if (!batchOfJobs.startTime) {
                            batchOfJobs.startTime = new Date();
                        }
                    }
                }
            }
        }
    }
}

function prepServerForBatching(targetServer, batchForTarget, ns, player, serversUsedForBatching, batchQueueForTargetAllTargets, nameOfTarget) {

    const amountToWeaken = targetServer.hackDifficulty - targetServer.minDifficulty;
    const serverHasMaxMoney = targetServer.moneyMax === targetServer.moneyAvailable;
    const currentTime = new Date();

    if (amountToWeaken === 0 && serverHasMaxMoney && batchForTarget.securityWeNeedToReduceAfterFullHack && batchForTarget.securityWeNeedToReduceAfterFullGrowth && batchForTarget.prepStage && batchForTarget.originalNumberOfThreadsForFullMoney) {
        batchForTarget.prepStage = false;
        batchForTarget.targetMachineSaturatedWithAttacks = false;
    }

    if (batchForTarget.prepStage) {
        batchForTarget.targetMachineSaturatedWithAttacks = false;

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

        if (batchForTarget.successfulGrowing && batchForTarget.successfulHacking === false && batchForTarget.successfulWeakening) {

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
                        batchForTarget.originalNumberOfThreadsForFullMoney = hackThreads;

                        let endDate = getHackEndDate(ns, targetServer, player);
                        addSecondsToDate(endDate, 100);

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

async function addServerToHackingPool(serversUsedForBatching, ns) {

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));

    const allPurchasedMachines = enviroment
        .filter(x => x.server.purchasedByPlayer && !serversUsedForBatching.includes(x.name))
        .sort((b, a) => b.server.maxRam - a.server.maxRam);

    if (allPurchasedMachines.length > 0) {
        const serverToAdd = allPurchasedMachines.pop();
        ns.killall(serverToAdd.name);
        ns.tprint("here");
        await ns.sleep(200);
        serversUsedForBatching.push(serverToAdd.name);
    }
}

function getServerWithMostUnallocatedSpace(ns, serversUsedForBatching) {
    let server;
    let serversUnallocatedSpace;
    for (let i = 0; i < serversUsedForBatching.length; i++) {
        const serverName = serversUsedForBatching[i];

        if (!server) {
            serversUnallocatedSpace = getUnallocatedMemoryOnServer(ns, serverName);
            server = getServer(ns, serverName);
        } else {
            const nextServersUnallocatedSpace = getUnallocatedMemoryOnServer(ns, serverName);

            if (nextServersUnallocatedSpace > serversUnallocatedSpace) {
                serversUnallocatedSpace = serversUnallocatedSpace;
                server = getServer(ns, serverName);
            }
        }
    }

    return server;
}

function getUnallocatedMemoryOnServer(ns, serverName) {
    const server = getServer(ns, serverName);
    const serverMaxMemory = server.maxRam;

    const freeMemoryOnServer = serverMaxMemory - server.ramUsed;

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
                batch.batchesQueue.splice(i, 1);
            }
        }
    }
}

function addNewTargetsToQueueIfNeeded(batchQueue, targetNames, ns, enviroment) {
    if ((batchQueue.size === 0 || targetNames.map(x => batchQueue.get(x)).every(x => x.targetMachineSaturatedWithAttacks)) && batchQueue.size < 4) {
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

function createNewDataFromOldDateAndAddSeconds(date, secondsToAdd) {
    const newDate = new Date(date);
    addSecondsToDate(newDate, secondsToAdd);
    return newDate;
}

function createNewDataFromOldDateAndAddMilliseconds(date, secondsToAdd) {
    const newDate = new Date(date);
    addMillisecondsToDate(newDate, secondsToAdd);
    return newDate;
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
    numberOfThreadsToWeaken += 20;
    return numberOfThreadsToWeaken;
}
