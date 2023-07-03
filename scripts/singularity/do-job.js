export async function main(ns) {
    const companiesWeWantToBecomePartOf = ["Blade Industries", "ECorp"];

    for (const companyName of companiesWeWantToBecomePartOf) {
        ns.singularity.applyToCompany(companyName, "software");
    }

    const currentWork = ns.singularity.getCurrentWork();

    if (!currentWork || (currentWork && currentWork.type !== "FACTION" || currentWork.type !== "CREATE_PROGRAM")) {

        const player = ns.getPlayer();

        const companiesWorkingForWithoutBeinginFaction = Object.keys(player.jobs)
            .filter(x => !player.factions.includes(x));

        for (const company of companiesWorkingForWithoutBeinginFaction) {
            const positionInCompany = player.jobs[company];
            const currentPositionInfo = ns.singularity.getCompanyPositionInfo(company, positionInCompany);
            const nextPositionInfo = ns.singularity.getCompanyPositionInfo(company, currentPositionInfo.nextPosition);
            const companyRep = ns.singularity.getCompanyRep(company);

            if (nextPositionInfo.requiredReputation < companyRep && nextPositionInfo.requiredSkills.charisma > player.skills.charisma) {
                if (!currentWork || currentWork.type !== "CLASS") {
                    ns.singularity.universityCourse("Rothman University", "Leadership", true);
                    break;
                }
            } else {
                if(!currentWork || currentWork.type !== "COMPANY"){
                    ns.singularity.workForCompany(company, true);
                }
                break;
            }
        }
    }
}