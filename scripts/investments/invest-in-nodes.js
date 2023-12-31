export async function main(ns) {
    const moneyToInvest = ns.getServerMoneyAvailable("home");

    if (moneyToInvest < 1_000_000_000_000) {
        return;
    }
    
    let endDate = ns.args[0];

    if (endDate === undefined){
        endDate = new Date();
        endDate.setHours(endDate.getHours() + 6);
    } else {
        const timeLeftInSeconds = (new Date(endDate) - new Date()) / 1000;
        const conservativeTimeLeft = timeLeftInSeconds / 2;
    
        let numberPurchased = 0
    
        while(buyHacknetNodeIfAboveBreakeven(ns, conservativeTimeLeft)){
            numberPurchased++;
        }

        if(numberPurchased != 0){
            ns.tprint("Total nodes purchase: ", numberPurchased);
        }        
    }
}

function buyHacknetNodeIfAboveBreakeven(ns, secondsLeft) {
    const productionMultiplier = 2.8991;
    const upgradeCostMultiplier = 0.8700;

    const fixedCostOfFullyUpgradedNode = 409_194_200 * upgradeCostMultiplier;
    const variableCost = ns.hacknet.getPurchaseNodeCost();
    const totalCost = variableCost + fixedCostOfFullyUpgradedNode;

    const moneyToInvest = ns.getServerMoneyAvailable("home");

    if (totalCost > moneyToInvest) {
        return false;
    }

    const revPerSecond = 9172 * productionMultiplier;
    const expectedValue = secondsLeft * revPerSecond;

    if (expectedValue < totalCost) {
        return false;
    }

    const indexOfNode = ns.hacknet.purchaseNode();
    ns.hacknet.upgradeLevel(indexOfNode, 199);
    ns.hacknet.upgradeRam(indexOfNode, 6);
    ns.hacknet.upgradeCore(indexOfNode, 15);

    return true;
}

