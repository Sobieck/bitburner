export async function main(ns) {
    const player = ns.getPlayer();
    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);
    const currentWork = ns.singularity.getCurrentWork();

    if(currentWork.type !== "CREATE_PROGRAM"){
        if (!ns.fileExists("BruteSSH.exe")) {
            ns.singularity.createProgram("BruteSSH.exe", true);
            workingOnGettingAugmentsOrPrograms = true;
        }
    
        if (!ns.fileExists("FTPCrack.exe")) {
            ns.singularity.createProgram("FTPCrack.exe", true);
            workingOnGettingAugmentsOrPrograms = true;
        }
    }

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
        .sort((a, b) => a.maximumAugRep - b.maximumAugRep);


    let workingOnGettingAugmentsOrPrograms = false;

    if (currentWork.type === "FACTION" || currentWork.type === "COMPANY" || !currentWork) {
        for (const factionWithMostExpensiveAug of sortedFactions) {
            const faction = factionWithMostExpensiveAug.faction;
            const maxRepNeeded = factionWithMostExpensiveAug.maximumAugRep;
            const factionRep = ns.singularity.getFactionRep(faction);

            if (maxRepNeeded > factionRep) {
                if (currentWork.factionName !== faction || !currentWork || currentWork.type === "COMPANY") {
                    await ns.singularity.workForFaction(faction, "hacking", true);
                    workingOnGettingAugmentsOrPrograms = true;
                }
            }

            if (currentWork.type === "FACTION" && currentWork.factionName === faction) {
                if (maxRepNeeded > factionRep) {
                    workingOnGettingAugmentsOrPrograms = true;
                    break;
                } else {
                    ns.toast(`Done working for ${faction}`, "success", null);
                }
            }
        }

        if (workingOnGettingAugmentsOrPrograms === false) {
            const workTarget = "ECorp";

            if (player.jobs.ECorp) {
                await ns.singularity.workForCompany(workTarget, player.jobs.ECorp);
            } else {
                await ns.singularity.applyToCompany(workTarget, "software");
            }
        }
    }
}