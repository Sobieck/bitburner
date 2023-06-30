// replace servers with this as well. just a bool passed in, put them both in their own methods.

/** @param {NS} ns */
//run scripts/purchase-servers.js
export async function main(ns) {
    const buyOrUpgradeServerFlag = "../../buyOrUpgradeServerFlag.txt"
    const ramObservationsTextFile = '../../ramObservations.txt'
    let additionalRamNeeded = 0;
    let ramObservations = [];

    if (!ns.fileExists(buyOrUpgradeServerFlag)) {
        return;
    } else {
        if(ns.fileExists(ramObservationsTextFile)){
            ramObservations = JSON.parse(ns.read(ramObservationsTextFile));
            ns.rm(ramObservationsTextFile);
        }

        const latestRamNeeded = JSON.parse(ns.read(buyOrUpgradeServerFlag));

        ramObservations.push(latestRamNeeded);

        ns.rm(buyOrUpgradeServerFlag);
        ns.write(ramObservationsTextFile, JSON.stringify(ramObservations), "W");

        additionalRamNeeded = ramObservations.reduce((a,b) => a + b) / ramObservations.length;
    }

    let maxRam = 1048576;
    let upgradeOnly = false;

    if(ns.args[0]){
        maxRam = ns.args[0];
    }

    if(ns.args[1]){
        upgradeOnly = true;
    }

    const enviroment = JSON.parse(ns.read('../../data/enviroment.txt'));

    const playerPurchasedServers = enviroment
        .filter(x => x.server.purchasedByPlayer && x.server.maxRam < maxRam)
        .sort((b, a) => a.server.maxRam - b.server.maxRam)
        
    if (playerPurchasedServers.length === 0) {

        const currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
        if (currentNumberOfPurchasedServers < ns.getPurchasedServerLimit()) {
            purchaseServer(ns, ramObservationsTextFile, maxRam);
        } 
    } else {
        const smallestPlayerPurchasedServer = playerPurchasedServers.pop();
        upgradeSmallMachine(ns, smallestPlayerPurchasedServer, ramObservationsTextFile, maxRam, upgradeOnly, additionalRamNeeded);
    }
}

function purchaseServer(ns, ramObservationsTextFile, maxRam, additionalRamNeeded) {
    let currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
    let ram = 128;

    if (currentNumberOfPurchasedServers < ns.getPurchasedServerLimit()) {

        let purchaseCost = ns.getPurchasedServerCost(ram);
        let moneyAvailable = ns.getServerMoneyAvailable("home");

        if (moneyAvailable > purchaseCost) {

            let ramToBuy = ram;

            while ((moneyAvailable > ns.getPurchasedServerCost(ramToBuy)) && (ramToBuy < 2 * maxRam)) {
                ramToBuy = ramToBuy * 2;
            }

            ramToBuy = ramToBuy / 2;

            if(ramToBuy > additionalRamNeeded){
                const hostname = "CLOUD-" + String(currentNumberOfPurchasedServers).padStart(3, '0')
                ns.purchaseServer(hostname, ramToBuy);
                ns.rm(ramObservationsTextFile);
    
                currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
            }
        }
        else {
            // ns.tprint("Not enough money to buy new server")
        }
    } else {
        // ns.tprint("max servers already bought");
    }
}

function upgradeSmallMachine(ns, smallestPlayerPurchasedServer, ramObservationsTextFile, maxRam, upgradeOnly, additionalRamNeeded) {

    let ramToBuy = smallestPlayerPurchasedServer.server.maxRam * 2;

    while(!(ramToBuy - smallestPlayerPurchasedServer.server.maxRam > additionalRamNeeded)){
        ramToBuy = ramToBuy * 2;
    }

    if (ramToBuy >= maxRam) {
        ramToBuy = maxRam;
    }

    const costOfRamToBuy = ns.getPurchasedServerCost(ramToBuy);
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (moneyAvailable > costOfRamToBuy) {
        ns.upgradePurchasedServer(smallestPlayerPurchasedServer.name, ramToBuy);
        ns.rm(ramObservationsTextFile);
    } else {
        // ns.tprint("too expensive to buy ", ramToBuy, " $", Number((costOfRamToBuy).toFixed(2)).toLocaleString());
        if(upgradeOnly === false){
            purchaseServer(ns, ramObservationsTextFile, maxRam, additionalRamNeeded);
        }
    }
}
