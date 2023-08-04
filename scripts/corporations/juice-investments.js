export async function main(ns) {
    const juiceFile = 'data/juice.txt';

    if (!ns.corporation.hasCorporation() || !ns.fileExists(juiceFile)) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const productToUseToJuice = "Real Estate";

    let buyPhase = false;
    if (ns.read(juiceFile) === 'buy') {
        buyPhase = true;
    }

    const warehouseUtilizations = [];

    const materialData = ns.corporation.getMaterialData(productToUseToJuice);
    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);
        
        if (division.numAdVerts < 14) {
            ns.corporation.hireAdVert(divisionName);
        }

        const upgrade = "ABC SalesBots";
        if(ns.corporation.getUpgradeLevel(upgrade) < 5){
            ns.corporation.levelUpgrade(upgrade);
        }        

        for (let [key, city] of Object.entries(ns.enums.CityName)) {
            if (!division.cities.includes(city)) {
                ns.corporation.expandCity(divisionName, city);
            }
        }

        for (const city of division.cities) {
            const warehouse = ns.corporation.getWarehouse(divisionName, city);
            const percentUsedOfWarehouse = warehouse.sizeUsed / warehouse.size;

            warehouseUtilizations.push(percentUsedOfWarehouse);

            if (buyPhase) {
                if (percentUsedOfWarehouse < 0.45) {
                    const countToBuy = Math.floor((warehouse.size * 0.5) / materialData.size);
                    ns.corporation.bulkPurchase(divisionName, city, productToUseToJuice, countToBuy);
                }
            }

            if(!buyPhase) {
                const material = ns.corporation.getMaterial(divisionName, city, productToUseToJuice);

                ns.corporation.sellMaterial(divisionName, city, productToUseToJuice, "MAX", material.marketPrice * .9);
            }

            const office = ns.corporation.getOffice(divisionName, city);

            const businessNeeded = 6;
            const sizeNeeded = businessNeeded - office.size;

            if (sizeNeeded > 0){
                ns.corporation.upgradeOfficeSize(divisionName, city, sizeNeeded);
            }

            if (office.size === office.numEmployees) {
                continue;
            }

            ns.corporation.hireEmployee(divisionName, city, "Business");
        }

        const averageWarehouseUtilization = warehouseUtilizations.reduce((acc, x) => acc + x, 0) / warehouseUtilizations.length;
        
        if(averageWarehouseUtilization > 0.45 && buyPhase){
            ns.rm(juiceFile);
            ns.write(juiceFile, "sell", "W");
        }
    }
}