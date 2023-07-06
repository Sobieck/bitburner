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
    const stopAtAugments = organizations.stopAtAugments;

    const factionsWithAugsToBuyAndNotEnoughtFavor = [];

    for (const faction of organizationsToJoinInTheOrderWeWantToComplete) {
        if (player.factions.includes(faction) && !doNoWorkFor.includes(faction)) {

            let augmentsForFaction = ns
                .singularity
                .getAugmentationsFromFaction(faction);

            let stopAtAugmentForFaction = stopAtAugments
                .find(x => x.faction === faction);

            if (stopAtAugmentForFaction) {
                if (ownedAugmentations.includes(stopAtAugmentForFaction.augmentToStopAt) && stopAtAugmentForFaction.final) {
                    augmentsForFaction = [];
                } else if (ownedAugmentations.includes(stopAtAugmentForFaction.augmentToStopAt) && !stopAtAugmentForFaction.final) {
                    augmentsForFaction = augmentsForFaction;
                } else {
                    augmentsForFaction = augmentsForFaction.filter(x => x === stopAtAugmentForFaction.augmentToStopAt);
                }
            }

            const maximumAugRep = Math.max(...augmentsForFaction
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
        const factionInAugsMix = factionsWithAugsToBuyAndNotEnoughtFavor.find(x => x.faction === faction);

        if (factionInAugsMix) {

            const newFactionToMax = factionInAugsMix.faction;

            if (factionToMax !== newFactionToMax) {
                factionToMax = newFactionToMax;
                ns.rm(factionToMaxFile);
                ns.write(factionToMaxFile, factionToMax, "W");
            }

            break;
        }
    }

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

        if (currentWork &&
            currentWork.type === "CLASS" && 
            currentWork.classType === "Leadership") {
                
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
