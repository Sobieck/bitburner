let lastRecordedToConsole = new Date();

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

    const latestStockQuotesFile = "data/latestQuotes.txt";
    const stockRecords = JSON.parse(ns.read(latestStockQuotesFile));

    SaveHistoricData(stockRecords, historicalData, ns, nameOfStockHistoricalData);

    let moneyInvested = 0;
    moneyInvested += stockRecords.reduce((sum, record) => sum += record.price * record.investedShares, 0);
    moneyInvested += stockRecords.reduce((sum, record) => sum += (record.averageShortPrice * record.sharesShort) + ((record.averageShortPrice - record.price) * record.sharesShort), 0);

    stockMarketReserveMoney.setMoneyInvested(moneyInvested, ns);

    const nameOfLedger = "../../data/salesLedger.txt"
    let ledger = [];

    if (ns.fileExists(nameOfLedger)) {
        ledger = JSON.parse(ns.read(nameOfLedger));
    }

    stockMarketReserveMoney.moneyRequested = new Map(Array.from(stockMarketReserveMoney.moneyRequested));
    const reserveMoneyKeys = stockMarketReserveMoney.moneyRequested.keys();
    let moneyRequested = 0;

    for (const requestKey of reserveMoneyKeys) {
        moneyRequested += stockMarketReserveMoney.moneyRequested.get(requestKey);
    }

    if (moneyRequested === 0) {
        stockMarketReserveMoney.countOfVisitedWithoutFillingRequest = 0;
    }

    let sellSharesToSatisfyMoneyDemands = false;
    if (stockMarketReserveMoney.countOfVisitedWithoutFillingRequest > 90) {
        sellSharesToSatisfyMoneyDemands = true;
    }

    const commission = 100_001;

    const stopTradingExists = ns.fileExists("../../stopTrading.txt");
    stockRecords.map(stock => {
        let sharesToSell = 0;
        let type = "Short-Term Long Sale";
        let averagePrice = 0;
        let coverShort = false;

        if (stock.investedShares > 0) {
            sharesToSell = stock.investedShares;
            type = "Short-Term Long Sale";
            averagePrice = stock.averagePrice;
            coverShort = false;
        }

        if (stock.sharesShort > 0) {
            sharesToSell = stock.sharesShort;
            type = "Short-Term Cover Short";
            averagePrice = stock.averageShortPrice;
            coverShort = true;
        }

        if (sellSharesToSatisfyMoneyDemands) {
            if (stockMarketReserveMoney.canSellAmountAndStillHaveReserve(moneyRequested)) {
                sharesToSell = Math.ceil(moneyRequested / stock.bid)

                if (sharesToSell > stock.investedShares) {
                    sharesToSell = stock.investedShares;
                }

                if (sharesToSell > stock.sharesShort) {
                    sharesToSell = stock.sharesShort;
                }
            } else {
                sellSharesToSatisfyMoneyDemands = false;
                stockMarketReserveMoney.countOfVisitedWithoutFillingRequest = 0;
            }
        }


        if (sharesToSell > 0) {
            if ((stock.sellTrend && coverShort === false) || stopTradingExists || sellSharesToSatisfyMoneyDemands || (stock.coverShortTrend && coverShort)) {
                let salePrice;
                if (coverShort) {
                    salePrice = ns.stock.sellShort(stock.symbol, sharesToSell);
                } else {
                    salePrice = ns.stock.sellStock(stock.symbol, sharesToSell);
                }

                ledger.push(new LedgerItem(
                    stock.symbol,
                    salePrice,
                    averagePrice,
                    sharesToSell,
                    type,
                    stock.forecast
                ))

                if (sellSharesToSatisfyMoneyDemands) {
                    sellSharesToSatisfyMoneyDemands = false;
                    ns.toast(`Sold $${moneyRequested} for money request.`, "success", null)
                }

                if (stopTradingExists) {
                    ns.toast("Stopped trading", "success", null)
                }
            }
        }
    });

    const moneyWeHaveNow = ns.getServerMoneyAvailable("home") + stockMarketReserveMoney.moneyInvested;

    const now = new Date();
    if (now.getMinutes() !== lastRecordedToConsole.getMinutes()) { // && batches not running
        const timeStamp = `[${String(now.getHours()).padStart(2, 0)}:${String(now.getMinutes()).padStart(2, 0)}]`

        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });

        const moneyFormatted = formatter.format(moneyWeHaveNow);

        let consoleUpdate = `${timeStamp} Money we have now: ${moneyFormatted}`;

        ns.tprint(consoleUpdate);

        lastRecordedToConsole = now;
    }


    ns.rm(nameOfLedger);
    ns.write(nameOfLedger, JSON.stringify(ledger), "W");


    let moneyAvailable = ns.getServerMoneyAvailable("home") - commission - moneyRequested;

    if (moneyAvailable > 5_000_000_000 && !ns.stock.has4SDataTIXAPI()) {
        moneyAvailable = 5_000_000_000;
    }

    let onlyInvestIfWeHaveMoreThan = 30_000_000;
    if (ns.fileExists('../../stopInvesting.txt')) {
        onlyInvestIfWeHaveMoreThan = 30_000_000;
    }

    if (moneyAvailable > onlyInvestIfWeHaveMoreThan && !stopTradingExists) {
        let stocksToTrade = stockRecords
            .filter(stock =>
                (stock.buyTrend && stock.investedShares !== stock.maxShares) ||
                (stock.sellShortTrend && stock.maxShares !== stock.sharesShort))
            .sort((a, b) => b.volatility - a.volatility);

        if (!ns.stock.has4SDataTIXAPI()) {
            stocksToTrade = stockRecords
                .filter(stock =>
                    (stock.buyTrend && stock.investedShares === 0) ||
                    (stock.sellShortTrend && stock.sharesShort === 0))
                .sort((a, b) => b.magnitudeOfSignal - a.magnitudeOfSignal);
        }

        if (stocksToTrade.length > 0) {
            const stockToLookAt = stocksToTrade[0];

            let sharesToBuy = 0;
            const ticker = stockToLookAt.symbol;

            if (stockToLookAt.buyTrend) {
                sharesToBuy = Math.round(moneyAvailable / stockToLookAt.ask);

                const totalSharesAfterBuy = sharesToBuy + stockToLookAt.investedShares;

                if (stockToLookAt.maxShares < totalSharesAfterBuy) {
                    sharesToBuy = stockToLookAt.maxShares - stockToLookAt.investedShares;
                }

                ns.stock.buyStock(ticker, sharesToBuy);
            }

            if (stockToLookAt.sellShortTrend) {
                sharesToBuy = Math.round(moneyAvailable / stockToLookAt.bid);

                const totalSharesAfterBuy = sharesToBuy + stockToLookAt.sharesShort;

                if (stockToLookAt.maxShares < totalSharesAfterBuy) {
                    sharesToBuy = stockToLookAt.maxShares - stockToLookAt.sharesShort;
                }

                ns.stock.buyShort(ticker, sharesToBuy);
            }
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

    canSellAmountAndStillHaveReserve(amountToSell) {
        return (this.moneyInvested - amountToSell) > this.capitalToReserveForTrading;
    }

    setMoneyInvested(moneyInvested, ns) {
        this.moneyInvested = moneyInvested;

        const potentialCapitalReserve = moneyInvested / 2;

        this.capitalToReserveForTrading = Math.max(...[potentialCapitalReserve, this.capitalToReserveForTrading]);

        if (this.capitalToReserveForTrading > this.stockMarketReserveMoneyLimit) {
            this.capitalToReserveForTrading = this.stockMarketReserveMoneyLimit;
        }

        this.countOfVisitedWithoutFillingRequest++;
    }

    canSpend(ns, moneyNeeded) {
        const moneyOnHome = ns.getServerMoneyAvailable("home");

        let moneyToSaveForTrading = this.capitalToReserveForTrading - this.moneyInvested;

        if (moneyToSaveForTrading < 0) {
            moneyToSaveForTrading = 0;
        }

        if (moneyToSaveForTrading > this.stockMarketReserveMoneyLimit) {
            moneyToSaveForTrading = this.stockMarketReserveMoneyLimit;
        }

        const canSpend = moneyNeeded < moneyOnHome - moneyToSaveForTrading

        if (canSpend === false) {
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

    requestMoney(ns, amount) {
        const nameOfRequest = "purchase-server";
        this.moneyRequested = new Map(Array.from(this.moneyRequested));

        const moneyRequestedPreviously = this.moneyRequested.get(nameOfRequest);
        if (moneyRequestedPreviously) {
            if (moneyRequestedPreviously < amount) {
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

        let numberProfit = (price - averagePurchasePrice) * shares;

        if (type === "Short-Term Cover Short") {
            numberProfit = (averagePurchasePrice - price) * shares;
        }

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

        if (this.recentTicksOfPrices.length === 21) {
            record.countOfNegative = 0;
            record.countOfPositive = 0;
            record.magnitudeOfSignal = 0;

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


        if (!hasOracle) {
            if (record.countOfPositive >= 16) {
                record.buyTrend = true;
                record.magnitudeOfSignal = record.countOfPositive;
            }

            if (record.countOfPositive <= 12 && record.investedShares > 0) {
                record.sellTrend = true;
            }

            if (record.countOfNegative >= 16) {
                record.sellShortTrend = true;
                record.magnitudeOfSignal = record.countOfNegative;
            }

            if (record.countOfNegative <= 12 && record.sharesShort > 0) {
                record.coverShortTrend = true;
            }
        }

        if (hasOracle) {
            if (record.forecast > 0.6) {
                record.buyTrend = true;
            }

            if (record.forecast < .5 && record.investedShares > 0) {
                record.sellTrend = true;
            }

            if (0.4 > record.forecast) {
                record.sellShortTrend = true;
            }

            if (0.5 < record.forecast && record.sharesShort > 0) {
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
