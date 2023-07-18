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
}