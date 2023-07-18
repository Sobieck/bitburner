export async function main(ns) {
    let moneyAvailable = ns.getServerMoneyAvailable("home") 

    if (moneyAvailable > 26_000_000_000 && !ns.stock.has4SDataTIXAPI()) {
        ns.stock.purchase4SMarketDataTixApi();
    }
}