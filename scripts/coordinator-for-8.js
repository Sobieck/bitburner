//run scripts/coordinator.js 1000 564 5.629 BitRunners
export async function main(ns) {
    const loopEveryXSeconds = 2;
    const sleepTotalOfXMS = loopEveryXSeconds * 1000;
    const numberOfDifferentSleeps = 5;
    const individualSleepAmount = sleepTotalOfXMS / numberOfDifferentSleeps;
    let dispatchScript = 'scripts/hacking/memory-starved-dispatch.js';

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


        ns.run('scripts/stock/get-stock-quotes.js');
        await ns.sleep(individualSleepAmount);

        await singularityStuff(ns);
    }


    async function singularityStuff(ns) {
        await doSingularityWork(ns, 'backdoor-all-machines')
        await doSingularityWork(ns, 'join-organziations');
        await doSingularityWork(ns, 'do-work');
        // await doSingularityWork(ns, 'finish-round');
        await doSingularityWork(ns, 'finish-bitnode');
        await doSingularityWork(ns, 'study-computer-science');
        await doSingularityWork(ns, 'create-early-programs');
        await doSingularityWork(ns, 'do-job');
        await doSingularityWork(ns, 'buy-rep');
        await doSingularityWork(ns, 'workout');
        // await doSingularityWork(ns, 'upgade-home-machine');
        await doSingularityWork(ns, 'travel-to-get-augs');
    }

    async function doSingularityWork(ns, script) {
        ns.run(`scripts/singularity/${script}.js`);

        await ns.sleep(individualSleepAmount / 12);
    }
}

