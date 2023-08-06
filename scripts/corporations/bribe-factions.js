export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    let corporation = ns.corporation.getCorporation();

    if (corporation.public && corporation.divisions.length === 1) {
        return;
    }

    const profit = corporation.revenue - corporation.expenses;

    if (profit > 1_000_000_000_000) {
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

            if (maximumAugRep > 0) {
                mostRepExpensiveForEachFaction.push({ faction, maximumAugRep });
            }
        }
        
        if (mostRepExpensiveForEachFaction.length > 0) {
            for (const factionWithRep of mostRepExpensiveForEachFaction) {

                let currentFactionRep = ns.singularity.getFactionRep(factionWithRep.faction);

                corporation = ns.corporation.getCorporation();
                const capitalReserve = profit * 2;
                const liquidFunds = corporation.funds;
                const investableAmount = liquidFunds - capitalReserve;

                const amountToDonate = 20_000_000_000_000;

                if (currentFactionRep < factionWithRep.maximumAugRep && investableAmount > amountToDonate) {
                    ns.corporation.bribe(factionWithRep.faction, amountToDonate)
                    ns.write("data/bribedFaction.txt");
                }
            }
        }
    }

}