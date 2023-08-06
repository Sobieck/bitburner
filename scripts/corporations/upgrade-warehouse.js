export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    if (corporation.public && corporation.divisions.length === 1) {
        return;
    }

    const capitalReserve = 40_000_000_000;


    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);

        if (division.makesProducts && division.products.length < 2) {
            if (division.products.length === 0) {
                return;
            }

            const product = ns.corporation.getProduct(divisionName, "Aevum", division.products[0]);

            if (product.developmentProgress !== 100) {
                return;
            }
        }

        const industryData = ns.corporation.getIndustryData(division.type);

        for (let city of division.cities) {
            if (!ns.corporation.hasWarehouse(divisionName, city)) {
                ns.corporation.purchaseWarehouse(divisionName, city);
            }

            if (!ns.corporation.hasWarehouse(divisionName, city)) {
                continue;
            }

            if(!ns.corporation.hasUnlock("Smart Supply")){
                continue;
            }

            const warehouse = ns.corporation.getWarehouse(division.name, city);

            ns.corporation.setSmartSupply(divisionName, city, true);

            for (let [material, value] of Object.entries(industryData.requiredMaterials)) {
                ns.corporation.setSmartSupplyOption(divisionName, city, material, "leftovers");
            }

            const percentUsedOfWarehouse = warehouse.sizeUsed / warehouse.size;
            const warehouseUpgradeCost = ns.corporation.getUpgradeWarehouseCost(divisionName, city);

            const moneyLeft = corporation.funds - warehouseUpgradeCost;
            const profit = corporation.revenue - corporation.expenses;

            if (warehouse.size < 400 && percentUsedOfWarehouse > 0.5) {
                ns.corporation.upgradeWarehouse(divisionName, city);
            }

            if (warehouse.size < 1500 && divisionName === "Gidget's Municipal Water") {
                ns.corporation.upgradeWarehouse(divisionName, city);
            }

            if (warehouse.size < 2000 && percentUsedOfWarehouse > 0.7 && moneyLeft > capitalReserve && !ns.fileExists('data/juice.txt')) {
                ns.corporation.upgradeWarehouse(divisionName, city);
            }

            if (warehouse.size < 5000 && moneyLeft > capitalReserve && ((percentUsedOfWarehouse > 0.7 && profit > 1_000_000) || profit > 100_000_000_000)) {
                ns.corporation.upgradeWarehouse(divisionName, city);
            }

            if (warehouse.size < 40000 && moneyLeft > capitalReserve && (percentUsedOfWarehouse > 0.7 && profit > 10_000_000_000)) {
                ns.corporation.upgradeWarehouse(divisionName, city);
            }
        }
    }
}