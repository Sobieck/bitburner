export async function main(ns) {

    ns.run("scripts/stock/get-stock-quotes.js")
    await ns.sleep(50)

    ns.run("scripts/stock/populate-forecast.js")
    await ns.sleep(50)

    ns.run("scripts/stock/invest-in-stocks.js")
    await ns.sleep(50)

    ns.run("scripts/stock/buy-4s.js")
    await ns.sleep(50)

}