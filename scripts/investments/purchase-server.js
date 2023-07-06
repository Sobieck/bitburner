let countOfTriesToBuyServers = 0;
let countOfVisitsWithoutTryingToBuy = 0;

export async function main(ns) {
    const buyOrUpgradeServerFlag = "../../buyOrUpgradeServerFlag.txt";
    const ramObservationsTextFile = '../../data/ramObservations.txt';
    const typeRecord = "../../data/typeOfServerPurchase.txt";

    let additionalRamNeeded = 0;
    let ramObservations = [];
    let type = new TypeOfPurchase();

    if(ns.fileExists(ramObservationsTextFile)){
        countOfVisitsWithoutTryingToBuy++;
    } else {
        countOfVisitsWithoutTryingToBuy = 0;
    }
    
    if (ns.fileExists(buyOrUpgradeServerFlag)) {
        countOfVisitsWithoutTryingToBuy = 0;
    }

    if (!ns.fileExists(buyOrUpgradeServerFlag) || countOfVisitsWithoutTryingToBuy > 300) {
        return;
    } else {
        countOfTriesToBuyServers++;

        if (ns.fileExists(typeRecord)) {
            const tempType = JSON.parse(ns.read(typeRecord));
            type = new TypeOfPurchase(tempType);
        }

        if(!type.lastPurchaseDate){
            type.lastPurchaseDate = new Date();
        }

        if (ns.fileExists(ramObservationsTextFile)) {
            ramObservations = JSON.parse(ns.read(ramObservationsTextFile));

        }

        if(ns.fileExists(buyOrUpgradeServerFlag)){
            const latestRamNeeded = JSON.parse(ns.read(buyOrUpgradeServerFlag));

            ramObservations.push(latestRamNeeded);
    
            ns.rm(buyOrUpgradeServerFlag);
         
            ns.rm(ramObservationsTextFile);
            ns.write(ramObservationsTextFile, JSON.stringify(ramObservations), "W");
        }

        if(ramObservations.length < 10){
            return;
        }

        if (type.min) {
            additionalRamNeeded = Math.min(...ramObservations);
        }

        const average = ramObservations.reduce((a, b) => a + b) / ramObservations.length;

        if (type.average) {
            additionalRamNeeded = average;
        }

        if (type.max) {
            if(ns.fileExists('batchQueue.txt')){
                additionalRamNeeded = Math.max(...ramObservations);
            } else {
                additionalRamNeeded = average * 2;
            }
        } 
    }

    let maxRam = 1048576;
    let upgradeOnly = false;

    if (ns.args[0]) {
        maxRam = ns.args[0];
    }

    if (ns.args[1]) {
        upgradeOnly = true;
    }

    const enviroment = JSON.parse(ns.read('../../data/enviroment.txt'));

    const playerPurchasedServers = enviroment
        .filter(x => x.server.purchasedByPlayer && x.server.maxRam < maxRam)
        .sort((b, a) => a.server.maxRam - b.server.maxRam)

    let upgradedOrPurchased = false;
    if (playerPurchasedServers.length === 0) {
        upgradedOrPurchased = purchaseServer(ns, maxRam, additionalRamNeeded);
    } else {
        const smallestPlayerPurchasedServer = playerPurchasedServers.pop();
        upgradedOrPurchased = upgradeSmallMachine(ns, smallestPlayerPurchasedServer, maxRam, upgradeOnly, additionalRamNeeded);
    }

    if (upgradedOrPurchased) {
        ns.rm(ramObservationsTextFile);
        type.changeType();
        const now = new Date();
        const timeStamp = `[${String(now.getHours()).padStart(2, 0)}:${String(now.getMinutes()).padStart(2, 0)}]`
        ns.toast(`${timeStamp} More than ${Math.round(additionalRamNeeded)} GB bought for server`, "success", null);
    }

    ns.rm(typeRecord);
    ns.write(typeRecord, JSON.stringify(type), "W");
}

function purchaseServer(ns, maxRam, additionalRamNeeded) {
    let currentNumberOfPurchasedServers = ns.getPurchasedServers().length;
    let ramToBuy = 64;

    if (currentNumberOfPurchasedServers < ns.getPurchasedServerLimit()) {

        let purchaseCost =  ns.getPurchasedServerCost(ramToBuy);
        let moneyAvailable = ns.getServerMoneyAvailable("home");

        if (moneyAvailable > purchaseCost) {

            while (moneyAvailable > purchaseCost && ramToBuy < additionalRamNeeded) {
                
                ramToBuy = ramToBuy * 2;
            
                purchaseCost = ns.getPurchasedServerCost(ramToBuy);
            }
            
            if(ramToBuy > maxRam){
                ramToBuy = maxRam;
            }

            if (moneyAvailable > purchaseCost && ramToBuy > additionalRamNeeded) {
                const hostname = "CLOUD-" + String(currentNumberOfPurchasedServers).padStart(3, '0')
                ns.purchaseServer(hostname, ramToBuy);

                return true;
            }
        }
        else {
            ns.toast("Not enough money to buy new server", "warning", 3000)
        }
    } else {
        ns.tprint("max servers already bought");
    }

    return false;
}

function upgradeSmallMachine(ns, smallestPlayerPurchasedServer, maxRam, upgradeOnly, additionalRamNeeded) {

    let ramToBuy = smallestPlayerPurchasedServer.server.maxRam * 2;

    while (!(ramToBuy - smallestPlayerPurchasedServer.server.maxRam > additionalRamNeeded)) {
        ramToBuy = ramToBuy * 2;
    }

    if (ramToBuy >= maxRam) {
        ramToBuy = maxRam;
    }

    const costOfRamToBuy = ns.getPurchasedServerUpgradeCost(smallestPlayerPurchasedServer.name, ramToBuy);
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (moneyAvailable > costOfRamToBuy) {
        ns.upgradePurchasedServer(smallestPlayerPurchasedServer.name, ramToBuy);
        return true;
    } else {
        if(countOfTriesToBuyServers > 100){
            const now = new Date();
            const timeStamp = `[${String(now.getHours()).padStart(2, 0)}:${String(now.getMinutes()).padStart(2, 0)}]`
            ns.toast(`${timeStamp} Too expensive to buy ${ramToBuy} $${Number((costOfRamToBuy).toFixed(2)).toLocaleString()}`, "warning", null);
            countOfTriesToBuyServers = 0;
        }

        
        if (upgradeOnly === false) {
            return purchaseServer(ns, maxRam, additionalRamNeeded);
        }
    }

    return false;
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
