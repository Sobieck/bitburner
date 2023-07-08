export async function main(ns) {
    const ramObservationsTextFile = '../../data/ramObservations.txt';
    const moneyAvailable = ns.getServerMoneyAvailable("home");
  
    
    const stopInvestingFileName = "stopInvesting.txt";
    if (ns.fileExists(stopInvestingFileName)) {
        if (ns.fileExists(ramObservationsTextFile)) {
            ns.rm(ramObservationsTextFile);
        }
        return;
    }


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

    purchaseProgram(ns, 50, "BruteSSH.exe");
    purchaseProgram(ns, 100, "FTPCrack.exe");
    purchaseProgram(ns, 250, "relaySMTP.exe");
    purchaseProgram(ns, 500, "HTTPWorm.exe");
    purchaseProgram(ns, 750, "SQLInject.exe");


    if (moneyAvailable > 1_000_000_000_000) {
        const endDate = new Date();
        endDate.setHours(endDate.getHours() + 6);
        ns.run('scripts/investments/invest-in-nodes.js', 1, endDate.toISOString())
    }
  
}

function purchaseProgram(ns, atWhatHackingLevelToBuy, programToBuy) {
    const playerHackingLevel = ns.getHackingLevel();
    if (!ns.fileExists(programToBuy) && playerHackingLevel > atWhatHackingLevelToBuy) {
        checkTor(ns);
        ns.singularity.purchaseProgram(programToBuy);
    }
}

function checkTor(ns) {
    if (!ns.hasTorRouter()) {
        ns.singularity.purchaseTor()
    }
}