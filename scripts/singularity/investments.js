export async function main(ns) {

    // do one investment per thing.


    const moneyAvailable = ns.getServerMoneyAvailable("home");
    const numberOfPurchasedServers = ns.getPurchasedServers().length;


    if (moneyAvailable > 5_000_000_000) {
        if (!ns.fileExists("Formulas.exe")) {
            checkTor(ns);
            ns.singularity.purchaseProgram("Formulas.exe");
            workingOnGettingAugmentsOrPrograms = true;
        }
    }

    const homeUpgradeCost = ns.singularity.getUpgradeHomeRamCost();

    if (homeUpgradeCost < 100_000_000 && moneyAvailable > homeUpgradeCost) {
        ns.singularity.upgradeHomeRam()
    }

    if (homeUpgradeCost < 7_000_000_000 && moneyAvailable > homeUpgradeCost && moneyAvailable > 7_000_000_000) {
        ns.singularity.upgradeHomeRam()
    }

    if (homeUpgradeCost < 100_000_000_000 && moneyAvailable > homeUpgradeCost && moneyAvailable > 100_000_000_000) {
        ns.singularity.upgradeHomeRam()
    }

    if(numberOfPurchasedServers < 10 || ns.fileExists("Formulas.exe")){
        ns.run('scripts/investments/purchase-server.js')
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




    // buy programs.

    // once servers are all installed, we can spend up to 60 billion on home ram

    // then trigger floating server.    
}

function checkTor(ns) {
    if (!ns.hasTorRouter()) {
        ns.singularity.purchaseTor()
    }
}