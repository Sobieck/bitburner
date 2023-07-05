export async function main(ns) {
    const ownedAugmentations = JSON.parse(ns.read("data/ownedAugs.txt"));
    const moneyAvailable = ns.getServerMoneyAvailable("home");
    if (moneyAvailable > 105_000_000) {

        if (travelToGetUniqueAugments(ns, "Neuregen Gene Modification", "Chongqing", ownedAugmentations)) { }
        else if (travelToGetUniqueAugments(ns, 'PCMatrix', "Aevum", ownedAugmentations)) { }
        else if (!ownedAugmentations.includes("CashRoot Starter Kit")) {
            // toJoin.push("Sector-12");
            // lowPriority.push("Sector-12");
        }
        else if (travelToGetUniqueAugments(ns, "DermaForce Particle Barrier", "Volhaven", ownedAugmentations)) { }
        else if (travelToGetUniqueAugments(ns, "NutriGen Implant", "New Tokyo", ownedAugmentations)) { }
        else if (travelToGetUniqueAugments(ns, "INFRARET Enhancement", "Ishima", ownedAugmentations)) { }
    }

    if (moneyAvailable > 200_000_000 && ns.singularity.getFactionRep("Tian Di Hui") === 0) {
        if (ns.singularity.getFactionRep("Chongqing") === 0) {
            ns.singularity.travelToCity("Chongqing");
        }
    }

}

function travelToGetUniqueAugments(ns, augmentWanted, city, ownedAugmentations) {

    if (!ownedAugmentations.includes(augmentWanted)) {

        if (ns.singularity.getFactionRep(city) === 0) {
            ns.singularity.travelToCity(city);
            return true;
        }
    }
    return false;
}

