export async function main(ns) {
    const latestStockQuotesFile = "data/latestQuotes.txt";
    const stockRecords = JSON.parse(ns.read(latestStockQuotesFile));

    for (const quote of stockRecords) {
        quote.price = ns.stock.getPrice(quote.symbol);
        quote.maxShares = ns.stock.getMaxShares(quote.symbol);

        const position = ns.stock.getPosition(quote.symbol);
        quote.investedShares = position[0];
        quote.averagePrice = position[1];
        quote.sharesShort = position[2];
        quote.averageShortPrice = position[3];
    }


    ns.rm(latestStockQuotesFile);
    ns.write(latestStockQuotesFile, JSON.stringify(stockRecords), "W")
}