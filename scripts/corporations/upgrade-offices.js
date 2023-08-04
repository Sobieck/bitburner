export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }
    
    const corporation = ns.corporation.getCorporation();

    if (corporation.public && corporation.divisions.length === 1){
        return;
    }

    const capitalReserve = 40_000_000_000;
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

    for (const divisionName of corporation.divisions){
        const division = ns.corporation.getDivision(divisionName);

        for (let [key, city] of Object.entries(ns.enums.CityName)) {
            if (!division.cities.includes(city)) {
                ns.corporation.expandCity(divisionName, city);
            }
        }

        if (division.makesProducts && division.cities.includes("Aevum")) {
            const aevum = "Aevum";
            const aevumOffice = ns.corporation.getOffice(divisionName, aevum);
            const aevumHeadCount = aevumOffice.numEmployees;

            const volhaven = "Volhaven";
            const volhavenHeadCount = ns.corporation.getOffice(divisionName, volhaven).numEmployees;

            const expandOtherOffices = aevumHeadCount - volhavenHeadCount > 69;
            const expandAevum = !expandOtherOffices;


            if  (aevumHeadCount < 5){
                const countNeeded = 5 - aevumOffice.size;
                ns.corporation.upgradeOfficeSize(divisionName, aevum, countNeeded)
            }

            if (expandAevum) {
                const costToExpand = ns.corporation.getOfficeSizeUpgradeCost(divisionName, aevum, 5);

                let aevumHeadCountMax = ns.corporation.getUpgradeLevel("Wilson Analytics") * 18;

                if (aevumHeadCountMax < 90) {
                    aevumHeadCountMax = 90;
                }

                if (costToExpand < investableAmount && aevumHeadCount < aevumHeadCountMax) {
                    ns.corporation.upgradeOfficeSize(divisionName, aevum, 5);
                }
            }

            hireEmployees(aevumOffice, aevumEmployeeRatio, ns, divisionName);


            const citiesWithOfficesWhoArentAevum = division.cities.filter(city => city !== aevum);

            if(volhavenHeadCount < 9 && division.products.length > 1){
                for (const city of citiesWithOfficesWhoArentAevum) {
                    const amountToAdd = 9 - volhavenHeadCount;
                    ns.corporation.upgradeOfficeSize(divisionName, city, amountToAdd);
                }
            }

            if (expandOtherOffices) {
                const costToExpand = ns.corporation.getOfficeSizeUpgradeCost(divisionName, volhaven, 9) * 5;

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

        if (!division.makesProducts && division.cities.includes("Aevum")) {
            const profit = division.lastCycleRevenue - division.lastCycleExpenses;

            const constants = [
                { minProfit: 0, officeSizeGoal: 9, minLiquidFunds: 20_000_000_000 },
                { minLoss: -10, officeSizeGoal: 9, minLiquidFunds: 20_000_000_000 },
                { minProfit: 10_000_000, officeSizeGoal: 18, minLiquidFunds: 400_000_000_000 },
                { minLoss: -250_000, officeSizeGoal: 18, minLiquidFunds: 220_000_000_000 },
                { minLoss: -250_000, officeSizeGoal: 36, minLiquidFunds: 500_000_000_000 },
                { minLoss: -700_000, officeSizeGoal: 189, minLiquidFunds: 10_000_000_000_000 },
                { minProfit: 700_000, officeSizeGoal: 189, minLiquidFunds: 10_000_000_000_000 },
            ]

            for (const constant of constants) {
                for (const city of division.cities) {
                    const office = ns.corporation.getOffice(divisionName, city);

                    let sizeNeeded = 0;

                    if (profit > constant.minProfit && liquidFunds > constant.minLiquidFunds) {
                        sizeNeeded = constant.officeSizeGoal - office.size;
                    }

                    if(profit < constant.minLoss && liquidFunds > constant.minLiquidFunds){
                        sizeNeeded = constant.officeSizeGoal - office.size;
                    }

                    if (sizeNeeded > 0) {
                        ns.corporation.upgradeOfficeSize(divisionName, city, sizeNeeded);
                    }

                    hireEmployees(office, employeeRatio, ns, divisionName)
                }
            }
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