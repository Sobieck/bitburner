// replace servers with this as well. just a bool passed in, put them both in their own methods.

/** @param {NS} ns */
//run scripts/purchase-servers.js
export async function main(ns) {
    const buyOrUpgradeServerFlag = "../../buyOrUpgradeServerFlag.txt"

    if (!ns.fileExists(buyOrUpgradeServerFlag)) {
        return;
    }

    const maxRam = 1048576;

    const enviroment = JSON.parse(ns.read('../../data/enviroment.txt'));

    const playerPurchasedServers = enviroment
        .filter(x => x.server.purchasedByPlayer && x.server.maxRam < maxRam)
        .sort((b, a) => a.server.maxRam - b.server.maxRam)

    if (playerPurchasedServers.length === 0) {

        const currentNumberOfPurchasedServers = ns.getPurchasedServers().length;

        if (currentNumberOfPurchasedServers < ns.getPurchasedServerLimit()) {
            purchaseServer(ns, buyOrUpgradeServerFlag);
        }
    } else {
        const smallestPlayerPurchasedServer = playerPurchasedServers.pop();
        upgradeSmallMachine(ns, smallestPlayerPurchasedServer, buyOrUpgradeServerFlag);
    }
}

function purchaseServer(ns, buyOrUpgradeServerFlag) {
    let currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
    let ram = 128;

    if (currentNumberOfPurchasedServers < ns.getPurchasedServerLimit()) {

        let purchaseCost = ns.getPurchasedServerCost(ram);
        let moneyAvailable = ns.getServerMoneyAvailable("home");

        if (moneyAvailable > purchaseCost) {

            let ramToBuy = ram;

            while (moneyAvailable > ns.getPurchasedServerCost(ramToBuy)) {
                ramToBuy = ramToBuy * 2;
            }

            ramToBuy = ramToBuy / 2;

            const hostname = "CLOUD-" + String(currentNumberOfPurchasedServers).padStart(3, '0')
            ns.purchaseServer(hostname, ramToBuy);
            ns.rm(buyOrUpgradeServerFlag);

            currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
        }
        else {
            ns.tprint("Not enough money to buy new server")
        }
    } else {
        ns.tprint("max servers already bought");
    }
}

function upgradeSmallMachine(ns, smallestPlayerPurchasedServer, buyOrUpgradeServerFlag) {

    const ramToBuy = smallestPlayerPurchasedServer.server.maxRam * 4;
    const maxRam = 1048576;
    if (ramToBuy > maxRam) {
        ramToBuy = maxRam;
    }

    const costOfRamToBuy = ns.getPurchasedServerCost(ramToBuy);
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (moneyAvailable > costOfRamToBuy) {
        ns.upgradePurchasedServer(smallestPlayerPurchasedServer.name, ramToBuy);
        ns.rm(buyOrUpgradeServerFlag);
    } else {
        ns.purchaseServer(ns);
    }
}
