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

    
    // clean queue up here.
    // if a job is passed its expire date, delete it off the queue. 
    // change the queue to saturated hack server
// decide to bring in new machine for doing the work of hackin
    // check environment, if the machines currently in the pool all have less than 100gigs free, pull in new purchased machine. Do this until we have no more purchased machines. Let the machines with less than 100g total just languish hacking the old way. 

    

    addNewTargetsToQueueIfNeeded(batchQueue, targetNames, ns, enviroment);


    // initialize
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
    
    const serverDoingHackin = ns.getServer("home"); // make this an array of servers
    const player = ns.getPlayer();
    
    const currentTime = new Date();



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
    //             let endDate = new Date()

    //             if (amountToWeaken !== 0) {
                    
    //                 let numberOfThreadsToWeaken = getNumberOfThreadsToWeaken(ns, serverDoingHackin, amountToWeaken);

    //                 endDate = getWeakenEndDate(ns, targetServer, player);


    //                 ns.scp(weakenScript, serverDoingHackin.hostname);
    //                 ns.exec(weakenScript, serverDoingHackin.hostname, numberOfThreadsToWeaken, theTarget);
    //             }

    //             batch.initialWeakeningDoneAfter = endDate;

    //         } else if (!batch.initialGrowDoneAfter && currentTime > new Date(batch.initialWeakeningDoneAfter)) {
    //             if (amountToWeaken > 0) {
    //                 batch.initialWeakeningDoneAfter = undefined;
    //                 ns.tprint("initial weaken didn't work");
    //                 continue;
    //             }

    //             const endDate = new Date();

    //             if (!serverHasMaxMoney) {
    //                 const howManyThreadsToGrow = getGrowThreads(ns, targetServer, player, serverDoingHackin);
    //                 const growTime = ns.formulas.hacking.growTime(targetServer, player);

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

    //             const hackThreads = getHackThreadsForTotalStealing(ns, theTarget, targetServer);
    //             batch.securityWeNeedToReduceAfterFullHack = ns.hackAnalyzeSecurity(hackThreads, theTarget);


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
    prepStage = true;
    targetMachineSaturatedWithAttacks = false;

    weakeningDoneAfter;
    initialGrowDoneAfter;
    initialHackDoneAfter;

    securityWeNeedToReduceAfterFullHack;
    securityWeNeedToReduceAfterFullGrowth;

    jobQueue = [];
}

class BatchJob {
    hackWeakenJob;
    growWeakenJob;

    growJob;
    hackJob;

    //6 second window? 2 cycles seems like enough for each step.

    constructor(startTime, machineRunningOn, batchEndTime, jobRamCost) {
        this.startTime = startTime;
        this.machineRunningOn = machineRunningOn;
        this.batchEndTime = batchEndTime;
        this.jobTotalRamCost = jobTotalRamCost;
    }
}

class JobHasTo {
    constructor(endAfter, endBefore) {
        this.endAfter = endAfter;
        this.endBefore = endBefore;
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
