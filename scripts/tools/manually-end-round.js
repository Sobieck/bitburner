export async function main(ns) {

    const player = ns.getPlayer();
    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });


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

    const augmentsLeft = Array.from(purchasableAugments.entries()).sort((a, b) => b[1].price - a[1].price);

    const orderedAugments = []; // { factionName, augmentName, basePrice, multipledPrice}

    function addPrereqs(prereqName) {
        const augment = purchasableAugments.get(prereqName);

        if (augment && !ownedAugmentations.find(x => x.augmentName === prereqName)) {

            if (augment.prereqs.length > 0) {//it has prereqs, pass it into this. 
                for (const prereq of augment.prereqs) {
                    addPrereqs(prereq)
                }
            }

            if (!orderedAugments.find(x => x.augmentName === prereqName)) {
                orderedAugments.push({ faction: augment.faction, augmentName: prereqName, basePrice: augment.price });
            }
        }
    }

    for (const augmentData of augmentsLeft) {
        const augmentName = augmentData[0];
        const augment = augmentData[1];

        if (augment.prereqs.length > 0) {
            for (const prereqName of augment.prereqs) {
                addPrereqs(prereqName);
            }
        }
        
        if (!orderedAugments.find(x => x.augmentName === augmentName)) {
            orderedAugments.push({ faction: augment.faction, augmentName: augmentName, basePrice: augment.price, multipledPrice: 0 })
        }

    }

    let priceMultipler = 1;

    for (const augment of orderedAugments) {
        augment.multipledPrice = augment.basePrice * priceMultipler;
        priceMultipler *= 1.9;
    }

    const moneyNeededForAugments = orderedAugments.reduce((acc, x) => acc + x.multipledPrice, 0);

    const moneyFormatted = formatter.format(moneyNeededForAugments);

    if(ns.args[0] === "finish"){
        for (const augment of orderedAugments) {
            purchaseAug(ns, augment);
        }
    }

    ns.toast(`Money needed for augs: ${moneyFormatted}`)

    ns.rm('orderedAugments.txt')
    ns.write("orderedAugments.txt", JSON.stringify(orderedAugments), "W")

}

function purchaseAug(ns, augment) {
    const ownedAugments = ns.singularity.getOwnedAugmentations(true);
    const augmentName = augment.augmentName;

    if (ownedAugments.includes(augmentName) === false) {
        const augmentPrice = ns.singularity.getAugmentationPrice(augmentName);
        const amountOfMoneyWeHave = ns.getServerMoneyAvailable("home")

        if (augmentPrice < amountOfMoneyWeHave) {
            ns.singularity.purchaseAugmentation(augment.faction, augmentName);
        }
    }
}
