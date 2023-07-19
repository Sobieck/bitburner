export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const gidgetsSmokes = "Gidget's Smokes";
    const industry = "Tobacco";
    const corporation = ns.corporation.getCorporation();

    if (corporation.divisions.length === 1 && corporation.funds > 750_000_000_000) {
        ns.corporation.expandIndustry(industry, gidgetsSmokes);
        const division = ns.corporation.getDivision(gidgetsSmokes);

        const otherEmployeeGoals = [
            { type: "Operations", number: 2 },
            { type: "Engineer", number: 2 },
            { type: "Business", number: 1 },
            { type: "Management", number: 2 },
            { type: "Research & Development", number: 2 }
        ];

        for (let [key, city] of Object.entries(ns.enums.CityName)) {
            if (!division.cities.includes(city)) {
                ns.corporation.expandCity(gidgetsSmokes, city);
            }

            const office = ns.corporation.getOffice(gidgetsSmokes, city);

            if (office.size < 9) {
                ns.corporation.upgradeOfficeSize(gidgetsSmokes, city, 3);
            }

            for (let [type, numberOfEmployees] of Object.entries(office.employeeJobs)) {
                const goal = otherEmployeeGoals.find(x => x.type === type);

                if (goal) {
                    if (numberOfEmployees < goal.number) {
                        ns.corporation.hireEmployee(gidgetsSmokes, city, type);
                    }
                }
            }
        }
    }
}