export async function main(ns) {

    let serversUsedForBatching = [];
    const nameOfServersUsedFile = "data/serversUsedForBatching.txt";
    const batchQueuesFileName = "data/batchQueue.txt"
    const hackScript = 'scripts/advanced-hacks/hack.js'
    const growScript = 'scripts/advanced-hacks/grow.js'
    const weakenScript = 'scripts/advanced-hacks/weaken.js'

    if (ns.fileExists(nameOfServersUsedFile)) {
        serversUsedForBatching = JSON.parse(ns.read(nameOfServersUsedFile))
    }

    if (!serversUsedForBatching.includes("home")) {
        serversUsedForBatching.push("home")
    }

    let batchQueue = new Map();
    if (ns.fileExists(batchQueuesFileName)) {
        batchQueue = new Map(JSON.parse(ns.read(batchQueuesFileName)));
    }

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const targetNames = Array.from(batchQueue.keys());
    const player = ns.getPlayer();

    giveBatchQueueStructure(targetNames, batchQueue);
    cleanFinishedJobsFromQueue(targetNames, batchQueue);
    addServerToHackingPoolIfNeedBe(serversUsedForBatching, ns, batchQueue, enviroment);
    addNewTargetsToQueueIfNeeded(batchQueue, targetNames, ns, enviroment);


    for (const nameOfTarget of targetNames) {
        const targetServer = ns.getServer(nameOfTarget);
        const batch = batchQueue.get(nameOfTarget);
        const amountToWeaken = targetServer.hackDifficulty - targetServer.minDifficulty;
        const serverHasMaxMoney = targetServer.moneyMax === targetServer.moneyAvailable;
        const currentTime = new Date();

        if (amountToWeaken === 0 && serverHasMaxMoney && batch.securityWeNeedToReduceAfterFullHack && batch.securityWeNeedToReduceAfterFullGrowth) {
            batch.prepStage = false;
        }

        if (batch.prepStage) {

            if (batch.successfulWeakening === false) {
                if (currentTime > new Date(batch.weakeningDoneAfter) || !batch.weakeningDoneAfter) {
                    if (amountToWeaken !== 0) {
                        let endDate = new Date()
                        endDate = getWeakenEndDate(ns, targetServer, player);
                        addSecondsToDate(endDate, 10)

                        const job = new JobHasTo(new Date(), endDate, "initial-weaken");
                        batch.jobs.push(job);
                        batch.weakeningDoneAfter = endDate;
                    } else if (amountToWeaken === 0) {
                        batch.successfulWeakening = true;
                    }
                }
            }

            if (batch.successfulWeakening && batch.successfulGrowing === false) {
                if (currentTime > new Date(batch.growDoneAfter) || !batch.growDoneAfter) {

                    if (serverHasMaxMoney === false) {

                        if (targetServer.moneyAvailable === 0) {
                            const serverDoingHackin = getServerWithMostUnallocatedSpace(ns, serversUsedForBatching, batchQueue);
                            const growThreads = getGrowThreads(ns, targetServer, player, serverDoingHackin);
                            batch.securityWeNeedToReduceAfterFullGrowth = ns.growthAnalyzeSecurity(growThreads, nameOfTarget, serverDoingHackin.cpuCores);
                        }

                        const growTime = ns.formulas.hacking.growTime(targetServer, player);

                        let endDate = new Date()
                        addMillisecondsToDate(endDate, growTime);
                        addSecondsToDate(endDate, 10)

                        const job = new JobHasTo(new Date(), endDate, "initial-grow");
                        batch.job.push(job);
                        batch.growDoneAfter = endDate;
                    }


                    if (serverHasMaxMoney) {
                        batch.successfulGrowing = true;
                        batch.successfulWeakening = false;
                    }
                }
            }

            if (batch.successfulGrowing && batch.successfulHacking === false) {

                if (currentTime > new Date(batch.hackDoneAfter) || !batch.hackDoneAfter) {
                    if (serverHasMaxMoney) {
                        if (currentTime > new Date(batch.hackDoneAfter)) {

                            batch.successfulWeakening = false;
                            batch.successfulGrowing = false;
                            batch.successfulHacking = false;
                            batch.hackDoneAfter = undefined;

                        } else {
                            const hackThreads = getHackThreadsForTotalStealing(ns, nameOfTarget, targetServer);
                            batch.securityWeNeedToReduceAfterFullHack = ns.hackAnalyzeSecurity(hackThreads, nameOfTarget);

                            const hackTime = ns.formulas.hacking.hackTime(targetServer, player);

                            let endDate = new Date()
                            addMillisecondsToDate(endDate, hackTime);
                            addSecondsToDate(endDate, 10)
    
                            const job = new JobHasTo(new Date(), endDate, "initial-hack");
                            batch.job.push(job);
                            batch.hackDoneAfter = endDate;
                        }
                    }

                    if (targetServer.moneyAvailable === 0) {
                        batch.successfulGrowing = false;
                        batch.successfulWeakening = false;
                        batch.successfulHacking = true;
                    }
                }
            }
        }
    }
    // initial weakening
    // initial grow
    // next weakening 
    // initial hack
    // next weakening, record weakening needed
    // final grow
    // next weakening, record weakening needed
    // check to make sure everything is maxMoney and minDifficulty
    // if so, put it in the queue and start making money
    // run new hacks based on the queue. 
    // 




    // for (const theTarget of targets) {
    //     const targetServer = ns.getServer(theTarget);
    //     const batch = batchQueue.get(theTarget);
    //     const amountToWeaken = targetServer.hackDifficulty - targetServer.minDifficulty;
    //     const serverHasMaxMoney = targetServer.moneyMax === targetServer.moneyAvailable;


    //     if (batch.securityWeNeedToReduceAfterFullHack && batch.securityWeNeedToReduceAfterFullGrowth && batch.prepStage === true && currentTime > new Date(batch.finalPrepWeakeningDoneAfter) ) {
    //         // check to make sure those things are both min and max.
    //         batch.prepStage = false;
    //         batch.jobQueue.push(new BatchJob(currentTime))
    //     }

    //     if (batch.prepStage) {
    //         if (!batch.initialWeakeningDoneAfter) {


    //         } else if (!batch.initialGrowDoneAfter && currentTime > new Date(batch.initialWeakeningDoneAfter)) {
    //             if (amountToWeaken > 0) {
    //                 batch.initialWeakeningDoneAfter = undefined;
    //                 ns.tprint("initial weaken didn't work");
    //                 continue;
    //             }

    //             const endDate = new Date();

    //             if (!serverHasMaxMoney) {
    //                 const howManyThreadsToGrow = getGrowThreads(ns, targetServer, player, serverDoingHackin);
    //                

    //                 ns.scp(growScript, serverDoingHackin.hostname);
    //                 ns.exec(growScript, serverDoingHackin.hostname, howManyThreadsToGrow, theTarget);
    //                 endDate.setMilliseconds(endDate.getMilliseconds() + growTime);
    //             }

    //             batch.initialGrowDoneAfter = endDate;
    //         } 
    //         /// THERE NEEDS TO BE A WEAKEN HERE



    //         else if (!batch.initialHackDoneAfter && currentTime > new Date(batch.initialGrowDoneAfter)) {
    //             if (!serverHasMaxMoney) {
    //                 batch.initialGrowDoneAfter = undefined;
    //                 ns.tprint("initial grow didn't work")
    //                 continue;
    //             }

    //             const endDate = new Date();




    //             const serverToHack = ns.getServer(theTarget);
    //             serverToHack.hackDifficulty = serverToHack.minDifficulty;
    //             serverToHack.moneyAvailable = serverToHack.moneyMax;
    //             const timeToHack = ns.formulas.hacking.hackTime(serverToHack, player);

    //             ns.scp(hackScript, serverDoingHackin.hostname);
    //             ns.exec(hackScript, serverDoingHackin.hostname, hackThreads, theTarget);

    //             endDate.setMilliseconds(endDate.getMilliseconds() + timeToHack);
    //             batch.initialHackDoneAfter = endDate;
    //         } else if (currentTime > new Date(batch.initialHackDoneAfter) && !batch.securityWeNeedToReduceAfterFullGrowth) {
    //             if (serverHasMaxMoney) {
    //                 batch.securityWeNeedToReduceAfterFullHack = undefined;
    //                 batch.initialWeakeningDoneAfter = undefined;
    //                 batch.initialGrowDoneAfter = undefined;
    //                 batch.initialHackDoneAfter = undefined;
    //                 ns.tprint("hack failed, do over");
    //                 continue;
    //             } else {
    //                 const serverToHack = ns.getServer(theTarget);
    //                 serverToHack.hackDifficulty = serverToHack.minDifficulty;
    //                 serverToHack.moneyAvailable = 0;

    //                 const growThreads = getGrowThreads(ns, serverToHack, player, serverDoingHackin);

    //                 batch.securityWeNeedToReduceAfterFullGrowth = ns.growthAnalyzeSecurity(growThreads, theTarget, serverDoingHackin.cpuCores);

    //             }
    //         }  else if (currentTime > new Date(batch.finalGrowthDoneAfter)) {
    //             if (!serverHasMaxMoney){
    //                 batch.securityWeNeedToReduceAfterFullGrowth = undefined;
    //                 continue;
    //             } else {

    //             }
    //         }
    //     }

    //     // work through queue up here

    //     // new batch work
    //     if (batch.prepStage === false) {
    //         //select server where hacks will happen based on memory here

    //         const numberOfThreadsToWeakenAfterHack = getNumberOfThreadsToWeaken(ns, serverDoingHackin, batch.securityWeNeedToReduceAfterFullHack);
    //         const howManyThreadsToGrow = getGrowThreads(ns, targetServer, player, serverDoingHackin);
    //         const numberOfThreadsToWeakenAfterGrow = getNumberOfThreadsToWeaken(ns, serverDoingHackin, batch.securityWeNeedToReduceAfterFullHack);
    //         const hackThreads = getHackThreadsForTotalStealing(ns, theTarget, targetServer);



    //         // fire this off when we are actually doing a weaken. 
    //         const endDateForHackWeaken = getWeakenEndDate(ns, targetServer, player);


    //         // minimize security hack minimize
    //         // grow 
    //         // minimize security grow minimize
    //         // hack - done
    //     }
    // }

    ns.rm(nameOfServersUsedFile);
    ns.write(nameOfServersUsedFile, JSON.stringify(serversUsedForBatching), "W")

    ns.rm(batchQueuesFileName);
    ns.write(batchQueuesFileName, JSON.stringify(Array.from(batchQueue.entries()), "W"));

    ns.run('scripts/advanced-dispatch.js');
}

class BatchQueue {
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

    jobQueue = [];

    getAllocatedMemory(machineRunningOn) {
        return this.jobQueue
            .filter(x => x.machineRunningOn === machineRunningOn)
            .map(x => x.jobTotalRamCost)
            .reduce((acc, x) => acc + x, 0);
    }

    getMaxMemoryForAJob(machineRunningOn) {
        return Math.max(...this.jobQueue
            .filter(x => x.machineRunningOn === machineRunningOn)
            .map(x => x.jobTotalRamCost));
    }
}

class BatchJob {
    jobs = [];
    //6 second window? 2 cycles seems like enough for each step.

    startTime;
    machineRunningOn;
    jobTotalRamCost;

    wholeBatchFinishsBefore() {
        return Math.max(...this.jobs.map(x => new Date(x.endBefore)))
    }

    constructor(obj) {
        obj && Object.assign(this, obj);
    }
}

class JobHasTo {
    executed = false;
    constructor(endAfter, endBefore, type) {
        this.endAfter = endAfter;
        this.endBefore = endBefore;
        this.type = type;
        this.types = ["grow", "hack", "weaken-after-hack", "weaken-after-grow", "initial-weaken", "initial-grow", "initial-hack"]
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
            serversUsedForBatching.push(serverToAdd.name);
        }
    }
}

function getServerWithMostUnallocatedSpace(ns, serversUsedForBatching, batchQueue) {
    let server;
    let serversUnallocatedSpace;
    for (let i = 0; i < serversUsedForBatching.length; i++) {
        const serverName = serversUsedForBatching[i];
        if (!server) {
            serversUnallocatedSpace = getUnallocatedMemoryOnServer(ns, serverName, batchQueue);
            server = getServer(ns, serverName);
        } else {
            const nextServersUnallocatedSpace = getUnallocatedMemoryOnServer(ns, serverName, batchQueue);

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
        targetObject = new BatchQueue(targetObject);

        for (let i = 0; i < targetObject.jobQueue.length; i++) {
            targetObject.jobQueue[i] = new BatchJob(targetObject.jobQueue[i]);
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

        for (let i = batch.jobQueue.length - 1; i > -1; i--) {
            const job = batch.jobQueue[i];
            if (job.wholeBatchFinishsBefore() < currentTime) {
                batch.targetMachineSaturatedWithAttacks = true;
                batch.jobQueue.splice(i, 1);
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

        batchQueue.set(mostValuableMachine.name, new BatchQueue());
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
