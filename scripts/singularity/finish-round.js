export async function main(ns) {

    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (moneyAvailable < 200_000_000_000){
        return;
    }

    const organizationTextFileName = "data/organizations.txt";
    const organizations = JSON.parse(ns.read(organizationTextFileName));

    const player = ns.getPlayer();
    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);


    const mostRepExpensiveForEachFaction = [];
    for (const faction of player.factions) {
        const maximumAugRep = Math.max(...ns
            .singularity
            .getAugmentationsFromFaction(faction)
            .filter(x => x !== "NeuroFlux Governor")
            .filter(x => !ownedAugmentations.includes(x))
            .map(x => ns.singularity.getAugmentationRepReq(x)));

        if (maximumAugRep > 0) {
            mostRepExpensiveForEachFaction.push({ faction, maximumAugRep });
        }
    }

    const targetFaction = mostRepExpensiveForEachFaction
        .filter(x => x.maximumAugRep > 0 && !organizations.lowPriority.includes(x.faction))
        .sort((a, b) => b.maximumAugRep - a.maximumAugRep)
        .pop();

    if(targetFaction.maximumAugRep > ns.singularity.getFactionRep(targetFaction.faction)){
        return;
    }

    const stopTradingFileName = "stopTrading.txt";
    if (!ns.fileExists(stopTradingFileName)) {
        ns.write(stopTradingFileName, "", "W")
        return;
    }

    const factionsWithAugmentsToBuy =
        mostRepExpensiveForEachFaction
            .map(x => {
                {
                    const faction = x.faction;
                    const factionRep = ns.singularity.getFactionRep(faction);
                    const factionAugmentsThatIDontOwnAndCanAfford = ns
                        .singularity
                        .getAugmentationsFromFaction(faction)
                        .filter(y => y !== "NeuroFlux Governor")
                        .filter(y => !ownedAugmentations.includes(y))
                        .map(y => {
                            return {
                                augmentName: y,
                                augmentationRepCost: ns.singularity.getAugmentationRepReq(y),
                                price: ns.singularity.getAugmentationPrice(y),
                                prereqs: ns.singularity.getAugmentationPrereq(y)
                            }
                        })
                        .filter(y => y.augmentationRepCost < factionRep)
                        .sort((a, b) => b.price - a.price);

                    return {
                        faction,
                        factionRep,
                        factionAugmentsThatIDontOwnAndCanAfford
                    }
                }
            });

    const purchasableAugments = new Map();

    for (const factionWithAugments of factionsWithAugmentsToBuy) {
        for (const augment of factionWithAugments.factionAugmentsThatIDontOwnAndCanAfford) {
            if (purchasableAugments.has(augment.augmentName) === false) {
                const item = {
                    augmentationRepCost: augment.augmentationRepCost,
                    price: augment.price,
                    prereqs: augment.prereqs,
                    faction: factionWithAugments.faction
                }
                purchasableAugments.set(augment.augmentName, item)
            }
        }
    }

    const targetFactionsAugments = factionsWithAugmentsToBuy.find(x => x.faction === targetFaction.faction);

    for (const augmentData of targetFactionsAugments.factionAugmentsThatIDontOwnAndCanAfford) {
        purchaseAug(ns, targetFactionsAugments.faction, augmentData.augmentName, augmentData.prereqs, purchasableAugments);
    }

    const augmentsLeft = Array.from(purchasableAugments.entries());

    for (const augmentData of augmentsLeft) {
        const augment = augmentData[0];
        const data = augmentData[1];

        purchaseAug(ns, data.faction, augment, data.prereqs, purchasableAugments);
    }

    upgradeHomeMachine(ns);

    purchaseNeuroFluxGovernors(ns, targetFaction.faction);

    ns.singularity.installAugmentations('scripts/coordinator.js')
}

function purchaseNeuroFluxGovernors(ns, faction) {
    const augmentName = "NeuroFlux Governor"
    const price = ns.singularity.getAugmentationPrice(augmentName);
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if(moneyAvailable > price){
        ns.singularity.purchaseAugmentation(faction, augmentName);
    } else {
        return;
    }

    purchaseNeuroFluxGovernors(ns, faction);    
}

function upgradeHomeMachine(ns){
    const ramCost = ns.singularity.getUpgradeHomeRamCost();
    const coreCost = ns.singularity.getUpgradeHomeCoresCost();
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if(ramCost > moneyAvailable && coreCost > moneyAvailable){
        return;
    }

    if (ramCost > coreCost){
        ns.singularity.upgradeHomeCores();
    } else {
        ns.singularity.upgradeHomeRam();
    }

    return upgradeHomeMachine(ns);
}

function purchaseAug(ns, faction, augmentName, prereqs, purchasableAugments) {
    const ownedAugments = ns.singularity.getOwnedAugmentations(true)

    if (ownedAugments.includes(augmentName) === false) {
        for (const prereq of prereqs) {
            if(!ownedAugments.includes(prereq)){
                const prereqAugment = purchasableAugments.get(prereq);
                purchaseAug(ns, prereqAugment.faction, prereq, prereqAugment.prereqs, purchasableAugments);
            }
        }

        if(ns.singularity.getAugmentationPrice(augmentName) < ns.getServerMoneyAvailable("home")){
            ns.singularity.purchaseAugmentation(faction, augmentName);
            purchasableAugments.delete(augmentName);
        }        
    }
}
