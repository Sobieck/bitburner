let countOfTriesToBuyServers = 0;
let countOfVisitsWithoutTryingToBuy = 0;
const beforeFormulasServerSpendFile = "data/beforeFormulasServerSpend.txt";

export async function main(ns) {
    const buyOrUpgradeServerFlag = "../../buyOrUpgradeServerFlag.txt";
    const ramObservationsTextFile = '../../data/ramObservations.txt';
    const typeRecord = "../../data/typeOfServerPurchase.txt";

    let additionalRamNeeded = 0;
    let ramObservations = [];
    let type = new TypeOfPurchase();

    if (ns.fileExists(ramObservationsTextFile)) {
        countOfVisitsWithoutTryingToBuy++;
    } else {
        countOfVisitsWithoutTryingToBuy = 0;
    }

    if (ns.fileExists(buyOrUpgradeServerFlag)) {
        countOfVisitsWithoutTryingToBuy = 0;
    }

    let tryToBuy = ns.fileExists(buyOrUpgradeServerFlag);

    if (tryToBuy === false && countOfVisitsWithoutTryingToBuy < 300) {
        tryToBuy = true;
    }

    if (tryToBuy === false) {
        return;
    } else {
        countOfTriesToBuyServers++;

        if (ns.fileExists(typeRecord)) {
            const tempType = JSON.parse(ns.read(typeRecord));
            type = new TypeOfPurchase(tempType);
        }

        if (!type.lastPurchaseDate) {
            type.lastPurchaseDate = new Date();
        }

        if (ns.fileExists(ramObservationsTextFile)) {
            ramObservations = JSON.parse(ns.read(ramObservationsTextFile));

        }

        if (ns.fileExists(buyOrUpgradeServerFlag)) {
            const latestRamNeeded = JSON.parse(ns.read(buyOrUpgradeServerFlag));

            ramObservations.push(latestRamNeeded);

            ns.rm(buyOrUpgradeServerFlag);

            ns.rm(ramObservationsTextFile);
            ns.write(ramObservationsTextFile, JSON.stringify(ramObservations), "W");
        }

        if (ramObservations.length === 0) {
            return;
        }

        if (ramObservations.length > 10 || countOfTriesToBuyServers > 300) {

            additionalRamNeeded = Math.min(...ramObservations);

            if (type.average) {
                additionalRamNeeded = ramObservations.reduce((a, b) => a + b) / ramObservations.length;
            }

            if (ns.fileExists('Formulas.exe')) {
                if (type.max) {
                    additionalRamNeeded = Math.max(...ramObservations);
                }
            }

            const ramNeededForBatchesFile = "data/ramNeededToStartBatches.txt";
            if (ns.fileExists(ramNeededForBatchesFile)) {
                const ramNeededToStartBatches = Number(ns.read(ramNeededForBatchesFile));

                if (ramNeededToStartBatches < additionalRamNeeded) {
                    additionalRamNeeded = ramNeededToStartBatches;
                }
            }
        }

        let maxRam = 1048576;

        const enviroment = JSON.parse(ns.read('../../data/enviroment.txt'));

        const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
        let stockMarketReserveMoney = new ReserveForTrading();
        if (ns.fileExists(stockMarketReserveMoneyFile)) {
            stockMarketReserveMoney = new ReserveForTrading(JSON.parse(ns.read(stockMarketReserveMoneyFile)));
        }


        const playerPurchasedServers = enviroment
            .filter(x => x.server.purchasedByPlayer && x.server.maxRam < maxRam)
            .sort((b, a) => a.server.maxRam - b.server.maxRam)

        let upgradedOrPurchased = false;
        if (playerPurchasedServers.length === 0) {
            upgradedOrPurchased = purchaseServer(ns, maxRam, additionalRamNeeded, stockMarketReserveMoney);
        } else {
            const smallestPlayerPurchasedServer = playerPurchasedServers.pop();
            upgradedOrPurchased = upgradeSmallMachine(ns, smallestPlayerPurchasedServer, maxRam, additionalRamNeeded, stockMarketReserveMoney);
        }

        if (upgradedOrPurchased) {
            ns.rm(ramObservationsTextFile);
            type.changeType();
            const now = new Date();
            const timeStamp = `[${String(now.getHours()).padStart(2, 0)}:${String(now.getMinutes()).padStart(2, 0)}]`
            ns.toast(`${timeStamp} More than ${Math.round(additionalRamNeeded)} GB bought for server`, "success", 300000);
        }

        ns.rm(typeRecord);
        ns.write(typeRecord, JSON.stringify(type), "W");
    }
}

function purchaseServer(ns, maxRam, additionalRamNeeded, stockMarketReserveMoney) {
    let currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
    let ramToBuy = 64;

    if (currentNumberOfPurchasedServers < ns.getPurchasedServerLimit()) {

        let purchaseCost = ns.getPurchasedServerCost(ramToBuy);
        let moneyAvailable = ns.getServerMoneyAvailable("home");

        if (moneyAvailable > purchaseCost) {

            while (moneyAvailable > purchaseCost && ramToBuy < additionalRamNeeded) {

                ramToBuy = ramToBuy * 2;

                purchaseCost = ns.getPurchasedServerCost(ramToBuy);
            }

            if (ramToBuy > maxRam) {
                ramToBuy = maxRam;
            }

            const canBuy = canSpendThatMoney(ns, stockMarketReserveMoney, purchaseCost);

            if (canBuy && ramToBuy > additionalRamNeeded) {
                const hostname = "CLOUD-" + String(currentNumberOfPurchasedServers).padStart(3, '0')
                ns.purchaseServer(hostname, ramToBuy);
                updateMoneySpent(ns, purchaseCost);

                return true;
            }
        }
        else {
            if (countOfTriesToBuyServers > 100) {
                ns.toast("Not enough money to buy new server", "warning", 3000)
                countOfTriesToBuyServers = 0;
            }
        }
    } else {
        ns.tprint("max servers already bought");
    }

    return false;
}

function upgradeSmallMachine(ns, smallestPlayerPurchasedServer, maxRam, additionalRamNeeded, stockMarketReserveMoney) {

    let ramToBuy = smallestPlayerPurchasedServer.server.maxRam * 2;

    while (!(ramToBuy - smallestPlayerPurchasedServer.server.maxRam > additionalRamNeeded)) {
        ramToBuy = ramToBuy * 2;
    }

    if (ramToBuy >= maxRam) {
        ramToBuy = maxRam;
    }

    const costOfRamToBuy = ns.getPurchasedServerUpgradeCost(smallestPlayerPurchasedServer.name, ramToBuy);
    const canSpendMoney = canSpendThatMoney(ns, stockMarketReserveMoney, costOfRamToBuy);

    if (canSpendMoney) {
        ns.upgradePurchasedServer(smallestPlayerPurchasedServer.name, ramToBuy);
        updateMoneySpent(ns, costOfRamToBuy);
        return true;
    } else {
        if (countOfTriesToBuyServers > 100) {
            const now = new Date();
            const timeStamp = `[${String(now.getHours()).padStart(2, 0)}:${String(now.getMinutes()).padStart(2, 0)}]`
            ns.toast(`${timeStamp} Too expensive to buy ${ramToBuy} $${Number((costOfRamToBuy).toFixed(2)).toLocaleString()}`, "warning", 300000);
            countOfTriesToBuyServers = 0;
        }

        return purchaseServer(ns, maxRam, additionalRamNeeded, stockMarketReserveMoney);
    }
}

function updateMoneySpent(ns, moneySpent) {
    if (!ns.fileExists("Formulas.exe")) {
        let moneyLeftToSpendOnServers = 2_000_000_000;

        if (ns.fileExists(beforeFormulasServerSpendFile)) {
            moneyLeftToSpendOnServers = ns.read(beforeFormulasServerSpendFile);
        }

        moneyLeftToSpendOnServers -= moneySpent;

        ns.rm(beforeFormulasServerSpendFile);
        ns.write(beforeFormulasServerSpendFile, JSON.stringify(moneyLeftToSpendOnServers), "W");
    }
}

function canSpendThatMoney(ns, stockMarketReserveMoney, costOfRamToBuy) {
    let moneyToSpend = costOfRamToBuy;

    if (!ns.fileExists("Formulas.exe")) {
        let moneyLeftToSpendOnServers = 2_000_000_000;

        if (ns.fileExists(beforeFormulasServerSpendFile)) {
            moneyLeftToSpendOnServers = JSON.parse(ns.read(beforeFormulasServerSpendFile));
        }

        if (moneyToSpend > moneyLeftToSpendOnServers) {
            moneyToSpend = moneyLeftToSpendOnServers;
        }
    }

    if (moneyToSpend !== costOfRamToBuy) {
        return false;
    }

    return stockMarketReserveMoney.canSpend(ns, costOfRamToBuy);
}


class TypeOfPurchase {

    max = false;
    min = true;
    average = false;
    lastPurchaseDate = new Date();

    constructor(obj) {
        obj && Object.assign(this, obj);
    }


    changeType() {

        if (this.min) {
            this.min = false;
            this.average = true;
            this.max = false;
            return;
        }

        if (this.average) {
            this.min = false;
            this.average = false;
            this.max = true;
            return;
        }

        if (this.max) {
            this.min = true;
            this.average = false;
            this.max = false;
            return;
        }

        this.lastPurchaseDate = new Date();
    }
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