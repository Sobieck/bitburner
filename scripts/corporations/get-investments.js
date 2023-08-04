let cantIssueCount = 0;

export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const profit = corporation.revenue - corporation.expenses;

    const multipliers = ns.getBitNodeMultipliers();

    const investmentWeWillTake = [
        { round: 1, investment: 95_000_000_000 * multipliers.CorporationValuation, goPublic: false },
        { round: 2, investment: 750_000_000_000 * multipliers.CorporationValuation, goPublic: true },
    ]

    const investmentOffer = ns.corporation.getInvestmentOffer();

    for (const minimumInvestment of investmentWeWillTake) {
        if (investmentOffer.round === minimumInvestment.round && investmentOffer.funds > minimumInvestment.investment) {
            if (minimumInvestment.goPublic === false) {
                ns.corporation.acceptInvestmentOffer();
            } else {
                const sharesToSell = corporation.totalShares * .65;
                ns.corporation.goPublic(sharesToSell);
            }
        }
    }


    if (corporation.public) {
        const newSharesConditions = [
            { sharesOutstanding: 1_000_000_000, sharePriceMin: 8_000, multipleOfFunds: 40, sharesToIssue: 200_000_000 },
            { sharesOutstanding: 1_200_000_000, sharePriceMin: 40_000, multipleOfFunds: 100, sharesToIssue: 240_000_000 },
            { sharesOutstanding: 1_440_000_000, sharePriceMin: 1_000_000, multipleOfFunds: 100, sharesToIssue: 288_000_000 },
        ]

        // {"name":"Gidget's Keiretsu","funds":29633287822.845848,"revenue":149925700.34409666,"expenses":18003807.839152098,"public":true,"totalShares":1200000000,"numShares":1090000000,"shareSaleCooldown":0,"issuedShares":0,"sharePrice":41329.14237963411,"dividendRate":0,"dividendTax":0.15,"dividendEarnings":0,"state":"START","divisions":["Gidget's Farm","Gidget's Smokes","Chemist Gidget's Lab"]}
        // ns.tprint(corporation);

        if (corporation.funds < 10_000_000_000_000 &&
            corporation.numShares / corporation.totalShares > .7 &&
            profit < 10_000_000_000 &&
            corporation.shareSaleCooldown === 0)

            for (const condition of newSharesConditions.filter(x => x.sharesOutstanding === corporation.totalShares)) {
                if (corporation.sharePrice > condition.sharePriceMin) {
                    const shareToIssue = condition.sharesToIssue;
                    const fundsGenerated = shareToIssue * corporation.sharePrice * .9;
                    const minimumNeeded = corporation.funds * condition.multipleOfFunds;

                    if (fundsGenerated > minimumNeeded) {
                        try {
                            ns.corporation.issueNewShares(shareToIssue);
                        } catch (error) {
                            if(cantIssueCount > 1000){
                                ns.toast("Can't issue new shares", "warning");
                                cantIssueCount = 0;
                            } else {
                                cantIssueCount++;
                            }                            
                        }                        
                    }
                }
            }


        const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
        let stockMarketReserveMoney = new ReserveForTrading();
        if (ns.fileExists(stockMarketReserveMoneyFile)) {
            stockMarketReserveMoney = new ReserveForTrading(JSON.parse(ns.read(stockMarketReserveMoneyFile)));
        }

        if (corporation.state === 'START' & corporation.issuedShares > 0 && corporation.divisions.length > 1) {
            let moneyOnHome = ns.getServerMoneyAvailable("home");
            const moneyReserved = stockMarketReserveMoney.capitalToReserveForTrading - stockMarketReserveMoney.moneyInvested;

            if (moneyReserved > 0) {
                moneyOnHome -= moneyReserved;
            }

            if (moneyOnHome > 0) {
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

        const dividendConditions = [
            { dividendRate: .01, partnership: false, floodPlayerWithMoney: false, minProfit: 200_000_000 },
            { dividendRate: .5, partnership: true, floodPlayerWithMoney: false, minProfit: 200_000_000 },
            { dividendRate: .77, partnership: false, floodPlayerWithMoney: true, minProfit: 40_000_000 },
            { dividendRate: .77, partnership: true, floodPlayerWithMoney: true, minProfit: 40_000_000 },
        ]

        const hasGovPartnership = ns.corporation.hasUnlock("Government Partnership");
        const floodPlayerWithMoneyBecauseTheyJustStarted = stockMarketReserveMoney.capitalToReserveForTrading <= 5_000_000_000;

        const conditionToUse = dividendConditions.find(x => x.partnership === hasGovPartnership && x.floodPlayerWithMoney === floodPlayerWithMoneyBecauseTheyJustStarted);

        if (conditionToUse.minProfit < profit) {
            if (corporation.dividendRate !== conditionToUse.dividendRate) {
                ns.corporation.issueDividends(conditionToUse.dividendRate);
            } 
        } else {
            if (corporation.dividendRate !== 0) {
                ns.corporation.issueDividends(0);
            }
        }
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

        const potentialCapitalReserve = (moneyInvested + ns.getServerMoneyAvailable("home")) * .85;

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
