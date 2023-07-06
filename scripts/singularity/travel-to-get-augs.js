export async function main(ns) {
    const ownedAugmentations = JSON.parse(ns.read("data/ownedAugs.txt"));
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (moneyAvailable > 10_000_000 && notInAnyCityFaction(ns)) {

        if (travelToGetUniqueAugments(ns, "Neuregen Gene Modification", "Chongqing", ownedAugmentations)) { return; }
        if (travelToGetUniqueAugments(ns, 'PCMatrix', "Aevum", ownedAugmentations)) { return; }
        if (travelToGetUniqueAugments(ns, 'CashRoot Starter Kit', "Sector-12", ownedAugmentations)) { return; }
        if (travelToGetUniqueAugments(ns, "DermaForce Particle Barrier", "Volhaven", ownedAugmentations)) { return; }
        if (travelToGetUniqueAugments(ns, "NutriGen Implant", "New Tokyo", ownedAugmentations)) { return; }
        if (travelToGetUniqueAugments(ns, "INFRARET Enhancement", "Ishima", ownedAugmentations)) { return; }
    }

    const playersLocation = ns.getPlayer().city
    if (moneyAvailable > 250_000_000) {
        if (ns.singularity.getFactionRep("Tian Di Hui") === 0 && playersLocation !== "Chongqing") {
            ns.singularity.travelToCity("Chongqing");
        }
    }
}

function notInAnyCityFaction(ns){
    const cityFactions = ["Chongqing", "Aevum", "Sector-12", "Volhaven", "New Tokyo", "Ishima"];

    for (const city of cityFactions) {
        if(ns.singularity.getFactionRep(city)){
            return false;
        }
    }

    return true;
}

function travelToGetUniqueAugments(ns, augmentWanted, city, ownedAugmentations) {
    if (!ownedAugmentations.includes(augmentWanted)) {

        const playersLocation = ns.getPlayer().city
        if (ns.singularity.getFactionRep(city) === 0 && playersLocation !== city) {
            ns.singularity.travelToCity(city);
        }

        return true;
    }
    return false;
}

