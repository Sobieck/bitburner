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

        for (const city of division.cities) {
            const warehouse = ns.corporation.getWarehouse(divisionName, city);
            const percentUsedOfWarehouse = warehouse.sizeUsed / warehouse.size;

            warehouseUtilizations.push(percentUsedOfWarehouse);

            if (buyPhase) {
                if (percentUsedOfWarehouse < .9) {
                    const countToBuy = Math.floor(warehouse.size / materialData.size);
                    ns.corporation.bulkPurchase(divisionName, city, productToUseToJuice, countToBuy);
                }
            }

            if(!buyPhase) {
                const material = ns.corporation.getMaterial(divisionName, city, productToUseToJuice);

                ns.corporation.sellMaterial(divisionName, city, productToUseToJuice, "MAX", material.marketPrice * .5);
            }
        }

        const averageWarehouseUtilization = warehouseUtilizations.reduce((acc, x) => acc + x, 0) / warehouseUtilizations.length;
        
        if(averageWarehouseUtilization > .9 && buyPhase){
            ns.rm(juiceFile);
            ns.write(juiceFile, "sell", "W");
        }
    }
}