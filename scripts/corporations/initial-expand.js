export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    const gidgetsFarm = "Gidget's Farm";
    const industry = "Agriculture";

    const industryInformation = ns.corporation.getIndustryData(industry);

    if (corporation.divisions.length === 0) {
        ns.corporation.expandIndustry(industry, gidgetsFarm);
    }

    const smartSupplyName = "Smart Supply";
    if (!ns.corporation.hasUnlock(smartSupplyName)) {
        ns.corporation.purchaseUnlock(smartSupplyName);
    }

    const division = ns.corporation.getDivision(gidgetsFarm);

    for (let [key, city] of Object.entries(ns.enums.CityName)) {
        if (!division.cities.includes(city)) {
            ns.corporation.expandCity(gidgetsFarm, city);
        }
    }

    for (let city of division.cities) {
        if (!ns.corporation.hasWarehouse(gidgetsFarm, city)) {
            ns.corporation.purchaseWarehouse(gidgetsFarm, city);
        }

        const warehouse = ns.corporation.getWarehouse(division.name, city);

        if (warehouse.smartSupplyEnabled === false) {
            ns.corporation.setSmartSupply(gidgetsFarm, city, true);
            ns.corporation.setSmartSupplyOption(gidgetsFarm, city, "Water", "leftovers");
            ns.corporation.setSmartSupplyOption(gidgetsFarm, city, "Chemicals", "leftovers");
        }

        const percentUsedOfWarehouse = warehouse.sizeUsed / warehouse.size;

        if (warehouse.size < 300 && percentUsedOfWarehouse > 0.5){
            ns.corporation.upgradeWarehouse(gidgetsFarm, city);
        }
    }

    for (let city of division.cities) {
        const office = ns.corporation.getOffice(gidgetsFarm, city);

        if (office.numEmployees < 3) {
            ns.corporation.hireEmployee(gidgetsFarm, city, "Operations");
            ns.corporation.hireEmployee(gidgetsFarm, city, "Engineer");
            ns.corporation.hireEmployee(gidgetsFarm, city, "Business");
        }
    }

    const materialsToSell = [
        { name: "Plants", amtPerSecond: "MAX", price: "MP" },
        { name: "Food", amtPerSecond: "MAX", price: "MP" },
    ];

    for (let city of division.cities) {
        for (const material of materialsToSell) {
            ns.corporation.sellMaterial(gidgetsFarm, city, material.name, material.amtPerSecond, material.price);
        }
    }

    if (division.numAdVerts === 0) {
        ns.corporation.hireAdVert(gidgetsFarm);
    }

    const initialUpgrades = [
        "FocusWires",
        "Neural Accelerators",
        "Speech Processor Implants",
        "Nuoptimal Nootropic Injector Implants",
        "Smart Factories",
    ];

    for (const upgrade of initialUpgrades) {
        const upgradeLevel = ns.corporation.getUpgradeLevel(upgrade);
        const upgradeCost = ns.corporation.getUpgradeLevelCost(upgrade);

        const reserve = 10_000_000_000;
        const fundsLessReserve = ns.corporation.getCorporation().funds - reserve;

        if (upgradeLevel < 2 && upgradeCost < fundsLessReserve) {
            ns.corporation.levelUpgrade(upgrade);
        }
    }

    const profit = corporation.revenue - corporation.expenses;

    const thingsToUpgrade = [
        "Smart Factories",
        "Smart Storage",
    ]

    if (corporation.funds > 200_000_000_000 && profit > 1_000_000) {

        for (const upgrade of thingsToUpgrade) {
            const level = ns.corporation.getUpgradeLevel(upgrade);
            if(level < 10){
                ns.corporation.levelUpgrade(upgrade);
            }
        }      
    }

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

    if (corporation.funds > 40_000_000_000 && profit > 1_000_000) {
        for (const city of division.cities) {
            const warehouse = ns.corporation.getWarehouse(gidgetsFarm, city); //{"level":3,"city":"Aevum","size":330,"sizeUsed":3.849301959694781,"smartSupplyEnabled":true}

            if (warehouse.size < 4_200){
                ns.corporation.upgradeWarehouse(gidgetsFarm, city);
            }
        }   
    }
}