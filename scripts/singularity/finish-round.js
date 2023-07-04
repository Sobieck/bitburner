export async function main(ns) {

    const factionToMaxFile = "data/factionToMax.txt";
    const factionDonationFile = 'data/factionDonatation.txt'
    let factionToMax;

    if (ns.fileExists(factionToMaxFile) || ns.fileExists(factionDonationFile)) {
        if (ns.fileExists(factionToMaxFile)) {
            factionToMax = ns.read(factionToMaxFile);
        } else {
            factionToMax = ns.read(factionDonationFile);
        }
    } else {
        return;
    }

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
        .filter(x => x.faction === factionToMax)
        .pop();

    if (!ownedAugmentations.includes("Artificial Bio-neural Network Implant") && factionToMax === "BitRunners") {
        targetFaction.maximumAugRep = 276_000;
    }

    if (!ownedAugmentations.includes("Embedded Netburner Module Direct Memory Access Upgrade") && factionToMax === "Daedalus") {
        targetFaction.maximumAugRep = 1_000_000;
    }

    if (ownedAugmentations.includes("Embedded Netburner Module Direct Memory Access Upgrade") && !ownedAugmentations.includes("Embedded Netburner Module Core V3 Upgrade") && factionToMax === "Daedalus") {
        targetFaction.maximumAugRep = 1_750_000;
    }

    if (ownedAugmentations.includes("Graphene Bionic Legs Upgrade") && factionToMax === "ECorp") {
        targetFaction.maximumAugRep = 750_000;
    }

    const currentFactionRep = ns.singularity.getFactionRep(targetFaction.faction)

    const targetRep = ns.formulas.reputation.calculateFavorToRep(150)


    if (targetFaction.maximumAugRep < currentFactionRep || targetRep < currentFactionRep || (ns.fileExists(factionDonationFile) && !ns.fileExists(factionToMaxFile))) {

        const stopInvestingFileName = "stopInvesting.txt";
        if (!ns.fileExists(stopInvestingFileName)) {
            ns.write(stopInvestingFileName, "", "W")
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

        const priceOfMostExpensiveAugment = Math.max(...factionsWithAugmentsToBuy.find(x => x.faction === targetFaction.faction).factionAugmentsThatIDontOwnAndCanAfford.map(x => x.price));

        if (priceOfMostExpensiveAugment < 0) {
            return;
        }

        const buyAugmentsWhenWeHaveMoreThanThisMuchMoney = priceOfMostExpensiveAugment * 100;

        const moneyAvailable = ns.getServerMoneyAvailable("home");

        if (moneyAvailable < buyAugmentsWhenWeHaveMoreThanThisMuchMoney) {
            return;
        }

        const stopStockTradingFileName = "stopTrading.txt";
        if (!ns.fileExists(stopStockTradingFileName)) {
            ns.write(stopStockTradingFileName, "", "W")
            return;
        }



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

        const factionsByRating = factionsWithAugmentsToBuy.sort((a, b) => b.factionRep - a.factionRep);

        purchaseNeuroFluxGovernors(ns, factionsByRating[0].faction);

        ns.singularity.installAugmentations('scripts/coordinator.js')
    }
}
function purchaseNeuroFluxGovernors(ns, faction) {
    const augmentName = "NeuroFlux Governor"
    const price = ns.singularity.getAugmentationPrice(augmentName);
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    const augmentRepPrice = ns.singularity.getAugmentationRepReq(augmentName);
    const factionRep = ns.singularity.getFactionRep(faction);

    if (moneyAvailable > price && factionRep > augmentRepPrice) {
        ns.singularity.purchaseAugmentation(faction, augmentName);
    } else {
        return;
    }

    purchaseNeuroFluxGovernors(ns, faction);
}

function upgradeHomeMachine(ns) {
    const ramCost = ns.singularity.getUpgradeHomeRamCost();
    const coreCost = ns.singularity.getUpgradeHomeCoresCost();
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (ramCost > moneyAvailable && coreCost > moneyAvailable) {
        return;
    }

    if (ramCost > coreCost) {
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
            if (!ownedAugments.includes(prereq)) {
                const prereqAugment = purchasableAugments.get(prereq);
                if (prereqAugment) {
                    purchaseAug(ns, prereqAugment.faction, prereq, prereqAugment.prereqs, purchasableAugments);
                }
            }
        }

        if (ns.singularity.getAugmentationPrice(augmentName) < ns.getServerMoneyAvailable("home")) {
            ns.singularity.purchaseAugmentation(faction, augmentName);
            purchasableAugments.delete(augmentName);
        }
    }
}
