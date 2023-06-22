// only starts when tor -> analyse gets bought. That should be something we are looking for after we've spun up all the servers. 

// 

// analyse the profitability/ ram cost of each server. sort by most profitable. -> once something is ided as needed to be hacked, we dispatch a weaken to get it to min, with a grow to get it to max. Then it enters the normal flow. 

//    the weaken for the grow phase is the first mover. Its end is the start of the window for the grow. This one gets dispatched first.
//    the grow needs to finish at after the end time of the  time
//    the 

// First - server name of being hacked. Batch end times. If the last batch end time is after the minimum end time for the next batch, we can dispatch the batch. 
// batch data 
//start, end of whole batch
//start, end, server of where things will be run. This is important for cleanup. 

// Second, jobs queued to hacking servers + ram reserved. This ram reserved will be summed with the ram being used on the machine to see if we can add more jobs.
// startAfter job type  

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

    // no targeting is bein done
    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const helpers = new Helpers(ns);
    const portsWeCanPop = helpers.numberOfPortsWeCanPop();
    const currentHackingLevel = ns.getHackingLevel();

    if (batchQueue.size === 0) {
        // only trigger if we need a new target
        const allHackableMachines = enviroment
            .filter(x => x.server.requiredHackingSkill < currentHackingLevel)
            .filter(x => x.server.numOpenPortsRequired <= portsWeCanPop || x.server.purchasedByPlayer);

        allHackableMachines
            .filter(x => !x.server.hasAdminRights)
            .map(x => helpers.hackMachine(x.name));

        // we can probabably refine this to account for difficulty. 
        const allMachinesByOrderOfValue = allHackableMachines
            .filter(x => !x.server.purchasedByPlayer && x.server.moneyMax !== 0)
            .sort((a, b) => b.server.moneyMax - a.server.moneyMax);

        const mostValuableMachine = allMachinesByOrderOfValue[0];

        batchQueue.set(mostValuableMachine.name, new BatchQueue())
    }
    
    const serverDoingHackin = ns.getServer("home");
    const player = ns.getPlayer();
    const targets = batchQueue.keys();
    const currentTime = new Date();

    for (const theTarget of targets) {
        const targetServer = ns.getServer(theTarget);
        const batch = batchQueue.get(theTarget);
        const amountToWeaken = targetServer.hackDifficulty - targetServer.minDifficulty;
        const serverHasMaxMoney = targetServer.moneyMax === targetServer.moneyAvailable;
        // ns.tprint(currentTime)
        // ns.tprint(new Date(batch.initialWeakeningDoneAfter));

        if (batch.securityWeNeedToReduceAfterFullHack && batch.securityWeNeedToReduceAfterFullGrowth && batch.startOnFinalGrowthWeakenings) {
            batch.prepStage = false;
            batch.jobQueue.push(new BatchJob(currentTime, true))
        }

        if (batch.prepStage) {
            if (!batch.initialWeakeningDoneAfter) {
                let numberOfThreadsToWeaken = 0;
                let foundNumberOfThreads = false;
                const endDate = new Date();

                if (amountToWeaken !== 0) {
                    while (!foundNumberOfThreads) {
                        numberOfThreadsToWeaken++

                        const amountNumberOfThreadsWillWeaken = Math.ceil(ns.weakenAnalyze(numberOfThreadsToWeaken, serverDoingHackin.cpuCores));
                        if (amountNumberOfThreadsWillWeaken > amountToWeaken) {
                            foundNumberOfThreads = true;
                        }
                    }

                    const howLongToWeaken = ns.formulas.hacking.weakenTime(targetServer, player);

                    endDate.setMilliseconds(endDate.getMilliseconds() + howLongToWeaken);

                    ns.scp(weakenScript, serverDoingHackin.hostname);
                    ns.exec(weakenScript, serverDoingHackin.hostname, numberOfThreadsToWeaken, theTarget);
                }

                batch.initialWeakeningDoneAfter = endDate;

            } else if (!batch.initialGrowDoneAfter && currentTime > new Date(batch.initialWeakeningDoneAfter)) {
                if (amountToWeaken > 0) {
                    batch.initialWeakeningDoneAfter = undefined;
                    ns.tprint("initial weaken didn't work");
                    continue;
                }

                const endDate = new Date();

                if (!serverHasMaxMoney) {
                    const howManyThreadsToGrow = Math.ceil(ns.formulas.hacking.growThreads(targetServer, player, targetServer.moneyMax, serverDoingHackin.cpuCores));
                    const growTime = ns.formulas.hacking.growTime(targetServer, player);

                    ns.tprint(howManyThreadsToGrow);

                    ns.scp(growScript, serverDoingHackin.hostname);
                    ns.exec(growScript, serverDoingHackin.hostname, howManyThreadsToGrow, theTarget);
                    endDate.setMilliseconds(endDate.getMilliseconds() + growTime);
                }

                batch.initialGrowDoneAfter = endDate;
            } else if (!batch.securityWeNeedToReduceAfterFullHack && currentTime > new Date(batch.initialGrowDoneAfter)) {
                if (!serverHasMaxMoney) {
                    batch.initialGrowDoneAfter = undefined;
                    ns.tprint("initial grow didn't work")
                    continue;
                }

                const endDate = new Date();

                const hackThreads = Math.ceil(ns.hackAnalyzeThreads(theTarget, targetServer.moneyAvailable));
                batch.securityWeNeedToReduceAfterFullHack = ns.hackAnalyzeSecurity(hackThreads, theTarget);


                const serverToHack = ns.getServer(theTarget);
                serverToHack.hackDifficulty = serverToHack.minDifficulty;
                serverToHack.moneyAvailable = serverToHack.moneyMax;
                const timeToHack = ns.formulas.hacking.hackTime(serverToHack, player);

                ns.scp(hackScript, serverDoingHackin.hostname);
                ns.exec(hackScript, serverDoingHackin.hostname, hackThreads, theTarget);

                endDate.setMilliseconds(endDate.getMilliseconds() + timeToHack);
                batch.initialHackDoneAfter = endDate;
            } else if (currentTime > new Date(batch.initialHackDoneAfter) && !batch.securityWeNeedToReduceAfterFullGrowth) {
                if (serverHasMaxMoney) {
                    batch.securityWeNeedToReduceAfterFullHack = undefined;
                    ns.tprint("hack failed, do over");
                    continue;
                } else {
                    const serverToHack = ns.getServer(theTarget);
                    serverToHack.hackDifficulty = serverToHack.minDifficulty;
                    serverToHack.moneyAvailable = 0;

                    const growThreads = Math.ceil(ns.formulas.hacking.growThreads(serverToHack, player, serverToHack.moneyMax, serverDoingHackin.cpuCores));

                    batch.securityWeNeedToReduceAfterFullGrowth = ns.growthAnalyzeSecurity(growThreads, theTarget, serverDoingHackin.cpuCores);
                    batch.startOnFinalGrowthWeakenings = true;
                }
            }
        }

        if (batch.prepStage === false) {
            ns.tprint(batchQueue);
        }
    }

    ns.rm(nameOfServersUsedFile);
    ns.write(nameOfServersUsedFile, JSON.stringify(serversUsedForBatching), "W")

    ns.rm(batchQueuesFileName);
    ns.write(batchQueuesFileName, JSON.stringify(Array.from(batchQueue.entries()), "W"));

    ns.run('scripts/advanced-dispatch.js');
}

class BatchQueue {
    prepStage = true;
    initialWeakeningDoneAfter;
    initialGrowDoneAfter;
    initialHackDoneAfter;

    securityWeNeedToReduceAfterFullHack;
    securityWeNeedToReduceAfterFullGrowth;

    jobQueue = [];
}

class BatchJob {
    batchEndTime;

    hackWeakenJob;
    growWeakenJob;

    growJob;
    hackJob;

    constructor(startTime, initialJob = false) {
        this.startTime = startTime;
        this.initialJob = initialJob;
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