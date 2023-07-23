export async function main(ns) {
    const player = ns.getPlayer();

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

            if (maximumAugRep > 0 && favor < 75) {
                factionsWithAugsToBuyAndNotEnoughtFavor.push({ faction, maximumAugRep });
            }
        }
    }

    const factionsWithAugsToBuyAndNotEnoughtFavorFile = "data/factionsWithAugsToBuyAndNotEnoughtFavor.txt";
    ns.rm(factionsWithAugsToBuyAndNotEnoughtFavorFile);
    ns.write(factionsWithAugsToBuyAndNotEnoughtFavorFile, JSON.stringify(factionsWithAugsToBuyAndNotEnoughtFavor), "W");

}
