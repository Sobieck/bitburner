/** @param {NS} ns */
//run scripts/upgrade-small-servers.js
export async function main(ns) {
    const enviroment = JSON.parse(ns.read('../../data/enviroment.txt'));

    replaceSmallMachinesWithMax(ns, enviroment);
}

function replaceSmallMachinesWithMax(ns, environment) {
    const ramToBuy = 1048576;
    const costOfRamToBuy = ns.getPurchasedServerCost(ramToBuy);

    environment
        .filter(x => x.server.purchasedByPlayer)
        .map(x => {
            const moneyAvailable = ns.getServerMoneyAvailable("home")

            if (moneyAvailable > costOfRamToBuy && x.server.maxRam < ramToBuy) {
                ns.upgradePurchasedServer(x.name, ramToBuy);
            }
        });
}
