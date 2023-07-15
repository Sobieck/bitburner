//run scripts/coordinator.js 1000 564 5.629 BitRunners


/// delete "numberOfThreads = 500"

export async function main(ns) {
    const loopEveryXSeconds = 2;
    const sleepTotalOfXMS = loopEveryXSeconds * 1000;
    const numberOfDifferentSleeps = 6;
    const individualSleepAmount = sleepTotalOfXMS / numberOfDifferentSleeps;
    let dispatchScript = 'scripts/hacking/memory-starved-dispatch-for-8.js';

    let runClean = true;
    if (ns.args[0] === 'old') {
        runClean = false;
    }

    if (runClean) {
        ns.run('scripts/clean.js', 1, "new");
        await ns.sleep(1000);
    }

    ns.run('scripts/precalculate-important-data.js')

    await ns.sleep(200);

    while (true) {

        if (ns.fileExists('Formulas.exe')) {
            dispatchScript = 'scripts/hacking/batch-dispatch.js'
        }

        ns.run("scripts/scan.js", 1, dispatchScript);
        await ns.sleep(individualSleepAmount);


        ns.run('scripts/hacking/hack-all-machines.js');
        await ns.sleep(individualSleepAmount);


        ns.run('scripts/contracts/contract-coordinator.js');
        await ns.sleep(individualSleepAmount);


        await stockStuff();

        ns.run('scripts/investments/investments-coordinator-for-8.js');
        await ns.sleep(individualSleepAmount);


        await singularityStuff();
    }

    async function stockStuff () {
        await doStockWork('get-stock-quotes');
        await doStockWork('populate-forecast');
        await doStockWork('invest-in-stocks');
        await doStockWork('buy-4s');
    }

    async function doStockWork (script){
        ns.run(`scripts/stock/${script}.js`);

        await ns.sleep(individualSleepAmount / 4);
    }

    async function singularityStuff() {
        await doSingularityWork('backdoor-all-machines')
        await doSingularityWork('join-organziations');
        await doSingularityWork('do-work');
        await doSingularityWork('finish-round');
        await doSingularityWork('finish-bitnode');
        await doSingularityWork('study-computer-science');
        await doSingularityWork('create-early-programs');
        await doSingularityWork('do-job');
        await doSingularityWork('buy-rep');
        await doSingularityWork('workout');
        await doSingularityWork('upgade-home-machine');
        await doSingularityWork('travel-to-get-augs');
    }

    async function doSingularityWork(script) {
        ns.run(`scripts/singularity/${script}.js`);

        await ns.sleep(individualSleepAmount / 12);
    }
}

