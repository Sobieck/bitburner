export async function main(ns) {
    if (!ns.corporation.hasCorporation() || ns.fileExists('data/juice.txt')) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    if (corporation.public && corporation.divisions.length === 1){
        return;
    }

    const capitalReserve = 40_000_000_000;
    const liquidFunds = corporation.funds;
    const investableAmount = liquidFunds - capitalReserve;

    initialUpgrades(corporation, ns);

    if (investableAmount < 0 || corporation.divisions.length === 0) {
        return;
    }

    const upgradeGoals = [
        { name: "FocusWires", goalLvl: 20, priority: 1 },
        { name: "Neural Accelerators", goalLvl: 20, priority: 1 },
        { name: "Speech Processor Implants", goalLvl: 20, priority: 1 },
        { name: "Nuoptimal Nootropic Injector Implants", goalLvl: 20, priority: 1 },
        { name: "Wilson Analytics", goalLvl: 14, priority: 2 }, // if this was top it would take forever to get to the less important ones.
        { name: "DreamSense", goalLvl: 14, priority: 2 },
        { name: "ABC SalesBots", goalLvl: 20, priority: 2 },
        { name: "Project Insight", goalLvl: 14, priority: 2 },
        { name: "Wilson Analytics", goalLvl: 20000, priority: 3 }, 
        { name: "Smart Storage", goalLvl: 40, priority: 3 },
        { name: "Smart Factories", goalLvl: 40, priority: 3 },
        { name: "Project Insight", goalLvl: 40, priority: 3 },
        { name: "ABC SalesBots", goalLvl: 40, priority: 3 },
        { name: "FocusWires", goalLvl: 40, priority: 3 },
        { name: "Neural Accelerators", goalLvl: 40, priority: 3 },
        { name: "Speech Processor Implants", goalLvl: 40, priority: 3 },
        { name: "Nuoptimal Nootropic Injector Implants", goalLvl: 40, priority: 3 },
        { name: "DreamSense", goalLvl: 40, priority: 3 },
    ]

    let cheapestUpgrade;

    if (investableAmount > 5_000_000_000_000_000) {
        if (!ns.corporation.hasUnlock("Shady Accounting")) {
            ns.corporation.purchaseUnlock("Shady Accounting");
        }

        if (!ns.corporation.hasUnlock("Government Partnership")) {
            ns.corporation.purchaseUnlock("Government Partnership");
        }
    }

    for (const upgrade of upgradeGoals) {
        if (cheapestUpgrade && cheapestUpgrade.priority < upgrade.priority  ) {
            continue;
        }

        upgrade.cost = ns.corporation.getUpgradeLevelCost(upgrade.name);
        upgrade.currentLvl = ns.corporation.getUpgradeLevel(upgrade.name);
        upgrade.atGoal = upgrade.currentLvl >= upgrade.goalLvl;
        upgrade.upgradeType = true;

        if (!cheapestUpgrade || cheapestUpgrade.cost > upgrade.cost) {
            if (!upgrade.atGoal) {
                cheapestUpgrade = upgrade;
            }
        }
    }

    for (const divisionName of corporation.divisions){
        const division = ns.corporation.getDivision(divisionName);

        if (division.numAdVerts === 0) {
            ns.corporation.hireAdVert(divisionName);
        }

        if (division.makesProducts) {
            const cost = ns.corporation.getHireAdVertCost(divisionName);

            if (!cheapestUpgrade || cheapestUpgrade.cost > cost) {
                cheapestUpgrade = { adVertType: true, division: divisionName, cost };
            }
        }
    }

    if (!cheapestUpgrade) {
        return;
    }

    if (investableAmount > cheapestUpgrade.cost) {
        if (cheapestUpgrade.adVertType) {
            if (ns.corporation.getHireAdVertCost(cheapestUpgrade.division) === cheapestUpgrade.cost) {
                ns.corporation.hireAdVert(cheapestUpgrade.division);
            }
        }

        if (cheapestUpgrade.upgradeType) {
            if (ns.corporation.getUpgradeLevelCost(cheapestUpgrade.name) === cheapestUpgrade.cost) {
                ns.corporation.levelUpgrade(cheapestUpgrade.name);
            }
        }
    }
}

function initialUpgrades(corporation, ns) {
    const initialUpgrades = [
        "DreamSense",
        "FocusWires",
        "Neural Accelerators",
        "Speech Processor Implants",
        "Nuoptimal Nootropic Injector Implants",
        "Smart Factories",
    ];

    const smartSupplyName = "Smart Supply";
    if (!ns.corporation.hasUnlock(smartSupplyName)) {
        ns.corporation.purchaseUnlock(smartSupplyName);
    }

    const wilsonAnalyticsLevel = ns.corporation.getUpgradeLevel("Wilson Analytics")

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);

        if (division.numAdVerts === 0) {
            ns.corporation.hireAdVert(divisionName);
        }

        if(division.numAdVerts < wilsonAnalyticsLevel){
            ns.corporation.hireAdVert(divisionName);
        }
    }

    const profit = corporation.revenue - corporation.expenses;

    if(profit > 100_000){
        for (const upgrade of initialUpgrades) {
            const upgradeLevel = ns.corporation.getUpgradeLevel(upgrade);
            const upgradeCost = ns.corporation.getUpgradeLevelCost(upgrade);
    
            const reserve = 10_000_000_000;
            const fundsLessReserve = ns.corporation.getCorporation().funds - reserve;
    
            if (upgradeLevel < 2 && upgradeCost < fundsLessReserve) {
                ns.corporation.levelUpgrade(upgrade);
            }
        }
    }

    const thingsToUpgrade = [
        "Smart Factories",
        "Smart Storage",
    ]

    if (corporation.funds > 200_000_000_000 && profit > 1_000_000) {
        for (const upgrade of thingsToUpgrade) {
            const level = ns.corporation.getUpgradeLevel(upgrade);
            if (level < 10) {
                ns.corporation.levelUpgrade(upgrade);
            }
        }

        if (wilsonAnalyticsLevel < 5){
            ns.corporation.levelUpgrade("Wilson Analytics");
        }
    }
}