export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const researchGoals = [
        "Hi-Tech R&D Laboratory",
        "Market-TA.I",
        "Market-TA.II",
    ];

    const corporation = ns.corporation.getCorporation();

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);

        for (const research of researchGoals) {
            if(ns.corporation.hasResearched(divisionName, research)){
                continue;
            }   
            
            const cost = ns.corporation.getResearchCost(divisionName, research);
            const researchPointsToSpend = division.researchPoints;

            if (cost * 2 < researchPointsToSpend) {
                ns.corporation.research(divisionName, research);
            }
        }
    }
}