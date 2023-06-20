//run scripts/coordinator.js 1000 564 5.629 BitRunners
export async function main(ns) {

    const targetRepInThousands = ns.args[0];
    const currentRepInThousands = ns.args[1];
    const currentRepPerSecond = ns.args[2];
    const factionName = ns.args[3];

    if (targetRepInThousands === undefined
        || currentRepInThousands === undefined
        || factionName === undefined
        || currentRepPerSecond === undefined) {
        ns.tprint("need inputs");
        return;
    }

    const timeLeftInSeconds = calculateTimeLeftInSeconds(targetRepInThousands, currentRepInThousands, currentRepPerSecond);
    const endDate = new Date();
    endDate.setSeconds(endDate.getSeconds() + timeLeftInSeconds);
    ns.tprint("End Date: ", endDate.toLocaleString());
    ns.tprint("Update node production multipliers.");

    let i = 0;
    const loopEveryXSeconds = 3;
    const sleepTotalOfXMS = loopEveryXSeconds * 1000;
    const numberOfDifferentSleeps = 5;
    const individualSleepAmount = sleepTotalOfXMS / numberOfDifferentSleeps;

    while (true) {
        i++;


        
        // ns.run("scripts/investments/invest-in-stocks.js");
        await ns.sleep(individualSleepAmount); // need rest between actions for some fing reason. 




        ns.run("scripts/scan.js", 1, 'scripts/advanced-dispatch.js'); // this triggers all hacks. But we need to analyse the environment first. 
        await ns.sleep(individualSleepAmount); // need rest between actions for some fing reason. 



        const currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
        if (currentNumberOfPurchasedServers < ns.getPurchasedServerLimit()) {

            const moneyAvailable = ns.getServerMoneyAvailable("home");

            const timeInMinutesToWaitToBuy = 5;
            const timeInSecondsToWaitToBuy = timeInMinutesToWaitToBuy * 60;
            let iterationsToWait = timeInSecondsToWaitToBuy / loopEveryXSeconds;

            if (moneyAvailable > 1_000_000_000) {
                iterationsToWait = 0;
            }

            if(moneyAvailable < 1_000_000_000){
                iterationsToWait = timeInSecondsToWaitToBuy / loopEveryXSeconds;
            }

            if (i >= iterationsToWait) {
                i = 0;
                ns.run('scripts/investments/purchase-server.js')
            }
        } else {
            const moneyAvailable = ns.getServerMoneyAvailable("home");

            if (moneyAvailable > 500_000_000_000) {
                ns.run('scripts/investments/upgrade-small-servers.js')
            }
        }
        await ns.sleep(individualSleepAmount);



        const moneyAvailable = ns.getServerMoneyAvailable("home");

        if (moneyAvailable > 1_000_000_000_000) {
            ns.run('scripts/investments/invest-in-nodes.js', 1, endDate.toISOString())
        }
        await ns.sleep(individualSleepAmount);



        ns.run('scripts/contracts/coding-contracts.js');
        await ns.sleep(individualSleepAmount);        
    }
}



function calculateTimeLeftInSeconds(targetRepInThousands, currentRepInThousands, currentRepPerSecond) {
    const repLeftInThousands = targetRepInThousands - currentRepInThousands;
    const repLeftInSeconds = repLeftInThousands * 1000;

    return repLeftInSeconds / currentRepPerSecond;
}

