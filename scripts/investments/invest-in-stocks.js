
/** @param {NS} ns */
//run scripts/invest-in-stocks.js
export async function main(ns) {

    let historicalData = new Map();

    const nameOfStockHistoricalData = "../../data/stockHistory.txt";
    if (ns.fileExists(nameOfStockHistoricalData)) {
        historicalData = new Map(JSON.parse(ns.read(nameOfStockHistoricalData)));
    }

    const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
    let stockMarketReserveMoney = new ReserveForTrading();
    if (ns.fileExists(stockMarketReserveMoneyFile)) {
        stockMarketReserveMoney = new ReserveForTrading(JSON.parse(ns.read(stockMarketReserveMoneyFile)));
    }

    const stockRecords = ns.stock
        .getSymbols()
        .map(x => new Stock(
            x,
            ns.stock.getBidPrice(x),
            ns.stock.getAskPrice(x),
            ns.stock.getPrice(x),
            ns.stock.getMaxShares(x),
            ns.stock.getPosition(x),
        ));

    if (ns.stock.has4SDataTIXAPI()) {
        for (const stockRecord of stockRecords) {
            stockRecord.volatility = ns.stock.getVolatility(stockRecord.symbol);
            stockRecord.forecast = ns.stock.getForecast(stockRecord.symbol);
            stockRecord.bias = Math.abs(stockRecord.forecast - .5);
        }
    }

    SaveHistoricData(stockRecords, historicalData, ns, nameOfStockHistoricalData);
    stockMarketReserveMoney.setMoneyInvested(stockRecords.reduce((sum, record) => sum += record.price * record.investedShares, 0), ns);

    const nameOfLedger = "../../data/salesLedger.txt"
    let ledger = [];

    if (ns.fileExists(nameOfLedger)) {
        ledger = JSON.parse(ns.read(nameOfLedger));
    }

    const stopTradingExists = ns.fileExists("../../stopTrading.txt");

    stockRecords.map(stock => {
        const investedShares = stock.investedShares;

        if (investedShares > 0) {
            // do not allow clean to run if invest-in-stocks.js is running on server. We need clean closes for this.  
            if (stock.sellTrend || stopTradingExists) {
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

    stockMarketReserveMoney.moneyRequested = new Map(Array.from(stockMarketReserveMoney.moneyRequested));

    const reserveMoneyKeys = stockMarketReserveMoney.moneyRequested.keys();

    let moneyRequested = 0;

    for (const requestKey of reserveMoneyKeys) {
        moneyRequested += stockMarketReserveMoney.moneyRequested.get(requestKey);
    }

    if(moneyRequested === 0){
        stockMarketReserveMoney.countOfVisitedWithoutFillingRequest = 0;
    }

    const commission = 100_001;
    let moneyAvailable = ns.getServerMoneyAvailable("home") - commission - moneyRequested;

    if(moneyAvailable > (26_000_000_000 * 2) && !ns.stock.has4SDataTIXAPI()){
        ns.stock.purchase4SMarketData();
        ns.stock.purchase4SMarketDataTixApi();
    }

    if(moneyAvailable > 1_000_000_000 && !ns.stock.has4SDataTIXAPI()){
        moneyAvailable = 1_000_000_000;
    }

    let onlyInvestIfWeHaveMoreThan = 30_000_000;
    if (ns.fileExists('../../stopInvesting.txt')) {
        onlyInvestIfWeHaveMoreThan = 30_000_000;
    }

    if (moneyAvailable > onlyInvestIfWeHaveMoreThan && !stopTradingExists) {
        const stocksToGoLong = stockRecords
            .filter(stock => stock.investedShares !== stock.maxShares && stock.buyTrend)
            .sort((a, b) => b.volatility - a.volatility);

        if (stocksToGoLong.length > 0) {
            const stockToLookAt = stocksToGoLong[0];

            let sharesToBuy = Math.round(moneyAvailable / stockToLookAt.ask);

            const totalSharesAfterBuy = sharesToBuy + stockToLookAt.investedShares;

            if (stockToLookAt.maxShares < totalSharesAfterBuy) {
                sharesToBuy = stockToLookAt.maxShares - stockToLookAt.investedShares;
            }

            const ticker = stockToLookAt.symbol;

            if(!ns.stock.has4SDataTIXAPI() && stockToLookAt.investedShares > 0){
                return;
            }

            // ns.toast(`${ticker} SHARES: ${sharesToBuy} FORECAST: ${stockToLookAt.forecast}`, "success", null)
            ns.stock.buyStock(ticker, sharesToBuy);
        }
    }

    ns.rm(stockMarketReserveMoneyFile);
    ns.write(stockMarketReserveMoneyFile, JSON.stringify(stockMarketReserveMoney), "W");
}


class ReserveForTrading {
    stockMarketReserveMoneyLimit = 1_000_000_000_000;
    capitalToReserveForTrading = 0;
    moneyInvested = 0;
    moneyRequested = new Map();
    countOfVisitedWithoutFillingRequest = 0;

    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    setMoneyInvested(moneyInvested, ns){
        this.moneyInvested = moneyInvested;

        const potentialCapitalReserve = moneyInvested / 2;
        
        this.capitalToReserveForTrading = Math.max(...[potentialCapitalReserve, this.capitalToReserveForTrading]);

        if(this.capitalToReserveForTrading > this.stockMarketReserveMoneyLimit){
            this.capitalToReserveForTrading = this.stockMarketReserveMoneyLimit;
        }

        this.countOfVisitedWithoutFillingRequest++;
    }

    canSpend(ns, moneyNeeded){
        const moneyOnHome = ns.getServerMoneyAvailable("home");

        let moneyToSaveForTrading = this.capitalToReserveForTrading - this.moneyInvested;

        if(moneyToSaveForTrading < 0){
            moneyToSaveForTrading = 0;
        }

        if(moneyToSaveForTrading > this.stockMarketReserveMoneyLimit){
            moneyToSaveForTrading = this.stockMarketReserveMoneyLimit;
        }

        const canSpend = moneyNeeded < moneyOnHome - moneyToSaveForTrading

        if(canSpend === false){
            this.requestMoney(ns, moneyNeeded);
        } else {
            this.moneyRequested = new Map(Array.from(this.moneyRequested));

            const nameOfRequest = "purchase-server";
            this.moneyRequested.delete(nameOfRequest);
            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
        }

        return canSpend;
    }

    requestMoney(ns, amount){
        const nameOfRequest = "purchase-server";
        this.moneyRequested = new Map(Array.from(this.moneyRequested));

        const moneyRequestedPreviously = this.moneyRequested.get(nameOfRequest);
        if(moneyRequestedPreviously){
            if(moneyRequestedPreviously < amount){
                this.moneyRequested.set(nameOfRequest, amount);
                this.moneyRequested = Array.from(this.moneyRequested);

                const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
                ns.rm(stockMarketReserveMoneyFile);
                ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
            }
        } else {
            this.moneyRequested.set(nameOfRequest, amount);
            this.moneyRequested = Array.from(this.moneyRequested);

            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
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
    shortTermRecords = [];
    longTermRecords = [];
    recentTicksOfPrices = [];


    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    addRecord(record, ns) {
        this.shortTermRecords.push(record);
        this.recentTicksOfPrices.push(record.price);

        if (this.recentTicksOfPrices.length === 11) {
            record.countOfNegative = 0;
            record.countOfPositive = 0;

            let lastPrice;
            for (const price of this.recentTicksOfPrices) {
                if (lastPrice) {
                    if (lastPrice < price) {
                        record.countOfPositive++;
                    }

                    if (lastPrice > price) {
                        record.countOfNegative++;
                    }
                }

                lastPrice = price;
            }

            this.recentTicksOfPrices.shift();
        }

        const hasOracle = ns.stock.has4SDataTIXAPI();


        if(!hasOracle){
            if (record.countOfPositive >= 8) {
                record.buyTrend = true;
            }

            if (record.countOfPositive <= 6) {
                record.sellTrend = true;
            }

            if (record.countOfNegative >= 8) {
                record.sellShortTrend = true;
            }

            if (record.countOfNegative <= 6) {
                record.coverShortTrend = true;
            }
        }

        if (hasOracle) {
            if (record.forecast > 0.6) {
                record.buyTrend = true;
            }

            if (record.forecast < .5) {
                record.sellTrend = true;
            }

            if (0.4 > record.forecast) {
                record.sellShortTrend = true;
            }

            if (0.5 < record.forecast) {
                record.coverShortTrend = true;
            }
        }
    }

    storeLongTerm() {
        const newLongTermStock = new Stock(
            this.shortTermRecords[0].symbol,
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

        newLongTermStock.volatility = this.shortTermRecords[0].volatility;
        newLongTermStock.forecast = this.shortTermRecords.map(x => x.forecast).reduce((a, b) => a + b) / this.shortTermRecords.length;

        newLongTermStock.bias = Math.max(...this.shortTermRecords.map(x => x.bias));

        this.longTermRecords.push(newLongTermStock);

        this.shortTermRecords.length = 0;
    }
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

function SaveHistoricData(stockRecords, historicalData, ns, nameOfStockHistoricalData) {
    stockRecords.map(x => {
        if (historicalData.has(x.symbol)) {
            const data = historicalData.get(x.symbol);
           
            if (data.shortTermRecords[data.shortTermRecords.length - 1]?.price !== x.price) {
                const record = new StockHistoricData(data);
                record.addRecord(x, ns);

                if (record.shortTermRecords.length >= 100) {
                    record.storeLongTerm();
                }

                historicalData.set(x.symbol, record);
            }

        } else {
            const stockHistoryData = new StockHistoricData();
            stockHistoryData.addRecord(x, ns);
            historicalData.set(x.symbol, stockHistoryData);
        }
    });

    ns.rm(nameOfStockHistoricalData);
    ns.write(nameOfStockHistoricalData, JSON.stringify(Array.from(historicalData.entries()), "W"));
}
