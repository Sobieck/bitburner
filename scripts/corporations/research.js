export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const researchGoals = [
        { name: "Hi-Tech R&D Laboratory", prereqs: [] },
        { name: "Market-TA.II", prereqs: ["Market-TA.I"] },
    ];

    const corporation = ns.corporation.getCorporation();

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);

        for (const research of researchGoals) {
            if (ns.corporation.hasResearched(divisionName, research.name)) {
                continue;
            }

            let cost = ns.corporation.getResearchCost(divisionName, research.name);

            for (const prereqName of research.prereqs) {
                cost += ns.corporation.getResearchCost(divisionName, prereqName);
            }

            const researchPointsToSpend = division.researchPoints;

            if (cost * 2 < researchPointsToSpend) {
                for (const prereqName of research.prereqs) {
                    ns.corporation.research(divisionName, prereqName)
                }

                ns.corporation.research(divisionName, research.name);
            }
        }
    }
}