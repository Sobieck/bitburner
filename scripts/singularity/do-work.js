export async function main(ns) {
    const player = ns.getPlayer();
    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);
    const currentWork = ns.singularity.getCurrentWork();
    const organizationTextFileName = "data/organizations.txt";

    const organizations = JSON.parse(ns.read(organizationTextFileName));

    let workingOnGettingAugmentsOrPrograms = false;

    if (!currentWork || currentWork.type !== "CREATE_PROGRAM") {
        if (!ns.fileExists("BruteSSH.exe")) {
            const worked = ns.singularity.createProgram("BruteSSH.exe", true);
            if (worked) {
                workingOnGettingAugmentsOrPrograms = true;
            }

        }

        if (!ns.fileExists("FTPCrack.exe")) {
            const worked = ns.singularity.createProgram("FTPCrack.exe", true);
            if (worked) {
                workingOnGettingAugmentsOrPrograms = true;
            }
        }
    }

    if (!player.factions) {
        ns.singularity.universityCourse("Rothman University", "Computer Science", true);
        return;
    }

    const mostRepExpensiveForEachFaction = [];

    for (const faction of player.factions) {
        const maximumAugRep = Math.max(...ns
            .singularity
            .getAugmentationsFromFaction(faction)
            .filter(x => x !== "NeuroFlux Governor")
            .filter(x => !ownedAugmentations.includes(x))
            .map(x => ns.singularity.getAugmentationRepReq(x)));

        if (maximumAugRep > 0) {
            mostRepExpensiveForEachFaction.push({ faction, maximumAugRep });
        }
    }

    const sortedFactions = mostRepExpensiveForEachFaction
        .filter(x => x.maximumAugRep > 0 && !organizations.lowPriority.includes(x.faction))
        .sort((a, b) => a.maximumAugRep - b.maximumAugRep);

    if (!currentWork || currentWork.type === "FACTION" || currentWork.type === "COMPANY") {
        for (const factionWithMostExpensiveAug of sortedFactions) {
            const faction = factionWithMostExpensiveAug.faction;
            const maxRepNeeded = factionWithMostExpensiveAug.maximumAugRep;
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
                }
            }
        }

        if (workingOnGettingAugmentsOrPrograms === false) {
            const workTarget = "ECorp";

            if (player.jobs.ECorp) {
                await ns.singularity.workForCompany(workTarget, player.jobs.ECorp);
            }
            await ns.singularity.applyToCompany(workTarget, "software");

        }
    }
}