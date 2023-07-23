export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    const capitalReserve = 400_000_000_000;
    const liquidFunds = corporation.funds;
    const investableAmount = liquidFunds - capitalReserve;

    initialUpgrades(corporation, ns);

    if (investableAmount < 0 || corporation.divisions.length === 0) {
        return;
    }

    const upgradeGoals = [
        { name: "FocusWires", goalLvl: 20, topPriority: true },
        { name: "Neural Accelerators", goalLvl: 20, topPriority: true },
        { name: "Speech Processor Implants", goalLvl: 20, topPriority: true },
        { name: "Nuoptimal Nootropic Injector Implants", goalLvl: 20, topPriority: true },
        { name: "Wilson Analytics", goalLvl: 20, topPriority: false }, // if this was top it would take forever to get to the less important ones.
        { name: "DreamSense", goalLvl: 14, topPriority: false },
        { name: "ABC SalesBots", goalLvl: 20, topPriority: false },
        { name: "Project Insight", goalLvl: 14, topPriority: false },
        { name: "Smart Storage", goalLvl: 20, topPriority: false },
        { name: "Smart Factories", goalLvl: 20, topPriority: false },
    ]

    let cheapestUpgrade;

    if(investableAmount > 5_000_000_000_000_000){
        if (!ns.corporation.hasUnlock("Shady Accounting")) {
            ns.corporation.purchaseUnlock("Shady Accounting");
        }

        if (!ns.corporation.hasUnlock("Government Partnership")) {
            ns.corporation.purchaseUnlock("Government Partnership");
        }
    }

    for (const upgrade of upgradeGoals) {
        if (cheapestUpgrade && cheapestUpgrade.topPriority && upgrade.topPriority === false) {
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

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);

        if (division.numAdVerts === 0) {
            ns.corporation.hireAdVert(divisionName);
        }

        if (division.makesProducts) {
            const adGoal = { awareness: 3_600_000, popularity: 2_700_000 };
            if (division.awareness < adGoal.awareness || division.popularity < adGoal.popularity) {
                const cost = ns.corporation.getHireAdVertCost(divisionName);

                if (!cheapestUpgrade || cheapestUpgrade.cost > cost) {
                    cheapestUpgrade = { adVertType: true, division: divisionName, cost };
                }
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
            if (level < 10) {
                ns.corporation.levelUpgrade(upgrade);
            }
        }
    }
}