export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    const gidgetsFarm = "Gidget's Farm";

    if (corporation.divisions.length === 0) {
        ns.corporation.expandIndustry("Agriculture", gidgetsFarm);
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

    for (let city of division.cities) {
        ns.corporation.sellMaterial(gidgetsFarm, city, "Plants", "MAX", "MP");
        ns.corporation.sellMaterial(gidgetsFarm, city, "Food", "MAX", "MP");
    }

    if (division.numAdVerts === 0) {
        ns.corporation.hireAdVert(gidgetsFarm);
    }
}