export async function main(ns) {
    let moneyAvailable = ns.getServerMoneyAvailable("home") 

    if (moneyAvailable > 27_000_000_000 && !ns.stock.has4SDataTIXAPI()) {
        ns.stock.purchase4SMarketData();
        ns.stock.purchase4SMarketDataTixApi();
    }
}