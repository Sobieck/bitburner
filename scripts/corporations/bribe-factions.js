export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    let corporation = ns.corporation.getCorporation();
    const profit = corporation.revenue - corporation.expenses;

    if(profit > 1_000_000_000_000){
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

        if(mostRepExpensiveForEachFaction.length > 0){
            for (const factionWithRep of mostRepExpensiveForEachFaction) {
                
                let currentFactionRep = ns.singularity.getFactionRep(factionWithRep.faction);
                const repNeeded = factionWithRep.maximumAugRep - currentFactionRep;
                
                corporation = ns.corporation.getCorporation();
                const capitalReserve = 400_000_000_000;
                const liquidFunds = corporation.funds;
                const investableAmount = liquidFunds - capitalReserve;

                const amountToDonate = 1_000_000_000_000;
                
                let amountSpent = amountToDonate;
                while(currentFactionRep < repNeeded && investableAmount > amountSpent){

                    ns.corporation.bribe(factionWithRep.faction, amountToDonate)
                    
                    amountSpent += amountToDonate;
                    currentFactionRep = ns.singularity.getFactionRep(factionWithRep.faction);           
                }
            }
        }
    }

}