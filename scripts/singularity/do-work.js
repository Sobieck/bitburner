export async function main(ns) {
    const player = ns.getPlayer();

    const factionToMaxFile = "data/factionToMax.txt";

    let factionToMax;

    if (ns.fileExists(factionToMaxFile)) {
        factionToMax = ns.read(factionToMaxFile);
    }

    const organizations = JSON.parse(ns.read("data/organizations.txt"));
    const organizationsToJoinInTheOrderWeWantToComplete = organizations.toJoinInOrderInWhichIWantToComplete;

    const factionsWithAugsToBuyAndNotEnoughtFavor = JSON.parse(ns.read("data/factionsWithAugsToBuyAndNotEnoughtFavor.txt"))

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

    if (currentWork && 
        (currentWork.type === "CREATE_PROGRAM" || 
        currentWork.type === "CRIME")) {
        
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
            currentWork.classType === "Leadership" &&
            factionToMax !== "Chongqing") {

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
        } else {
            if (currentWork && currentWork.factionName === faction) {
                await ns.singularity.stopAction()
            }
        }
    }
}
