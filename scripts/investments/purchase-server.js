// replace servers with this as well. just a bool passed in, put them both in their own methods.

/** @param {NS} ns */
//run scripts/purchase-servers.js
export async function main(ns) {
    let currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
    let ram = 512;

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

            currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
        }
        else {
            ns.tprint("Not enough money")
        }
    }
}