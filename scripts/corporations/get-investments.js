export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const profit = corporation.revenue - corporation.expenses;

    // ns.tprint(ns.corporation.getInvestmentOffer())

    ///{"funds":96283140000,"shares":100000000,"round":1}

    // { round: 1, investment: 100_000_000 },
    // { round: 2, investment: 300_000_000 }, // worked, but I bet we can do better
    // { round: 3, investment: 3_000_000_000 },

    const investmentWeWillTake = [
        { round: 1, investment: 95_000_000_000, goPublic: false },
        { round: 2, investment: 800_000_000_000, goPublic: true },
    ]

    const investmentOffer = ns.corporation.getInvestmentOffer();

    for (const minimumInvestment of investmentWeWillTake) {
        if (investmentOffer.round === minimumInvestment.round && investmentOffer.funds > minimumInvestment.investment) {
            if (minimumInvestment.goPublic === false) {
                ns.corporation.acceptInvestmentOffer();
            } else {
                const sharesToSell = corporation.totalShares * .40;
                ns.corporation.goPublic(sharesToSell);
            }
        }
    }

    const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
    let stockMarketReserveMoney = new ReserveForTrading();
    if (ns.fileExists(stockMarketReserveMoneyFile)) {
        stockMarketReserveMoney = new ReserveForTrading(JSON.parse(ns.read(stockMarketReserveMoneyFile)));
    }


    if (corporation.public && corporation.state === 'START' & corporation.issuedShares > 0 && corporation.divisions.length > 1) {
        let moneyOnHome = ns.getServerMoneyAvailable("home");
        const moneyReserved = stockMarketReserveMoney.capitalToReserveForTrading - stockMarketReserveMoney.moneyInvested;

        if(moneyReserved > 0){
            moneyOnHome -= moneyReserved;
        }

        if(moneyOnHome > 0){
            const cashToUseForBuybacks = moneyOnHome * 0.001;
            let sharesToBuy = Math.floor(cashToUseForBuybacks / corporation.sharePrice)
            if (sharesToBuy > corporation.issuedShares) {
                sharesToBuy = corporation.issuedShares;
            }
    
            if (sharesToBuy > 0) {
                ns.corporation.buyBackShares(sharesToBuy);
            }
        }    
    }


    if (profit > 200_000_000 && corporation.public === false) {
        ns.corporation.goPublic(0);
    }

    if (corporation.public && corporation.dividendRate !== .01 && !ns.corporation.hasUnlock("Government Partnership") && profit > 200_000_000) {
        ns.corporation.issueDividends(.01);
    }

    if (corporation.public && corporation.dividendRate !== .5 && ns.corporation.hasUnlock("Government Partnership") && profit > 200_000_000) {
        ns.corporation.issueDividends(.5);
    }
}

class ReserveForTrading {
    stockMarketReserveMoneyLimit = 1_500_000_000_000;
    capitalToReserveForTrading = 500_000_000;
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

        const potentialCapitalReserve = (moneyInvested + ns.getServerMoneyAvailable("home")) * .75;

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

            const nameOfRequest = "invest-in-stocks";
            this.moneyRequested.delete(nameOfRequest);
            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
        }

        return canSpend;
    }

    requestMoney(ns, amount) {
        const nameOfRequest = "invest-in-stocks";
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
