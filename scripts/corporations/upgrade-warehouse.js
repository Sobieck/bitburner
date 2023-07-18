export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const gidgetsFarm = "Gidget's Farm";
    const division = ns.corporation.getDivision(gidgetsFarm);
    const corporation = ns.corporation.getCorporation();
    const profit = corporation.revenue - corporation.expenses;


    if (corporation.funds > 40_000_000_000 && profit > 1_000_000) {
        for (const city of division.cities) {
            const warehouse = ns.corporation.getWarehouse(gidgetsFarm, city); //{"level":3,"city":"Aevum","size":330,"sizeUsed":3.849301959694781,"smartSupplyEnabled":true}

            if (warehouse.size < 3_800){
                ns.corporation.upgradeWarehouse(gidgetsFarm, city);
            }
        }   
    }
}