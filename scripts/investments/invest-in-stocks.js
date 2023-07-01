
/** @param {NS} ns */
//run scripts/invest-in-stocks.js
export async function main(ns) {

    let historicalData = new Map();
    const nameOfStockHistoricalData = "../../data/stockHistory.txt"

    if (ns.fileExists(nameOfStockHistoricalData)) {
        historicalData = new Map(JSON.parse(ns.read(nameOfStockHistoricalData)));
    }

    const stockRecords = ns.stock
        .getSymbols()
        .map(x => new Stock(
            x,
            ns.stock.getVolatility(x),
            ns.stock.getForecast(x),
            ns.stock.getBidPrice(x),
            ns.stock.getAskPrice(x),
            ns.stock.getPrice(x),
            ns.stock.getMaxShares(x),
            ns.stock.getPosition(x),
        ));


    SaveHistoricData(stockRecords, historicalData, ns, nameOfStockHistoricalData);

    const nameOfLedger = "../../data/salesLedger.txt"
    let ledger = [];

    if (ns.fileExists(nameOfLedger)) {
        ledger = JSON.parse(ns.read(nameOfLedger));
    }

    const stopTradingExists = ns.fileExists("../../stopTrading.txt") || ns.fileExists('../../data/ramObservations.txt');
    // sell short term positions;
    stockRecords.map(stock => {
        const investedShares = stock.investedShares;

        if (investedShares > 0) {
            // do not allow clean to run if invest-in-stocks.js is running on server. We need clean closes for this.  
            if (stock.forecast < 0.5 || stopTradingExists) {
                const salePrice = ns.stock.sellStock(stock.symbol, investedShares);
                ledger.push(new LedgerItem(
                    stock.symbol,
                    salePrice,
                    stock.averagePrice,
                    investedShares,
                    "Short-Term Long Sale",
                    stock.forecast
                ))

                if (stopTradingExists) {
                    ns.toast("Stopped trading", "success", null)
                }
            }
        }
    });

    ns.rm(nameOfLedger);
    ns.write(nameOfLedger, JSON.stringify(ledger), "W");


    const commission = 100_001;
    const moneyAvailable = ns.getServerMoneyAvailable("home") - commission;

    if (moneyAvailable > 100_000_000_000 && !stopTradingExists) {
        const stocksToGoLong = stockRecords
            .filter(stock => stock.investedShares !== stock.maxShares && stock.forecast > 0.6)
            .sort((a, b) => b.volatility - a.volatility);

        if (stocksToGoLong.length > 0) {
            const stockToLookAt = stocksToGoLong[0];

            let sharesToBuy = Math.round(moneyAvailable / stockToLookAt.ask);

            if (stockToLookAt.maxShares < sharesToBuy) {
                sharesToBuy = stockToLookAt.maxShares;
            }

            sharesToBuy = sharesToBuy - stockToLookAt.investedShares;
            const ticker = stockToLookAt.symbol;

            ns.stock.buyStock(ticker, sharesToBuy);
        }
    }
}

class LedgerItem {

    constructor(symbol, price, averagePurchasePrice, shares, type, forecastAtSale) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });

        const numberProfit = (price - averagePurchasePrice) * shares

        this.date = new Date().toLocaleString();
        this.symbol = symbol;
        this.price = price;
        this.averagePurchasePrice = averagePurchasePrice;
        this.profit = formatter.format(numberProfit);
        this.profitPercent = (numberProfit / (shares * averagePurchasePrice)).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 });
        this.shares = shares;
        this.type = type;
        this.forecastAtSale = forecastAtSale;
    }
}


class StockHistoricData {

    constructor(shortTermRecords = [], longTermRecords = []) {
        this.shortTermRecords = shortTermRecords;

        this.longTermRecords = longTermRecords;
    }

    addRecord(record) {
        this.shortTermRecords.push(record);
    }

    storeLongTerm() {
        const newLongTermStock = new Stock(
            this.shortTermRecords[0].symbol,
            this.shortTermRecords[0].volatility,
            this.shortTermRecords.map(x => x.forecast).reduce((a, b) => a + b) / this.shortTermRecords.length,
            this.shortTermRecords.map(x => x.bid).reduce((a, b) => a + b) / this.shortTermRecords.length,
            this.shortTermRecords.map(x => x.ask).reduce((a, b) => a + b) / this.shortTermRecords.length,
            this.shortTermRecords.map(x => x.price).reduce((a, b) => a + b) / this.shortTermRecords.length,
            this.shortTermRecords[0].maxShares,
            [
                this.shortTermRecords.map(x => x.investedShares).reduce((a, b) => a + b) / this.shortTermRecords.length,
                this.shortTermRecords.map(x => x.averagePrice).reduce((a, b) => a + b) / this.shortTermRecords.length,
                this.shortTermRecords.map(x => x.sharesShort).reduce((a, b) => a + b) / this.shortTermRecords.length,
                this.shortTermRecords.map(x => x.averageShortPrice).reduce((a, b) => a + b) / this.shortTermRecords.length,
            ]
        );

        newLongTermStock.bias = Math.max(...this.shortTermRecords.map(x => x.bias));

        this.longTermRecords.push(newLongTermStock);

        this.shortTermRecords.length = 0;
    }
}

class Stock {
    constructor(symbol, volatility, forecast, bid, ask, price, maxShares, position = {}, dateObserved = new Date()) {
        this.symbol = symbol;
        this.forecast = forecast;
        this.bias = Math.abs(forecast - .5);
        this.bid = bid;
        this.ask = ask;
        this.price = price;
        this.maxShares = maxShares;
        this.investedShares = position[0];
        this.averagePrice = position[1];
        this.sharesShort = position[2];
        this.averageShortPrice = position[3];
        this.volatility = volatility;
        this.dateObserved = dateObserved.toLocaleString();
    }
}

function SaveHistoricData(stockRecords, historicalData, ns, nameOfStockHistoricalData) {
    stockRecords.map(x => {
        if (historicalData.has(x.symbol)) {
            const data = historicalData.get(x.symbol);
            const record = new StockHistoricData(data.shortTermRecords, data.longTermRecords);
            if (data.shortTermRecords[data.shortTermRecords.length - 1]?.price !== x.price) {
                record.addRecord(x);

                if (record.shortTermRecords.length >= 100) {
                    record.storeLongTerm();
                }
            }

        } else {
            const stockHistoryData = new StockHistoricData();
            stockHistoryData.addRecord(x);
            historicalData.set(x.symbol, stockHistoryData);
        }
    });

    ns.rm(nameOfStockHistoricalData);
    ns.write(nameOfStockHistoricalData, JSON.stringify(Array.from(historicalData.entries()), "W"));
}
