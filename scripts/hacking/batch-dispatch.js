let failuresThisRun = 0;
let successesThisRun = 0;

let lastTimeVisited = new Date();
let secondsBetweenVisits = [];
let lastRecordedToConsole = new Date();

let visitsToFunction = 0;

let countOfSuccesses = [];
let countOfFailures = [];
let averageErrorRateOver10Minutes = 1;
let errorRateAtWhichWeAllowNewThings = 0.1;

export async function main(ns) {
    visitsToFunction++;

    const buyOrUpgradeServerFlagFile = 'buyOrUpgradeServerFlag.txt';
    const memoryConstrained = ns.fileExists('data/ramObservations.txt') || ns.fileExists(buyOrUpgradeServerFlagFile);

    const batchQueuesFileName = "data/batchQueue.txt"

    let batchQueueForDifferentTargets = new Map();
    if (ns.fileExists(batchQueuesFileName)) {
        batchQueueForDifferentTargets = new Map(JSON.parse(ns.read(batchQueuesFileName)));
    }

    const homeMemoryLimitations = JSON.parse(ns.read("data/ramToReserveOnHome.txt"));

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));

    const playerServers = enviroment
        .filter(x => x.server.purchasedByPlayer);

    const homeServer = getServer(ns, "home", homeMemoryLimitations);

    playerServers.push({ name: "home", server: homeServer })

    const totalBoughtMemory = playerServers.reduce((acc, x) => acc + x.server.maxRam, 0);

    const ramNeededForBatchesFile = "data/ramNeededToStartBatches.txt";
    const memoryNeededForBatches = 155_000;

    if (totalBoughtMemory < memoryNeededForBatches) {
        const ramNeededToStartBatches = Math.round(memoryNeededForBatches - totalBoughtMemory);
        ns.rm(ramNeededForBatchesFile);
        ns.write(ramNeededForBatchesFile, ramNeededToStartBatches, "W");

        if (visitsToFunction > 100) {
            visitsToFunction = 0;
            ns.toast(`Ram Needed to Start Batches: ${ramNeededToStartBatches}`, "warning", 180000)
        }

        return;
    } else {
        ns.rm(ramNeededForBatchesFile);
    }

    const targetNames = Array.from(batchQueueForDifferentTargets.keys());
    const player = ns.getPlayer();

    giveBatchQueueStructure(targetNames, batchQueueForDifferentTargets);
    cleanFinishedAndPoisonedJobsFromQueue(targetNames, batchQueueForDifferentTargets, ns);

    const noMoreInvestingForEndGame = ns.fileExists("stopInvesting.txt");

    const anyBatchNotPrepping = targetNames
        .map(x => batchQueueForDifferentTargets.get(x))
        .filter(x => !x.prepStage)
        .length > 0;


    for (const nameOfTarget of targetNames) {
        const targetServer = ns.getServer(nameOfTarget);
        const batchForTarget = batchQueueForDifferentTargets.get(nameOfTarget);

        if (!noMoreInvestingForEndGame) {
            prepServerForBatching(targetServer, batchForTarget, ns, player, nameOfTarget, anyBatchNotPrepping);
        }

        createBatchesOfJobs(batchForTarget, ns, targetServer, player);
    }

    await executeJobs(ns, targetNames, batchQueueForDifferentTargets, player, enviroment, homeMemoryLimitations);
    addNewTargetsToQueueIfNeeded(batchQueueForDifferentTargets, targetNames, ns, enviroment, player, noMoreInvestingForEndGame, homeMemoryLimitations);
    adjustTimingsOrOutrightDeleteDependingOnReliability(ns, batchQueueForDifferentTargets, targetNames);

    ns.rm(batchQueuesFileName);
    ns.write(batchQueuesFileName, JSON.stringify(Array.from(batchQueueForDifferentTargets.entries()), "W"));

    const total = failuresThisRun + successesThisRun;
    const now = new Date();
    const secondsSinceLastVisit = Math.abs(now.getTime() - lastTimeVisited.getTime()) / 1000;
    lastTimeVisited = now;
    if (secondsSinceLastVisit !== 0) {
        secondsBetweenVisits.push(secondsSinceLastVisit);
    }


    const moneyWeHaveNow = ns.getServerMoneyAvailable("home");

    if (now.getMinutes() !== lastRecordedToConsole.getMinutes() && total > 0) {
        const timeStamp = `[${String(now.getHours()).padStart(2, 0)}:${String(now.getMinutes()).padStart(2, 0)}]`

        const errorRate = 1 - (successesThisRun / total);

        if (errorRate > 0.03) {
            ns.toast(`${timeStamp} Error Rate in batches ${errorRate.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 })}`, "error", 60000);
        }

        const averageTimeBetweenVisits = secondsBetweenVisits.reduce((acc, b) => acc + b, 0) / secondsBetweenVisits.length;

        if (averageTimeBetweenVisits > 3) {
            ns.toast(`${timeStamp} Average of ${averageTimeBetweenVisits.toFixed(2)} seconds between visits`, "warning", null)
        }

        const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
        let stockMarketReserveMoney = new ReserveForTrading();
        if (ns.fileExists(stockMarketReserveMoneyFile)) {
            stockMarketReserveMoney = new ReserveForTrading(JSON.parse(ns.read(stockMarketReserveMoneyFile)));
        }

        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });

        const moneyFormatted = formatter.format(moneyWeHaveNow + stockMarketReserveMoney.moneyInvested);

        let consoleUpdate = `${timeStamp} Money we have now: ${moneyFormatted} | Number of targeted server: ${String(targetNames.length).padStart(2, 0)}`;

        if (memoryConstrained) {
            consoleUpdate += " | Memory Constrained";
        }

        ns.tprint(consoleUpdate);

        const reliabilityForBatchFile = 'data/reliabilityForEvery100Batches.txt';
        let batchReliability = [];

        if (ns.fileExists(reliabilityForBatchFile)) {
            batchReliability = JSON.parse(ns.read(reliabilityForBatchFile));
        }

        batchReliability.push({ errorRate, averageTimeBetweenVisits, now, moneyWeHaveNow, numberOfTargetedServers: targetNames.length });


        ns.rm(reliabilityForBatchFile);
        ns.write(reliabilityForBatchFile, JSON.stringify(batchReliability), "W");


        countOfFailures.push(failuresThisRun);
        countOfSuccesses.push(successesThisRun);

        if (countOfFailures.length > 10) {
            countOfFailures.shift();
        }

        if (countOfSuccesses.length > 10) {
            countOfSuccesses.shift();
        }

        const successesIn10Minutes = countOfSuccesses.reduce((acc, b) => acc + b, 0);
        const failuresIn10Minutes = countOfFailures.reduce((acc, b) => acc + b, 0);
        const totalIn10Minutes = successesIn10Minutes + failuresIn10Minutes;

        averageErrorRateOver10Minutes = 1 - (successesIn10Minutes / totalIn10Minutes);

        if (averageErrorRateOver10Minutes > errorRateAtWhichWeAllowNewThings) {
            ns.toast(`${timeStamp} Error Rate over 10 minutes is: ${averageErrorRateOver10Minutes.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 })}`, "error", 15000);
        }


        failuresThisRun = 0;
        successesThisRun = 0;
        secondsBetweenVisits.length = 0;
        lastRecordedToConsole = now;
    }

    if (moneyWeHaveNow > 1_000_000_000_000 ||
        homeServer.maxRam - homeServer.ramUsed > 300000 ||
        targetNames
            .map(x => batchQueueForDifferentTargets.get(x))
            .every(x => !x.targetMachineSaturatedWithAttacks)) {
        if (!memoryConstrained) {
            ns.run('scripts/hacking/advanced-dispatch.js');
        }
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

    executionWindowSizeInSeconds = 4;

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

function adjustTimingsOrOutrightDeleteDependingOnReliability(ns, batchQueueForDifferentTargets, targetNames) {
    const currentTime = new Date();
    let countOfDeleted = 0;

    for (const nameOfTarget of targetNames) {
        const queueOfBatches = batchQueueForDifferentTargets.get(nameOfTarget);
        const currentHour = currentTime.getHours()

        if (currentHour !== queueOfBatches.lastResetHour) {
            if (queueOfBatches.failuresInTheLastHour === 0 && queueOfBatches.successesInTheLastHour > 0 && queueOfBatches.executionWindowSizeInSeconds > 2) {
                queueOfBatches.executionWindowSizeInSeconds--;
            }

            const totalRunsThisHour = queueOfBatches.successesInTheLastHour + queueOfBatches.failuresInTheLastHour;
            const ratioOfFailuresThisHour = 1 - (queueOfBatches.successesInTheLastHour / totalRunsThisHour);

            if (ratioOfFailuresThisHour > 0.1) {
                queueOfBatches.executionWindowSizeInSeconds++;
            }


            queueOfBatches.lastResetHour = currentHour;
            queueOfBatches.successesInTheLastHour = 0;
            queueOfBatches.failuresInTheLastHour = 0;

            if (ratioOfFailuresThisHour > 0.9 && totalRunsThisHour > 10 && countOfDeleted < 2 && targetNames.length > 2) {
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

            const defaultStartTime = getWeakenEndDate(ns, targetServer, player, batchForTarget.securityWeNeedToReduceAfterFullGrowth);

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

async function executeJobs(ns, targetNames, batchQueueForDifferentTargets, player, environment, homeMemoryLimitations) {
    const hackScript = 'scripts/hacking/hack.js';
    const growScript = 'scripts/hacking/grow.js';
    const weakenScript = 'scripts/hacking/weaken.js';

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
                        let amountToWeaken = targetServer.hackDifficulty - targetServer.minDifficulty;

                        if (job.type === "weaken-after-hack") {
                            amountToWeaken = batchForTarget.securityWeNeedToReduceAfterFullHack;
                        }

                        if (job.type === "weaken-after-grow") {
                            amountToWeaken = batchForTarget.securityWeNeedToReduceAfterFullGrowth;
                        }

                        const ifStartedNowWeakenDoneAt = getWeakenEndDate(ns, targetServer, player, amountToWeaken);
                        shouldExecute = shouldWeExecute(job, ifStartedNowWeakenDoneAt, batchOfJobs, ns);

                        if (shouldExecute === false) {
                            continue;
                        }

                        script = weakenScript;


                        numberOfThreads = getNumberOfThreadsToWeaken(ns, 1, amountToWeaken);
                        ramCost = ramNeededForWeaken * numberOfThreads;

                        machineToRunOn = getMachineWithEnoughRam(ns, ramCost, environment, homeMemoryLimitations);

                        if (machineToRunOn && machineToRunOn.cpuCores > 1) {
                            numberOfThreads = getNumberOfThreadsToWeaken(ns, machineToRunOn.cpuCores, amountToWeaken);
                        }
                    }

                    if (job.type.startsWith("grow")) {
                        const ifStartedNowGrowDoneAt = getGrowEndDate(ns, targetServer, player);
                        shouldExecute = shouldWeExecute(job, ifStartedNowGrowDoneAt, batchOfJobs, ns);

                        if (shouldExecute === false) {
                            continue;
                        }

                        script = growScript;

                        if (job.type !== "grow-dynamic") {
                            targetServer.moneyAvailable = 0;
                        }

                        numberOfThreads = getGrowThreads(ns, targetServer, player, 1);
                        ramCost = ramNeededForGrow * numberOfThreads;

                        machineToRunOn = getMachineWithEnoughRam(ns, ramCost, environment, homeMemoryLimitations);

                        if (machineToRunOn && machineToRunOn.cpuCores > 1) {
                            numberOfThreads = getGrowThreads(ns, targetServer, player, machineToRunOn.cpuCores);
                        }
                    }

                    if (job.type.startsWith("hack")) {
                        const ifStartedNowHackDoneAt = getHackEndDate(ns, targetServer, player);
                        shouldExecute = shouldWeExecute(job, ifStartedNowHackDoneAt, batchOfJobs, ns);

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

                        machineToRunOn = getMachineWithEnoughRam(ns, ramCost, environment, homeMemoryLimitations);
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

function shouldWeExecute(job, ifStartedNowWeWouldBeDoneAtString, batchOfJobs, ns) {

    const endBeforeDate = new Date(job.endBefore);
    const endAfterDate = new Date(job.endAfter);
    const ifStartedNowWeWouldBeDoneAt = new Date(ifStartedNowWeWouldBeDoneAtString)

    if (!job.firstLookStartedNowEndAt) {
        job.firstLookStartedNowEndAt = ifStartedNowWeWouldBeDoneAt;
    }

    if (endAfterDate > ifStartedNowWeWouldBeDoneAt) {
        job.lastMissForDoneBeforeWindow = ifStartedNowWeWouldBeDoneAt;
    }

    if (ifStartedNowWeWouldBeDoneAt > endBeforeDate) {
        if (!job.firstMissForAfterWindow) {
            job.firstMissForAfterWindow = ifStartedNowWeWouldBeDoneAt;
            batchOfJobs.poisonedBatch = true;
        }
    }

    if (endAfterDate < ifStartedNowWeWouldBeDoneAt && ifStartedNowWeWouldBeDoneAt < endBeforeDate) {
        job.expectedEndTime = ifStartedNowWeWouldBeDoneAt;
        return true;
    }

    return false;
}

function getMachineWithEnoughRam(ns, ramNeeded, enviroment, homeMemoryLimitations) {
    let machineToRunOn;

    const allHackedMachines = enviroment
        .filter(x => x.server.hasAdminRights);

    const homeServer = getServer(ns, "home", homeMemoryLimitations);

    allHackedMachines.push({ name: "home", server: homeServer })

    const machinesWithRamAvailable = allHackedMachines
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

function prepServerForBatching(targetServer, batchForTarget, ns, player, nameOfTarget, anyBatchNotPrepping) {
    const amountToWeaken = targetServer.hackDifficulty - targetServer.minDifficulty;
    const serverHasMaxMoney = targetServer.moneyMax === targetServer.moneyAvailable;
    const currentTime = new Date();

    if (amountToWeaken === 0 && serverHasMaxMoney && batchForTarget.securityWeNeedToReduceAfterFullHack && batchForTarget.securityWeNeedToReduceAfterFullGrowth && batchForTarget.prepStage && batchForTarget.originalNumberOfThreadsForFullMoney) {

        if (averageErrorRateOver10Minutes < errorRateAtWhichWeAllowNewThings || !anyBatchNotPrepping) {
            batchForTarget.prepStage = false;
            batchForTarget.targetMachineSaturatedWithAttacks = false;
            ns.toast(`Added ${nameOfTarget} to in process batch attack.`, 'success')
        }
    }

    if (batchForTarget.prepStage) {
        batchForTarget.targetMachineSaturatedWithAttacks = false;

        if (batchForTarget.successfulWeakening === false) {
            if (currentTime > new Date(batchForTarget.weakeningDoneAfter) || !batchForTarget.weakeningDoneAfter) {
                if (amountToWeaken !== 0) {
                    let endDate = new Date();
                    endDate = getWeakenEndDate(ns, targetServer, player, targetServer.hackDifficulty - targetServer.minDifficulty);
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

function addNewTargetsToQueueIfNeeded(batchQueue, targetNames, ns, enviroment, player, noMoreInvestingForEndGame, homeMemoryLimitations) {
    const batchesAreSaturated = targetNames.map(x => batchQueue.get(x)).every(x => x.targetMachineSaturatedWithAttacks);
    const over2andAHalfTrillionDollars = ns.getServerMoneyAvailable("home") > 2_500_000_000_000;
    const massiveRamOnHome = getServer(ns, "home", homeMemoryLimitations).maxRam > 400_000;

    let addNewServerToAttack = false;

    if (batchQueue.size < 15 && batchesAreSaturated && averageErrorRateOver10Minutes < errorRateAtWhichWeAllowNewThings && !noMoreInvestingForEndGame) {
        addNewServerToAttack = true;
    }

    if (over2andAHalfTrillionDollars && batchQueue.size < 20) {
        addNewServerToAttack = true;
    }

    if (over2andAHalfTrillionDollars && batchesAreSaturated && batchQueue.size < 50) {
        addNewServerToAttack = true;
    }

    if(massiveRamOnHome && batchQueue.size < 50){
        addNewServerToAttack = true;
    }

    if (batchQueue.size < 2 || addNewServerToAttack) {

        const allHackedMachines = enviroment
            .filter(x => x.server.hasAdminRights);

        const allMachinesByOrderOfValue = allHackedMachines
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

function getWeakenEndDate(ns, targetServer, player, difficultyToWeaken) {
    let endDate = new Date();
    targetServer.hackDifficulty = targetServer.minDifficulty + difficultyToWeaken;

    const howLongToWeaken = ns.formulas.hacking.weakenTime(targetServer, player);

    endDate.setMilliseconds(endDate.getMilliseconds() + howLongToWeaken);
    return endDate;
}

function getGrowEndDate(ns, targetServer, player) {
    let endDate = new Date();
    targetServer.moneyAvailable = 0;
    targetServer.hackDifficulty = targetServer.minDifficulty;

    const howLongToGrow = ns.formulas.hacking.growTime(targetServer, player);

    endDate.setMilliseconds(endDate.getMilliseconds() + howLongToGrow);
    return endDate;
}

function getHackEndDate(ns, targetServer, player) {
    let endDate = new Date();
    targetServer.moneyAvailable = targetServer.moneyMax;
    targetServer.hackDifficulty = targetServer.minDifficulty;

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


class ReserveForTrading {
    stockMarketReserveMoneyLimit = 1_500_000_000_000;
    capitalToReserveForTrading = 500_000_000;
    moneyInvested = 0;
    moneyRequested = new Map();
    countOfVisitedWithoutFillingRequest = 0;


    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    canSellAmountAndStillHaveReserve(amountToSell) {
        return (this.moneyInvested - amountToSell) > this.capitalToReserveForTrading;
    }

    setMoneyInvested(moneyInvested, ns) {
        this.moneyInvested = moneyInvested;

        const potentialCapitalReserve = (moneyInvested + ns.getServerMoneyAvailable("home")) * .85;

        this.capitalToReserveForTrading = Math.max(...[potentialCapitalReserve, this.capitalToReserveForTrading]);

        if (this.capitalToReserveForTrading > this.stockMarketReserveMoneyLimit) {
            this.capitalToReserveForTrading = this.stockMarketReserveMoneyLimit;
        }

        this.countOfVisitedWithoutFillingRequest++;
    }

    canSpend(ns, moneyNeeded) {
        const moneyOnHome = ns.getServerMoneyAvailable("home");

        let moneyToSaveForTrading = this.capitalToReserveForTrading - this.moneyInvested;

        if (moneyToSaveForTrading < 0) {
            moneyToSaveForTrading = 0;
        }

        if (moneyToSaveForTrading > this.stockMarketReserveMoneyLimit) {
            moneyToSaveForTrading = this.stockMarketReserveMoneyLimit;
        }

        const canSpend = moneyNeeded < moneyOnHome - moneyToSaveForTrading

        if (canSpend === false) {
            this.requestMoney(ns, moneyNeeded);
        } else {
            this.moneyRequested = new Map(Array.from(this.moneyRequested));

            const nameOfRequest = "batch-dispatch";
            this.moneyRequested.delete(nameOfRequest);
            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
        }

        return canSpend;
    }

    requestMoney(ns, amount) {
        const nameOfRequest = "batch-dispatch";
        this.moneyRequested = new Map(Array.from(this.moneyRequested));

        const moneyRequestedPreviously = this.moneyRequested.get(nameOfRequest);
        if (moneyRequestedPreviously) {
            if (moneyRequestedPreviously < amount) {
                this.moneyRequested.set(nameOfRequest, amount);
                this.moneyRequested = Array.from(this.moneyRequested);

                const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
                ns.rm(stockMarketReserveMoneyFile);
                ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
            }
        } else {
            this.moneyRequested.set(nameOfRequest, amount);
            this.moneyRequested = Array.from(this.moneyRequested);

            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
        }
    }
}
