export async function main(ns) {
    const organizations = JSON.parse(ns.read("data/organizations.txt"));
    const ownedAugmentations = JSON.parse(ns.read("data/ownedAugs.txt"));
    const companiesWeWantToBecomePartOf = organizations.companiesWeWantToBecomePartOf;
    const orderedFactions = organizations.toJoinInOrderInWhichIWantToComplete;

    const currentWork = ns.singularity.getCurrentWork();

    if (currentWork && currentWork.type === "CREATE_PROGRAM") {
        return;
    }

    let factionWeAreWorkingAtNow;
    if (currentWork && currentWork.type === "FACTION") {
        factionWeAreWorkingAtNow = currentWork.factionName;
    }

    if (currentWork && currentWork.type === "COMPANY") {
        factionWeAreWorkingAtNow = currentWork.companyName;
    }

    const player = ns.getPlayer();
    let company;

    for (const potentialCompany of companiesWeWantToBecomePartOf) {
        if (!player.factions.includes(potentialCompany)) {

            if (!factionWeAreWorkingAtNow) {
                company = potentialCompany;
                break;
            }

            for (const faction of orderedFactions) {
                if (faction === potentialCompany) {
                    company = potentialCompany;
                    break;
                }

                if (faction === factionWeAreWorkingAtNow) {
                    break;
                }
            }
        }
    }

    if (!company) {
        return;
    }


    const positionInCompany = player.jobs[company];

    if(!positionInCompany){
        return;
    }

    const currentPositionInfo = ns.singularity.getCompanyPositionInfo(company, positionInCompany);
    const nextPositionInfo = ns.singularity.getCompanyPositionInfo(company, currentPositionInfo.nextPosition);
    const companyRep = ns.singularity.getCompanyRep(company);

    if (nextPositionInfo.requiredReputation < companyRep && nextPositionInfo.requiredSkills.charisma > player.skills.charisma) {
        if(!ownedAugmentations.includes("SmartJaw") && currentWork.type !== "GRAFTING"){
            ns.singularity.travelToCity("New Tokyo")
            ns.grafting.graftAugmentation("SmartJaw", true);
        }

        if(currentWork.type === "GRAFTING"){
            return;
        }

        if (!currentWork || currentWork.type !== "CLASS") {
            ns.singularity.travelToCity("Sector-12");
            ns.singularity.universityCourse("Rothman University", "Leadership", true);
            return;
        } 
    } else {
        if (!currentWork || currentWork.type !== "COMPANY") {
            ns.singularity.workForCompany(company, true);
        }
        return;
    }
}
