export async function main(ns) {
    const player = ns.getPlayer();
    const currentWork = ns.singularity.getCurrentWork();
    const factionToMaxFile = "data/factionToMax.txt";

    let factionToMax;

    if (ns.fileExists(factionToMaxFile)) {
        factionToMax = ns.read(factionToMaxFile);
    }

    const ownedAugmentations = JSON.parse(ns.read("data/ownedAugs.txt"));
    const organizations = JSON.parse(ns.read("data/organizations.txt"));

    let workingOnGettingAugmentsOrPrograms = false;

    const mostRepExpensiveForEachFaction = [];

    for (const faction of player.factions) {
        const maximumAugRep = Math.max(...ns
            .singularity
            .getAugmentationsFromFaction(faction)
            .filter(x => x !== "NeuroFlux Governor")
            .filter(x => !ownedAugmentations.includes(x))
            .map(x => ns.singularity.getAugmentationRepReq(x)));

        const favor = ns.singularity.getFactionFavor(faction);

        if (maximumAugRep > 0 && favor < 150) {
            mostRepExpensiveForEachFaction.push({ faction, maximumAugRep });
        }
    }

    const sortedFactions = mostRepExpensiveForEachFaction
        .filter(x => x.maximumAugRep > 0 && !organizations.lowPriority.includes(x.faction))
        .sort((a, b) => a.maximumAugRep - b.maximumAugRep);

    if (sortedFactions.length > 0 && !factionToMax) {
        factionToMax = sortedFactions[0].faction;
        ns.write(factionToMaxFile, factionToMax, "W");
    }

    if (!currentWork || currentWork.type === "FACTION" || currentWork.type === "COMPANY") {
        for (const factionWithTheirMostExpensiveAug of sortedFactions) {
            const faction = factionWithTheirMostExpensiveAug.faction;
            const maxRepNeeded = factionWithTheirMostExpensiveAug.maximumAugRep;
            const factionRep = ns.singularity.getFactionRep(faction);

            if (maxRepNeeded > factionRep) {
                if (!currentWork || currentWork.factionName !== faction || currentWork.type === "COMPANY") {
                    await ns.singularity.workForFaction(faction, "hacking", true);
                    workingOnGettingAugmentsOrPrograms = true;
                }
            }

            if (!currentWork || currentWork.type === "FACTION" && currentWork.factionName === faction) {
                if (maxRepNeeded > factionRep) {
                    workingOnGettingAugmentsOrPrograms = true;
                    break;
                } else {
                    ns.toast(`Done working for ${faction}`, "success", null);
                    // ns.singularity.stopAction();
                }
            }
        }

        if (workingOnGettingAugmentsOrPrograms === false) {

            const veryGoodHackingAugment = "Neuregen Gene Modification";
            const cityThatProvidesThatAugment = "Chongqing";
            if (!ownedAugmentations.includes(veryGoodHackingAugment)) {

                if (ns.singularity.getFactionRep(cityThatProvidesThatAugment) < ns.singularity.getAugmentationRepReq(veryGoodHackingAugment)) {
                    if (!currentWork || currentWork.factionName !== cityThatProvidesThatAugment || currentWork.type === "COMPANY") {
                        await ns.singularity.workForFaction(cityThatProvidesThatAugment, "hacking", true);
                    }
                } else {
                    if (currentWork && currentWork.factionName === cityThatProvidesThatAugment) {
                        ns.singularity.stopAction();
                    }
                }
            }
        }
    }
}
