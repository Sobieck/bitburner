//run scripts/coordinator.js 1000 564 5.629 BitRunners
export async function main(ns) {
    const loopEveryXSeconds = 3;
    const sleepTotalOfXMS = loopEveryXSeconds * 1000;
    const numberOfDifferentSleeps = 4;
    const individualSleepAmount = sleepTotalOfXMS / numberOfDifferentSleeps;
    let dispatchScript = 'scripts/advanced-dispatch.js';

    while (true) {

        if (ns.fileExists('Formulas.exe')) {
            dispatchScript = 'scripts/batch-dispatch.js'
        }

        ns.run("scripts/scan.js", 1, dispatchScript); // this triggers all hacks. But we need to analyse the environment first. 
        await ns.sleep(individualSleepAmount); // need rest between actions for some fing reason. 




        ns.run('scripts/singularity/singularity-coordinator.js');
        await ns.sleep(individualSleepAmount);


        // do a file check for stocks, purchase the api in a singularity script sometime. low priority


        const moneyAvailable = ns.getServerMoneyAvailable("home");

        if (moneyAvailable > 1_000_000_000_000) {
            const endDate = new Date();
            endDate.setHours(endDate.getHours() + 24);
            ns.run('scripts/investments/invest-in-nodes.js', 1, endDate.toISOString())
        }
        await ns.sleep(individualSleepAmount);



        ns.run('scripts/contracts/coding-contracts.js');
        await ns.sleep(individualSleepAmount);
        

    }
}