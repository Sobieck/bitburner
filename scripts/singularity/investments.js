export async function main(ns) {
    const ramObservationsTextFile = '../../data/ramObservations.txt';
    const stopInvestingFileName = "stopInvesting.txt";
    if (ns.fileExists(stopInvestingFileName)) {
        if (ns.fileExists(ramObservationsTextFile)) {
            ns.rm(ramObservationsTextFile);
        }
        return;
    }

    const moneyAvailable = ns.getServerMoneyAvailable("home");
    const numberOfPurchasedServers = ns.getPurchasedServers().length;

    if (moneyAvailable > 5_000_000_000) {
        if (!ns.fileExists("Formulas.exe")) {
            checkTor(ns);
            ns.singularity.purchaseProgram("Formulas.exe");
            ns.rm(ramObservationsTextFile);
            ns.rm('../../buyOrUpgradeServerFlag.txt');
        }
    }

    const environment = JSON.parse(ns.read("data/enviroment.txt"));
    const countOfPurchasedServersWithLessThan2048Gigs = environment
        .filter(x => x.server.maxRam < 2048 && x.server.purchasedByPlayer)
        .length;

    if ((numberOfPurchasedServers < 10 || countOfPurchasedServersWithLessThan2048Gigs !== 0) && !ns.fileExists("Formulas.exe")) {
        let upgradeOnly = false;

        if (countOfPurchasedServersWithLessThan2048Gigs !== 0) {
            upgradeOnly = true;
        }

        ns.run("scripts/investments/purchase-server.js", 1, 2048, upgradeOnly)
    }

    if (ns.fileExists("Formulas.exe")) {
        ns.run('scripts/investments/purchase-server.js');
    }

    if (!ns.fileExists("BruteSSH.exe")) {
        checkTor(ns);
        ns.singularity.purchaseProgram("BruteSSH.exe");
    }

    if (!ns.fileExists("FTPCrack.exe")) {
        checkTor(ns);
        ns.singularity.purchaseProgram("FTPCrack.exe");
    }

    if (!ns.fileExists("relaySMTP.exe")) {
        checkTor(ns);
        ns.singularity.purchaseProgram("relaySMTP.exe");
    }

    if (!ns.fileExists("HTTPWorm.exe")) {
        checkTor(ns);
        ns.singularity.purchaseProgram("HTTPWorm.exe");
    }

    if (!ns.fileExists("SQLInject.exe")) {
        checkTor(ns);
        ns.singularity.purchaseProgram("SQLInject.exe");
    }
}

function checkTor(ns) {
    if (!ns.hasTorRouter()) {
        ns.singularity.purchaseTor()
    }
}