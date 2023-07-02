let failuresThisRun = 0;
let successesThisRun = 0;

let lastTimeVisited = new Date();
let secondsBetweenVisits = [];

export async function main(ns) {
    const now = new Date();
    const secondsSinceLastVisit = Math.abs(now.getTime() - lastTimeVisited.getTime())/1000;
    lastTimeVisited = now;
    if(secondsSinceLastVisit !== 0){
        secondsBetweenVisits.push(secondsSinceLastVisit);
    }
    
    const batchQueuesFileName = "data/batchQueue.txt"

    let batchQueueForDifferentTargets = new Map();
    if (ns.fileExists(batchQueuesFileName)) {
        batchQueueForDifferentTargets = new Map(JSON.parse(ns.read(batchQueuesFileName)));
    }

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));

    const playerServers = enviroment
        .filter(x => x.server.purchasedByPlayer);

    const homeServer = getServer(ns, "home");

    playerServers.push({ name: "home", server: homeServer })

    const totalBoughtMemory = playerServers.reduce((acc, x) => acc + x.server.maxRam, 0);

    if (totalBoughtMemory < 105_000) {
        ns.run('scripts/advanced-dispatch.js');
        return;
    }

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

    const total = failuresThisRun + successesThisRun;
  
    if (total >= 100) {
        const timeStamp = `[${String(now.getHours()).padStart(2,0)}:${String(now.getMinutes()).padStart(2,0)}]`

        const errorRate = 1 - (successesThisRun / total);
        ns.tprint(`${timeStamp} Error Rate ${errorRate.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 })} Successes: ${successesThisRun} Failures: ${failuresThisRun}`);
        
        const averageTimeBetweenVisits = secondsBetweenVisits.reduce((acc, b) => acc + b, 0) / secondsBetweenVisits.length;
        ns.tprint(`${timeStamp} Average of ${averageTimeBetweenVisits} between visits`)

        const reliabilityForBatchFile = 'data/reliabilityForEvery100Batches.txt';
        let batchReliability = [];
        if (ns.fileExists(reliabilityForBatchFile)) {
            batchReliability = JSON.parse(ns.read(reliabilityForBatchFile));
        }
        batchReliability.push({errorRate, averageTimeBetweenVisits, now });
        ns.rm(reliabilityForBatchFile);
        ns.write(reliabilityForBatchFile, JSON.stringify(batchReliability), "W");
        failuresThisRun = 0;
        successesThisRun = 0;
        secondsBetweenVisits = [];
    }

    if (ns.getServerMoneyAvailable("home") > 1_000_000_000_000 || targetNames.map(x => batchQueueForDifferentTargets.get(x)).every(x => !x.targetMachineSaturatedWithAttacks)) {
        ns.run('scripts/advanced-dispatch.js');
    }
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
    executedAt;
    expectedEndTime;

    firstLookStartedNowEndAt;

    lastMissForDoneBeforeWindow;
    firstMissForAfterWindow;

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

            if (ratioOfFailuresThisHour > 0.8 && totalRunsThisHour > 10 && countOfDeleted < 2) {
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

            const hackStart = createNewDataFromOldDateAndAddMilliseconds(noMoreJobsAfter, msToPadStartTime);
            const hackEnd = createNewDataFromOldDateAndAddSeconds(hackStart, secondsToPadEndTime);

            const weakenAfterhackStart = createNewDataFromOldDateAndAddMilliseconds(hackEnd, msToPadStartTime);
            const weakenAfterHackEnd = createNewDataFromOldDateAndAddSeconds(weakenAfterhackStart, secondsToPadEndTime);

            const growStart = createNewDataFromOldDateAndAddMilliseconds(weakenAfterHackEnd, msToPadStartTime);
            const growEnd = createNewDataFromOldDateAndAddSeconds(growStart, secondsToPadEndTime);

            const weakenAfterGrowStart = createNewDataFromOldDateAndAddMilliseconds(growEnd, msToPadStartTime);
            const weakenAfterGrowEnd = createNewDataFromOldDateAndAddSeconds(weakenAfterGrowStart, secondsToPadEndTime);

            // get them in the order they are executed. 
            batch.jobs.push(new JobHasTo(weakenAfterGrowStart, weakenAfterGrowEnd, "weaken-after-grow"));
            batch.jobs.push(new JobHasTo(weakenAfterhackStart, weakenAfterHackEnd, "weaken-after-hack"));
            batch.jobs.push(new JobHasTo(growStart, growEnd, "grow"));
            batch.jobs.push(new JobHasTo(hackStart, hackEnd, "hack"));

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

                if (job.executing === false) {

                    const targetServer = ns.getServer(nameOfTarget);

                    let machineToRunOn;
                    let script;
                    let numberOfThreads;
                    let ramCost;
                    let shouldExecute = false;

                    if (job.type.startsWith("weaken")) {
                        const ifStartedNowWeakenDoneAt = getWeakenEndDate(ns, targetServer, player);
                        shouldExecute = shouldWeExecute(job, ifStartedNowWeakenDoneAt);

                        if (shouldExecute === false) {
                            continue;
                        }

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
                    }

                    if (job.type.startsWith("grow")) {
                        const ifStartedNowGrowDoneAt = getGrowEndDate(ns, targetServer, player);
                        shouldExecute = shouldWeExecute(job, ifStartedNowGrowDoneAt);

                        if (shouldExecute === false) {
                            continue;
                        }

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
                    }

                    if (job.type.startsWith("hack")) {
                        const ifStartedNowHackDoneAt = getHackEndDate(ns, targetServer, player);
                        shouldExecute = shouldWeExecute(job, ifStartedNowHackDoneAt);

                        if (shouldExecute === false) {
                            continue;
                        }

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
                        job.executedAt = new Date();

                        if (!batchOfJobs.startTime) {
                            batchOfJobs.startTime = new Date();
                        }
                    }
                }
            }
        }
    }
}

function shouldWeExecute(job, ifStartedNowWeWouldBeDoneAt) {
    const endBeforeDate = new Date(job.endBefore);
    const endAfterDate = new Date(job.endAfter);

    if (!job.firstLookStartedNowEndAt) {
        job.firstLookStartedNowEndAt = ifStartedNowWeWouldBeDoneAt;
    }

    if (endAfterDate > ifStartedNowWeWouldBeDoneAt) {
        job.lastMissForDoneBeforeWindow = ifStartedNowWeWouldBeDoneAt;
    }

    if (ifStartedNowWeWouldBeDoneAt > endBeforeDate) {
        if (!job.firstMissForAfterWindow) {
            job.firstMissForAfterWindow = ifStartedNowWeWouldBeDoneAt;
        }
    }

    if (endAfterDate < ifStartedNowWeWouldBeDoneAt && ifStartedNowWeWouldBeDoneAt < endBeforeDate) {
        job.expectedEndTime = ifStartedNowWeWouldBeDoneAt;
        return true;
    }

    return false;
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
                    failuresThisRun++;
                } else {
                    batches.successes++;
                    batches.successesInTheLastHour++;
                    successesThisRun++;
                }

                remove = true;
                batches.targetMachineSaturatedWithAttacks = true;
            }

            if (batch.poisonedBatch) {
                batches.failures++;
                batches.failuresInTheLastHour++;
                batches.lastFailure = batch;
                failuresThisRun++;

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
    const weNeedToBuyServers = ns.fileExists(ramObservationsForPurchasingNewServer);

    const batchesAreSaturated = targetNames.map(x => batchQueue.get(x)).every(x => x.targetMachineSaturatedWithAttacks);
    const over5TrillionDollars = ns.getServerMoneyAvailable("home") > 5_000_000_000_000;

    let addNewServerToAttack = false;

    if (batchesAreSaturated && !weNeedToBuyServers) {
        addNewServerToAttack = true;
    }

    if (over5TrillionDollars) {
        addNewServerToAttack = true;
    }

    if ((batchQueue.size < 2 || addNewServerToAttack) && batchQueue.size < 30) {
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

            if (chanceOfHackingAtMinDif > 0.8) {
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
