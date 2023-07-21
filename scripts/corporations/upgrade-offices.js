export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const excludedDivisions = [
        "Gidget's Farm",
    ]

    const corporation = ns.corporation.getCorporation();
    const divisionsToOperateOn = corporation.divisions.filter(divisionName => !excludedDivisions.includes(divisionName));

    const capitalReserve = 500_000_000_000;
    const liquidFunds = corporation.funds;
    const investableAmount = liquidFunds - capitalReserve;

    const employeeRatio = [
        { type: "Operations", number: 2 },
        { type: "Engineer", number: 2 },
        { type: "Business", number: 1 },
        { type: "Management", number: 2 },
        { type: "Research & Development", number: 2 }
    ];

    const aevumEmployeeRatio = [
        { type: "Operations", number: 1 },
        { type: "Engineer", number: 1 },
        { type: "Business", number: 1 },
        { type: "Management", number: 1 },
        { type: "Research & Development", number: 1 }
    ];

    for (const divisionName of divisionsToOperateOn) {
        const aevum = "Aevum";
        const aevumOffice = ns.corporation.getOffice(divisionName, aevum);
        const aevumHeadCount = aevumOffice.numEmployees;

        const ishima = "Ishima";
        const ishimaHeadCount = ns.corporation.getOffice(divisionName, ishima);

        const expandOtherOffices = aevumHeadCount - ishimaHeadCount > 69;
        const expandAevum = !expandOtherOffices;

        if (expandAevum) {
            const costToExpand = ns.corporation.getOfficeSizeUpgradeCost(divisionName, aevum, 5);

            if (costToExpand < investableAmount) {
                ns.corporation.upgradeOfficeSize(divisionName, aevum, 5);
            }
        }

        hireEmployees(aevumOffice, aevumEmployeeRatio, ns, divisionName);

        const division = ns.corporation.getDivision(divisionName);
        const citiesWithOfficesWhoArentAevum = division.cities.filter(city => city !== aevum);

        if (expandOtherOffices) {
            const costToExpand = ns.corporation.getOfficeSizeUpgradeCost(divisionName, ishima, 9) * 5;

            if (costToExpand < investableAmount) {
                for (const city of citiesWithOfficesWhoArentAevum) {
                    ns.corporation.upgradeOfficeSize(divisionName, city, 9);
                }
            }
        }

        for (const city of citiesWithOfficesWhoArentAevum) {
            const office = ns.corporation.getOffice(divisionName, city);
            hireEmployees(office, employeeRatio, ns, divisionName);
        }
    }
}

function hireEmployees(office, employeeJobsGoals, ns, divisionName) {
    if (office.size === office.numEmployees) {
        return;
    }

    let employeesInRatio = 0;
    for (const goal of employeeJobsGoals) {
        employeesInRatio += goal.number;
    }

    for (let [type, numberOfEmployees] of Object.entries(office.employeeJobs)) {
        const goal = employeeJobsGoals.find(x => x.type === type);

        if (goal) {
            const percent = goal.number / employeesInRatio;
            const requiredEmployeeNumber = percent * office.size;

            if (numberOfEmployees < requiredEmployeeNumber) {
                ns.corporation.hireEmployee(divisionName, office.city, type);
            }
        }
    }
}