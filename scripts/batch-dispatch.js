export async function main(ns) {

    const batchQueuesFileName = "data/batchQueue.txt"

    let batchQueueForDifferentTargets = new Map();
    if (ns.fileExists(batchQueuesFileName)) {
        batchQueueForDifferentTargets = new Map(JSON.parse(ns.read(batchQueuesFileName)));
    }

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const targetNames = Array.from(batchQueueForDifferentTargets.keys());
    const player = ns.getPlayer();

    giveBatchQueueStructure(targetNames, batchQueueForDifferentTargets);
    cleanFinishedAndPoisonedJobsFromQueue(targetNames, batchQueueForDifferentTargets, ns);

    for (const nameOfTarget of targetNames) {
        const targetServer = ns.getServer(nameOfTarget);
        const batchForTarget = batchQueueForDifferentTargets.get(nameOfTarget);

        prepServerForBatching(targetServer, batchForTarget, ns, player, nameOfTarget);
        createBatchesOfJobs(batchForTarget, ns, targetServer, player);
    }

    await executeJobs(ns, targetNames, batchQueueForDifferentTargets, player, enviroment);
    addNewTargetsToQueueIfNeeded(batchQueueForDifferentTargets, targetNames, ns, enviroment, player);
    adjustTimingsOrOutrightDeleteDependingOnReliability(ns, batchQueueForDifferentTargets, targetNames);

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
    successes = 0;
    failures = 0;

    successesInTheLastHour = 0;
    failuresInTheLastHour = 0;
    lastResetHour = 0

    executionWindowSizeInSeconds = 15;

    batchesQueue = [];

    lastFailure;

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
    poisonedBatch = false;

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
    pid;

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



function adjustTimingsOrOutrightDeleteDependingOnReliability(ns, batchQueueForDifferentTargets, targetNames) {
    const currentTime = new Date();
    let countOfDeleted = 0;

    for (const nameOfTarget of targetNames) {
        const queueOfBatches = batchQueueForDifferentTargets.get(nameOfTarget);

        if (currentTime.getHours() !== queueOfBatches.lastResetHour) {
            if (queueOfBatches.failuresInTheLastHour === 0 && queueOfBatches.successesInTheLastHour > 0 && queueOfBatches.executionWindowSizeInSeconds > 3) {
                queueOfBatches.executionWindowSizeInSeconds--;
            }

            const totalRunsThisHour = queueOfBatches.successesInTheLastHour + queueOfBatches.failuresInTheLastHour;
            const ratioOfFailuresThisHour = 1 - (queueOfBatches.successesInTheLastHour / totalRunsThisHour);

            if (ratioOfFailuresThisHour > 0.1) {
                queueOfBatches.executionWindowSizeInSeconds++;
            }


            queueOfBatches.lastResetHour = currentTime.getHours();
            queueOfBatches.successesInTheLastHour = 0;
            queueOfBatches.failuresInTheLastHour = 0;

            if (ratioOfFailuresThisHour > 0.6 && totalRunsThisHour > 10 && countOfDeleted < 2) {
                for (const batch of queueOfBatches.batchesQueue) {
                    batch.jobs.map(x => {
                        if (x.pid) {
                            ns.kill(x.pid);
                        }
                    });

                }

                batchQueueForDifferentTargets.delete(nameOfTarget);
                ns.tprint(`Deleted ${nameOfTarget} from batchQueue for failing too often. Ratio of Failure: ${ratioOfFailuresThisHour}. Total Runs: ${totalRunsThisHour}`);
                countOfDeleted++;
            }
        }
    }
}

function createBatchesOfJobs(batchForTarget, ns, targetServer, player) {
    if (batchForTarget.prepStage === false) {

        if (batchForTarget.batchesQueue.length === 0 || batchForTarget.batchesQueue.every(x => new Date() > new Date(x.startTime))) {
            const batch = new BatchOfJobs();

            const secondsToPadEndTime = batchForTarget.executionWindowSizeInSeconds;
            const msToPadStartTime = 1;

            const noJobsRunningAfter = batchForTarget.thereAreNoJobsRunningAfter();

            let noMoreJobsAfter = new Date(noJobsRunningAfter);

            const defaultStartTime = getWeakenEndDate(ns, targetServer, player);

            if (noJobsRunningAfter < 0 || defaultStartTime > noMoreJobsAfter) {

                addSecondsToDate(defaultStartTime, secondsToPadEndTime);
                const defaultEndTime = new Date(defaultStartTime);

                noMoreJobsAfter = defaultEndTime;
            }

            // if(targetServer.hostname === "megacorp"){
            //     ns.tprint(noMoreJobsAfter.toLocaleTimeString());
            // }

            const hackStart = createNewDataFromOldDateAndAddMilliseconds(noMoreJobsAfter, msToPadStartTime);
            const hackEnd = createNewDataFromOldDateAndAddSeconds(hackStart, secondsToPadEndTime);

            batch.jobs.push(new JobHasTo(hackStart, hackEnd, "hack"));

            const weakenAfterhackStart = createNewDataFromOldDateAndAddMilliseconds(hackEnd, msToPadStartTime);
            const weakenAfterHackEnd = createNewDataFromOldDateAndAddSeconds(weakenAfterhackStart, secondsToPadEndTime);

            batch.jobs.push(new JobHasTo(weakenAfterhackStart, weakenAfterHackEnd, "weaken-after-hack"));

            const growStart = createNewDataFromOldDateAndAddMilliseconds(weakenAfterHackEnd, msToPadStartTime);
            const growEnd = createNewDataFromOldDateAndAddSeconds(growStart, secondsToPadEndTime);

            batch.jobs.push(new JobHasTo(growStart, growEnd, "grow"));

            const weakenAfterGrowStart = createNewDataFromOldDateAndAddMilliseconds(growEnd, msToPadStartTime);
            const weakenAfterGrowEnd = createNewDataFromOldDateAndAddSeconds(weakenAfterGrowStart, secondsToPadEndTime);

            batch.jobs.push(new JobHasTo(weakenAfterGrowStart, weakenAfterGrowEnd, "weaken-after-grow"));

            batchForTarget.batchesQueue.push(batch);
        }
    }
}

async function executeJobs(ns, targetNames, batchQueueForDifferentTargets, player, environment) {
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

                    let machineToRunOn;
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

                        numberOfThreads = getNumberOfThreadsToWeaken(ns, 1, amountToWeaken);
                        ramCost = ramNeededForWeaken * numberOfThreads;

                        machineToRunOn = getMachineWithEnoughRam(ns, ramCost, environment);

                        if (machineToRunOn && machineToRunOn.cpuCores > 1) {
                            numberOfThreads = getNumberOfThreadsToWeaken(ns, machineToRunOn.cpuCores, amountToWeaken);
                        }

                        const ifStartedNowWeakenDoneAt = getWeakenEndDate(ns, targetServer, player);
                        const endBeforeDate = new Date(job.endBefore);

                        if (new Date(job.endAfter) < ifStartedNowWeakenDoneAt && ifStartedNowWeakenDoneAt < endBeforeDate) {
                            shouldExecute = true;
                        }                        
                        
                        if (ifStartedNowWeakenDoneAt > endBeforeDate) {
                            batchOfJobs.poisonedBatch = true;
                        }

                        if (ifStartedNowWeakenDoneAt > endBeforeDate) {
                            const howMuchOff = ifStartedNowWeakenDoneAt - endBeforeDate;
                            const howMuchOffSeconds = new Date(howMuchOff).getSeconds()
                            if (howMuchOffSeconds < batchForTarget.executionWindowSizeInSeconds / 2) {

                                // if(nameOfTarget === "megacorp"){
                                //     ns.tprint(nameOfTarget);
                                //     ns.tprint(ifStartedNowWeakenDoneAt);
                                //     ns.tprint(endBeforeDate);
                                // }

                                // i think we need to adjust weakens sometimes when they miss their window. But that time isn't now. 
                            }
                        }
                    }

                    if (job.type.startsWith("grow")) {
                        script = growScript;

                        if (job.type !== "grow-dynamic") {
                            targetServer.moneyAvailable = 0;
                        }

                        numberOfThreads = getGrowThreads(ns, targetServer, player, 1);
                        ramCost = ramNeededForGrow * numberOfThreads;

                        machineToRunOn = getMachineWithEnoughRam(ns, ramCost, environment);

                        if (machineToRunOn && machineToRunOn.cpuCores > 1) {
                            numberOfThreads = getGrowThreads(ns, targetServer, player, machineToRunOn.cpuCores);
                        }

                        const ifStartedNowGrowDoneAt = getGrowEndDate(ns, targetServer, player);
                        if (new Date(job.endAfter) < ifStartedNowGrowDoneAt && ifStartedNowGrowDoneAt < new Date(job.endBefore)) {
                            shouldExecute = true;
                        }

                        if (ifStartedNowGrowDoneAt > new Date(job.endBefore)) {
                            batchOfJobs.poisonedBatch = true;
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

                        machineToRunOn = getMachineWithEnoughRam(ns, ramCost, environment);

                        const ifStartedNowHackDoneAt = getHackEndDate(ns, targetServer, player);
                        if (new Date(job.endAfter) < ifStartedNowHackDoneAt && ifStartedNowHackDoneAt < new Date(job.endBefore)) {
                            shouldExecute = true;
                        }
                    }

                    if (shouldExecute && machineToRunOn) {
                        ns.scp(script, machineToRunOn.hostname);
                        const pid = ns.exec(script, machineToRunOn.hostname, numberOfThreads, nameOfTarget);

                        if (pid === 0) {
                            ns.tprint("failed exec")
                        }

                        job.ramCost = ramCost;
                        job.executing = true;
                        job.machineRunningOn = machineToRunOn.hostname;
                        job.pid = pid;

                        if (!batchOfJobs.startTime) {
                            batchOfJobs.startTime = new Date();
                        }
                    }
                }
            }
        }
    }
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
        .sort((b, a) => b.server.maxRam - a.server.maxRam);

    for (const potentialServerToRun of serversWithEnoughRam) {
        const server = getServer(ns, potentialServerToRun.name);
        const freeRam = server.maxRam - server.ramUsed;
        if (freeRam > ramNeeded) {
            machineToRunOn = server;
            break;
        }
    }

    if (machineToRunOn === undefined) {
        const buyOrUpgradeServerFlag = 'buyOrUpgradeServerFlag.txt';

        let maxAmountNeeded = 0;
        if (ns.fileExists(buyOrUpgradeServerFlag)) {
            maxAmountNeeded = ns.read(buyOrUpgradeServerFlag);
        }

        if (maxAmountNeeded < ramNeeded) {
            maxAmountNeeded = ramNeeded;
            ns.rm(buyOrUpgradeServerFlag);
            ns.write(buyOrUpgradeServerFlag, maxAmountNeeded, "W");
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

function prepServerForBatching(targetServer, batchForTarget, ns, player, nameOfTarget) {

    const amountToWeaken = targetServer.hackDifficulty - targetServer.minDifficulty;
    const serverHasMaxMoney = targetServer.moneyMax === targetServer.moneyAvailable;
    const currentTime = new Date();

    if (amountToWeaken === 0 && serverHasMaxMoney && batchForTarget.securityWeNeedToReduceAfterFullHack && batchForTarget.securityWeNeedToReduceAfterFullGrowth && batchForTarget.prepStage && batchForTarget.originalNumberOfThreadsForFullMoney) {
        batchForTarget.prepStage = false;
        batchForTarget.targetMachineSaturatedWithAttacks = false;
        batchForTarget.executionWindowSizeInSeconds = 15;
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
                        const growThreads = getGrowThreads(ns, targetServer, player, 1);
                        batchForTarget.securityWeNeedToReduceAfterFullGrowth = ns.growthAnalyzeSecurity(growThreads, nameOfTarget, 1);
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

function cleanFinishedAndPoisonedJobsFromQueue(targetNames, batchQueue, ns) {

    for (const target of targetNames) {
        const batches = batchQueue.get(target);
        const currentTime = new Date();

        for (let i = batches.batchesQueue.length - 1; i > -1; i--) {
            const batch = batches.batchesQueue[i];
            let remove = false;

            if (batch.wholeBatchFinishsBefore() < currentTime) {

                if (batch.jobs.every(x => x.executing) === false) {
                    batches.failures++;
                    batches.failuresInTheLastHour++;
                    batches.lastFailure = batch;
                } else {
                    batches.successes++;
                    batches.successesInTheLastHour++;
                }

                remove = true;
                batches.targetMachineSaturatedWithAttacks = true;
            }

            if (batch.poisonedBatch) {
                batches.failures++;
                batches.failuresInTheLastHour++;
                batches.lastFailure = batch;

                remove = true;

                batch.jobs.map(x => {
                    if (x.pid) {
                        ns.kill(x.pid);
                    }
                });
            }

            if (remove) {
                batches.batchesQueue.splice(i, 1);
            }
        }
    }
}

function addNewTargetsToQueueIfNeeded(batchQueue, targetNames, ns, enviroment, player) {
    const ramObservationsForPurchasingNewServer = 'data/ramObservations.txt';

    if (ns.fileExists(ramObservationsForPurchasingNewServer)) {
        return;
    }

    if ((batchQueue.size < 2 || (targetNames.map(x => batchQueue.get(x)).every(x => x.targetMachineSaturatedWithAttacks)) && batchQueue.size < 25)) {
        const helpers = new Helpers(ns);
        const portsWeCanPop = helpers.numberOfPortsWeCanPop();
        const currentHackingLevel = ns.getHackingLevel();

        const allHackableMachines = enviroment
            .filter(x => x.server.requiredHackingSkill < currentHackingLevel)
            .filter(x => x.server.numOpenPortsRequired <= portsWeCanPop || x.server.purchasedByPlayer);

        allHackableMachines
            .filter(x => !x.server.hasAdminRights)
            .map(x => helpers.hackMachine(x.name));

        const allMachinesByOrderOfValue = allHackableMachines
            .filter(x => !x.server.purchasedByPlayer && x.server.moneyMax !== 0 && !targetNames.includes(x.name))
            .sort((a, b) => b.server.moneyMax - a.server.moneyMax);

        // only add machine if 90%+ chances of successfully hacking at minDifficulty. 
        let mostValuableMachine;
        for (const hackPossibility of allMachinesByOrderOfValue) {
            const server = ns.getServer(hackPossibility.name);
            server.hackDifficulty = server.minDifficulty;
            const chanceOfHackingAtMinDif = ns.formulas.hacking.hackChance(server, player);

            if (chanceOfHackingAtMinDif > 0.9) {
                mostValuableMachine = hackPossibility;
                break;
            }
        }

        if (mostValuableMachine) {
            batchQueue.set(mostValuableMachine.name, new BatchQueueForTarget());
        }

    }
}

function getHackThreadsForTotalStealing(ns, theTarget, targetServer) {
    return Math.ceil(ns.hackAnalyzeThreads(theTarget, targetServer.moneyAvailable));
}

function getGrowThreads(ns, serverToHack, player, cpuCores) {
    return Math.ceil(ns.formulas.hacking.growThreads(serverToHack, player, serverToHack.moneyMax, cpuCores));
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
