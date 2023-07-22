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

    if(investableAmount < 0){
        return;
    }

    const upgradeGoals = [
        { name: "FocusWires", goalLvl: 20 },
        { name: "Neural Accelerators", goalLvl: 20 },
        { name: "Speech Processor Implants", goalLvl: 20 },
        { name: "Nuoptimal Nootropic Injector Implants", goalLvl: 20 },
        { name: "Wilson Analytics", goalLvl: 14 },
        { name: "DreamSense", goalLvl: 14 },
        { name: "ABC SalesBots", goalLvl: 14 },
        { name: "Project Insight", goalLvl: 14 },
    ]

    let cheapestUpgrade;

    for (const upgrade of upgradeGoals) {
        upgrade.cost = ns.corporation.getUpgradeLevelCost(upgrade.name);
        upgrade.currentLvl = ns.corporation.getUpgradeLevel(upgrade.name);
        upgrade.atGoal = upgrade.currentLvl >= upgrade.goalLvl;
        upgrade.upgradeType = true;

        if(!cheapestUpgrade || cheapestUpgrade.cost > upgrade.cost){
            if(!upgrade.atGoal){
                cheapestUpgrade = upgrade;
            }
        }
    }

    const adVertsGoals = [
        { division: "Gidget's Smokes", awareness: 36_000, popularity: 27_000 }
    ]

    for (const divisionName of divisionsToOperateOn) {
        const adGoal = adVertsGoals.find(x => x.division === divisionName);

        if(adGoal){
            const division = ns.corporation.getDivision(divisionName);

            if(division.awareness < adGoal.awareness || division.popularity < adGoal.popularity){
                const cost = ns.corporation.getHireAdVertCost(divisionName);

                if(!cheapestUpgrade || cheapestUpgrade.cost > cost){
                    cheapestUpgrade = { adVertType: true, division: divisionName, cost };
                }
            }
        }
    }

    if(!cheapestUpgrade){
        return;
    }

    if(investableAmount > cheapestUpgrade.cost){
        if(cheapestUpgrade.adVertType) {
            if(ns.corporation.getHireAdVertCost(cheapestUpgrade.division) === cheapestUpgrade.cost){
                ns.corporation.hireAdVert(cheapestUpgrade.division);
            }
        }

        if(cheapestUpgrade.upgradeType) {
            if(ns.corporation.getUpgradeLevelCost(cheapestUpgrade.name) === cheapestUpgrade.cost){
                ns.corporation.levelUpgrade(cheapestUpgrade.name);
            }
        }
    }
}