let visitedBefore = false;

export async function main(ns) {
    const ramObservationsTextFile = '../../data/ramObservations.txt';
    const stopInvestingFileName = "stopInvesting.txt";
    if (ns.fileExists(stopInvestingFileName)) {
        if (ns.fileExists(ramObservationsTextFile)) {
            ns.rm(ramObservationsTextFile);
        }
        return;
    }

    visitedBefore = false;

    await upgradeHomeRamOrCpu(ns, 11_000_000);
    await upgradeHomeRamOrCpu(ns, 100_000_000);
    await upgradeHomeRamOrCpu(ns, 30_000_000_000);
    await upgradeHomeRamOrCpu(ns, 100_000_000_000);
    await upgradeHomeRamOrCpu(ns, 1_000_000_000_000);
    await upgradeHomeRamOrCpu(ns, 10_000_000_000_000);
    await upgradeHomeRamOrCpu(ns, 100_000_000_000_000);
    await upgradeHomeRamOrCpu(ns, 1_000_000_000_000_000);
}

async function upgradeHomeRamOrCpu(ns, moneyLimit) {
    if (visitedBefore) {
        return;
    }

    const ramUpgradeCost = ns.singularity.getUpgradeHomeRamCost();
    const coreUpgradeCost = ns.singularity.getUpgradeHomeCoresCost();

    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (moneyLimit < coreUpgradeCost && moneyLimit < ramUpgradeCost) {
        return;
    } else {
        visitedBefore = true;
    }

    const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
    let stockMarketReserveMoney = new ReserveForTrading();
    if (ns.fileExists(stockMarketReserveMoneyFile)) {
        stockMarketReserveMoney = new ReserveForTrading(JSON.parse(ns.read(stockMarketReserveMoneyFile)));
    }

    if (ramUpgradeCost < coreUpgradeCost) {

        const moneyLeftOverForRam = moneyAvailable - ramUpgradeCost;

        if (moneyLeftOverForRam > moneyLimit) {
            if (stockMarketReserveMoney.canSpend(ns, ramUpgradeCost)) {
                ns.singularity.upgradeHomeRam();
                ns.toast(`Upgraded home ram`, "success", null);
                await ns.sleep(100);
            }
        }

    } else {

        const moneyLeftOverForCores = moneyAvailable - coreUpgradeCost;

        if (moneyLeftOverForCores > moneyLimit) {
            if (stockMarketReserveMoney.canSpend(ns, coreUpgradeCost)) {
                ns.singularity.upgradeHomeCores()
                ns.toast(`Upgraded home core`, "success", null);
                await ns.sleep(100);
            }
        }
    }
}


class ReserveForTrading {
    stockMarketReserveMoneyLimit = 1_000_000_000_000;
    capitalToReserveForTrading = 500_000_000;
    moneyInvested = 0;
    moneyRequested = new Map();
    countOfVisitedWithoutFillingRequest = 0;

    constructor(obj) {
        obj && Object.assign(this, obj);
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

            const nameOfRequest = "upgrade-home-machine";
            this.moneyRequested.delete(nameOfRequest);
            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
        }

        return canSpend;
    }

    requestMoney(ns, amount) {
        const nameOfRequest = "upgrade-home-machine";
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
