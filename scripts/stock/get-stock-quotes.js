export async function main(ns) {

    const stockRecords = ns.stock
        .getSymbols()
        .map(x => new Stock(
            x,
            ns.stock.getBidPrice(x),
            ns.stock.getAskPrice(x),
        ));

    const latestStockQuotesFile = "data/latestQuotes.txt";
    ns.rm(latestStockQuotesFile);
    ns.write(latestStockQuotesFile, JSON.stringify(stockRecords), "W")
}


class Stock {
    constructor(symbol, bid, ask, dateObserved = new Date()) {
        this.symbol = symbol;
        this.bid = bid;
        this.ask = ask;
        this.dateObserved = dateObserved.toLocaleString();
    }

    volatility;
    forecast;

    buyTrend = false;
    sellTrend = false;
    sellShortTrend = false;
    coverShortTrend = false;

}