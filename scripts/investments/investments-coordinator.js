export async function main(ns) {
    const ramObservationsTextFile = '../../data/ramObservations.txt';
    const moneyAvailable = ns.getServerMoneyAvailable("home");
    
    const stopInvestingFileName = "stopInvesting.txt";
    if (ns.fileExists(stopInvestingFileName)) {
        if (ns.fileExists(ramObservationsTextFile)) {
            ns.rm(ramObservationsTextFile);
        }
        return;
    }

    const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
    let stockMarketReserveMoney = new ReserveForTrading();
    if (ns.fileExists(stockMarketReserveMoneyFile)) {
        stockMarketReserveMoney = new ReserveForTrading(JSON.parse(ns.read(stockMarketReserveMoneyFile)));
    }
    
    if (stockMarketReserveMoney.moneyInvested > 7_000_000_000) {
        if (!ns.fileExists("Formulas.exe")) {
            checkTor(ns);
            const formulasCost = ns.singularity.getDarkwebProgramCost("Formulas.exe")
            if(stockMarketReserveMoney.canSpend(ns, formulasCost)){
                ns.singularity.purchaseProgram("Formulas.exe");
                ns.rm(ramObservationsTextFile);
                ns.rm('../../buyOrUpgradeServerFlag.txt');
            }
        }
    }

    ns.run('scripts/investments/purchase-server.js');
    
    purchaseProgram(ns, 50, "BruteSSH.exe", stockMarketReserveMoney);
    purchaseProgram(ns, 100, "FTPCrack.exe", stockMarketReserveMoney);
    purchaseProgram(ns, 250, "relaySMTP.exe", stockMarketReserveMoney);
    purchaseProgram(ns, 500, "HTTPWorm.exe", stockMarketReserveMoney);
    purchaseProgram(ns, 750, "SQLInject.exe", stockMarketReserveMoney);


    if (moneyAvailable > 1_000_000_000_000) {
        const endDate = new Date();
        endDate.setHours(endDate.getHours() + 6);
        ns.run('scripts/investments/invest-in-nodes.js', 1, endDate.toISOString())
    }
  
}

function purchaseProgram(ns, atWhatHackingLevelToBuy, programToBuy, stockMarketReserveMoney) {
    const playerHackingLevel = ns.getHackingLevel();
    if (!ns.fileExists(programToBuy) && playerHackingLevel > atWhatHackingLevelToBuy) {

        const cost = ns.singularity.getDarkwebProgramCost(programToBuy)
        
        if(stockMarketReserveMoney.canSpend(ns, cost)){
            checkTor(ns);
            ns.singularity.purchaseProgram(programToBuy);
        }
    }
}

function checkTor(ns) {
    if (!ns.hasTorRouter()) {
        ns.singularity.purchaseTor()
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

            const nameOfRequest = "investments-coordinator";
            this.moneyRequested.delete(nameOfRequest);
            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
        }

        return canSpend;
    }

    requestMoney(ns, amount){
        const nameOfRequest = "investments-coordinator";
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
