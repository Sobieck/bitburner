export async function main(ns) {

    const buyRepFile = 'data/buyRep.txt';
    if (ns.fileExists(buyRepFile)) {

        const multipliersFileName = "data/multipliers.txt";
        const constants = JSON.parse(ns.read(multipliersFileName));

        const minRepToDonateToFaction = constants.RepToDonateToFaction * 150;

        const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);
        const player = ns.getPlayer();

        const mostRepExpensiveForEachFaction = [];

        for (const faction of player.factions) {
            const maximumAugRep = Math.max(...ns
                .singularity
                .getAugmentationsFromFaction(faction)
                .filter(x => x !== "NeuroFlux Governor")
                .filter(x => !ownedAugmentations.includes(x))
                .filter(x => {
                    const prereqs = ns.singularity.getAugmentationPrereq(x);
                    return prereqs.every(y => ownedAugmentations.includes(y));
                })
                .map(x => ns.singularity.getAugmentationRepReq(x)));

            const favor = ns.singularity.getFactionFavor(faction);

            if (maximumAugRep > 0 && favor > minRepToDonateToFaction) {
                mostRepExpensiveForEachFaction.push({ faction, maximumAugRep });
            }
        }

        if (mostRepExpensiveForEachFaction.length > 0) {
            for (const factionWithRep of mostRepExpensiveForEachFaction) {

                const currentFactionRep = ns.singularity.getFactionRep(factionWithRep.faction);
                const repNeeded = factionWithRep.maximumAugRep - currentFactionRep;

                if (repNeeded < 0) {
                    continue;
                }

                let purchasedRep = 0;
                let dollarsDonated = 0;

                while (repNeeded > purchasedRep) {
                    dollarsDonated += 10_000_000;
                    purchasedRep = ns.formulas.reputation.repFromDonation(dollarsDonated, player);
                }

                ns.singularity.donateToFaction(factionWithRep.faction, dollarsDonated);

                const fileToIndicateWeDonatedToFaction = "data/factionDonatation.txt";
                ns.rm(fileToIndicateWeDonatedToFaction);
                ns.write(fileToIndicateWeDonatedToFaction, factionWithRep.faction, "W");
            }
        }
    }
}