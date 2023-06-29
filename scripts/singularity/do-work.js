export async function main(ns) {
    const player = ns.getPlayer();
    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);

    const mostRepExpensiveForEachFaction = [];

    for (const faction of player.factions) {
        const maximumAugRep = Math.max(...ns
            .singularity
            .getAugmentationsFromFaction(faction)
            .filter(x => !ownedAugmentations.includes(x))
            .map(x => ns.singularity.getAugmentationRepReq(x)));

        mostRepExpensiveForEachFaction.push({ faction, maximumAugRep });
    }

    const sortedFactions = mostRepExpensiveForEachFaction
        .filter(x => x.maximumAugRep > 0)
        .sort((a,b) => a.maximumAugRep - b.maximumAugRep);

    const currentWork = ns.singularity.getCurrentWork();

    for (const factionWithMostExpensiveAug of sortedFactions) {
        const faction = factionWithMostExpensiveAug.faction;
        const maxRepNeeded = factionWithMostExpensiveAug.maximumAugRep;
        const factionRep = ns.singularity.getFactionRep(faction);

        if (maxRepNeeded > factionRep && (!currentWork || currentWork.type === "FACTION")){            
            if(currentWork.factionName !== faction || !currentWork){
                await ns.singularity.workForFaction(faction, "hacking", false);
            }            
        }

        if (currentWork.type === "FACTION" && currentWork.factionName === faction){
            if (maxRepNeeded > factionRep){
                break;
            } else {
                ns.toast(`Done working for ${faction}`, "success", null);
            }
        }
    }
}