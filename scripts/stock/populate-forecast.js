export async function main(ns) {
    const latestStockQuotesFile = "data/latestQuotes.txt";
    const stockRecords = JSON.parse(ns.read(latestStockQuotesFile));

    const hasS4DataTIXAPI = ns.stock.has4SDataTIXAPI();

    if (hasS4DataTIXAPI) {
        for (const stockRecord of stockRecords) {
            stockRecord.volatility = ns.stock.getVolatility(stockRecord.symbol);
            stockRecord.forecast = ns.stock.getForecast(stockRecord.symbol);
            stockRecord.bias = Math.abs(stockRecord.forecast - .5);
        }
    }

    ns.rm(latestStockQuotesFile);
    ns.write(latestStockQuotesFile, JSON.stringify(stockRecords), "W")
}