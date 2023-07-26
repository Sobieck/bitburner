export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const researchGoals = [
        { name: "Hi-Tech R&D Laboratory", prereqs: [] },
        { name: "Market-TA.II", prereqs: ["Market-TA.I"] },
        { name: "uPgrade: Capacity.I", prereqs: ["uPgrade: Fulcrum"], productOnly: true},
        { name: "uPgrade: Capacity.II", prereqs: [], productOnly: true},
        { name: "Drones - Assembly", prereqs: [ "Drones"] },
        { name: "Self-Correcting Assemblers", prereqs: []},
        { name: "AutoBrew", prereqs: []},
        { name: "AutoPartyManager", prereqs: []},
        { name: "Go-Juice", prereqs: ["Automatic Drug Administration"]},
        { name: "CPH4 Injections", prereqs: []},
        { name: "Overclock", prereqs: []},
        { name: "Sti.mu", prereqs: []},
        { name: "Drones - Transport", prereqs: []},
    ];

    const corporation = ns.corporation.getCorporation();

    for (const divisionName of corporation.divisions){
        const division = ns.corporation.getDivision(divisionName);

        let totalSpent = 0;
        for (const research of researchGoals) {
            if(research.productOnly && division.makesProducts === false){
                continue;
            }

            let cost = ns.corporation.getResearchCost(divisionName, research.name);

            for (const prereqName of research.prereqs) {
                cost += ns.corporation.getResearchCost(divisionName, prereqName);
            }

            if (ns.corporation.hasResearched(divisionName, research.name)) {
                totalSpent += cost;
                continue;
            }           

            const researchPointsToSpend = division.researchPoints;

            if ((cost * 2) + totalSpent < researchPointsToSpend) {
                for (const prereqName of research.prereqs) {
                    ns.corporation.research(divisionName, prereqName)
                }

                ns.corporation.research(divisionName, research.name);
            }

            break;
        }
    }
}