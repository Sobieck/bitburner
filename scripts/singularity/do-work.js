export async function main(ns) {
    const player = ns.getPlayer();

    const factionToMaxFile = "data/factionToMax.txt";

    let factionToMax;

    if (ns.fileExists(factionToMaxFile)) {
        factionToMax = ns.read(factionToMaxFile);
    }

    const ownedAugmentations = JSON.parse(ns.read("data/ownedAugs.txt"));
    const organizations = JSON.parse(ns.read("data/organizations.txt"));
    const organizationsToJoinInTheOrderWeWantToComplete = organizations.toJoinInOrderInWhichIWantToComplete;
    const doNoWorkFor = organizations.doNoWorkFor;

    const factionsWithAugsToBuyAndNotEnoughtFavor = [];

    for (const faction of organizationsToJoinInTheOrderWeWantToComplete) {
        if (player.factions.includes(faction) && !doNoWorkFor.includes(faction)) {

            const maximumAugRep = Math.max(...ns
                .singularity
                .getAugmentationsFromFaction(faction)
                .filter(x => x !== "NeuroFlux Governor")
                .filter(x => !ownedAugmentations.includes(x))
                .map(x => ns.singularity.getAugmentationRepReq(x)));

            const favor = ns.singularity.getFactionFavor(faction);

            if (maximumAugRep > 0 && favor < 150) {
                factionsWithAugsToBuyAndNotEnoughtFavor.push({ faction, maximumAugRep });
            }
        }
    }


    for (const faction of organizationsToJoinInTheOrderWeWantToComplete) {
        if (factionsWithAugsToBuyAndNotEnoughtFavor.includes(x => x.faction === faction)) {
            const newFactionToMax = factionsWithAugsToBuyAndNotEnoughtFavor[0].faction;

            if (factionToMax !== newFactionToMax) {
                factionToMax = newFactionToMax;
                ns.rm(factionToMaxFile);
                ns.write(factionToMaxFile, factionToMax, "W");
            }

            break;
        }
    }
    // ns.tprint(factionsWithAugsToBuyAndNotEnoughtFavor);

    const currentWork = ns.singularity.getCurrentWork();

    if (currentWork && currentWork.type === "CREATE_PROGRAM") {
        return;
    }

    for (const faction of organizationsToJoinInTheOrderWeWantToComplete) {

        if (currentWork &&
            currentWork.type === "COMPANY" &&
            currentWork.companyName === faction &&
            !player.factions.includes(faction)) {
                
            break;
        }

        const factionsAugs = factionsWithAugsToBuyAndNotEnoughtFavor.find(x => x.faction === faction);

        if (!factionsAugs) {
            continue;
        }

        const maxRepNeeded = factionsAugs.maximumAugRep;
        const factionRep = ns.singularity.getFactionRep(faction);

        if (maxRepNeeded > factionRep) {

            if (!currentWork || currentWork.factionName !== faction) {
                await ns.singularity.workForFaction(faction, "hacking", true);
            }

            break;
        }
    }
}
