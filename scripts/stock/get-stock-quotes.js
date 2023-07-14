export async function main(ns) {

    const stockRecords = ns.stock
        .getSymbols()
        .map(x => new Stock(
            x,
            ns.stock.getBidPrice(x),
            ns.stock.getAskPrice(x),
            ns.stock.getPrice(x),
            ns.stock.getMaxShares(x),
            ns.stock.getPosition(x)
        ));

    const latestStockQuotesFile = "data/latestQuotes.txt";
    ns.rm(latestStockQuotesFile);
    ns.write(latestStockQuotesFile, JSON.stringify(stockRecords), "W")
}


class Stock {
    constructor(symbol, bid, ask, price, maxShares, position = {}, dateObserved = new Date()) {
        this.symbol = symbol;
        this.bid = bid;
        this.ask = ask;
        this.price = price;
        this.maxShares = maxShares;
        this.investedShares = position[0];
        this.averagePrice = position[1];
        this.sharesShort = position[2];
        this.averageShortPrice = position[3];
        this.dateObserved = dateObserved.toLocaleString();
    }

    volatility;
    forecast;

    buyTrend = false;
    sellTrend = false;
    sellShortTrend = false;
    coverShortTrend = false;

}