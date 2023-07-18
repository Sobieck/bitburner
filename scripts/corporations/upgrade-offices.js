export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const gidgetsFarm = "Gidget's Farm";
    const division = ns.corporation.getDivision(gidgetsFarm);
    const corporation = ns.corporation.getCorporation();

    if (corporation.funds > 200_000_000_000) {

        const employeeGoals = [
            { type: "Operations", number: 2 },
            { type: "Engineer", number: 2 },
            { type: "Business", number: 1 },
            { type: "Management", number: 2 },
            { type: "Research & Development", number: 2 }
        ];

        for (const city of division.cities) {
            const office = ns.corporation.getOffice(gidgetsFarm, city); //{"city":"Aevum","size":9,"maxEnergy":100,"maxMorale":100,"numEmployees":3,"avgEnergy":100,"avgMorale":100,"totalExperience":253.66300000003503,"employeeProductionByJob":{"total":776.2630000000352,"Operations":280.064333333345,"Engineer":314.78150000001756,"Business":181.41716666667253,"Management":0,"Research & Development":0,"Intern":0,"Unassigned":0},"employeeJobs":{"Operations":1,"Engineer":1,"Business":1,"Management":0,"Research & Development":0,"Intern":0,"Unassigned":0}}

            if (office.size < 9) {
                ns.corporation.upgradeOfficeSize(gidgetsFarm, city, 3);
            }

            for (let [type, numberOfEmployees] of Object.entries(office.employeeJobs)) {
                const goal = employeeGoals.find(x => x.type === type);

                if (goal) {
                    if (numberOfEmployees < goal.number) {
                        ns.corporation.hireEmployee(gidgetsFarm, city, type);
                    }
                }
            }
        }
    }
}