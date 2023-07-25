export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const capitalReserve = 40_000_000_000;


    for (const divisionName of corporation.divisions.filter(x => x !== "Gidget's Import/Export")) {
        const division = ns.corporation.getDivision(divisionName);

        const industryData = ns.corporation.getIndustryData(division.type); 

        for (let city of division.cities) {
            if (!ns.corporation.hasWarehouse(divisionName, city)) {
                ns.corporation.purchaseWarehouse(divisionName, city);
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

            if (warehouse.size < 300 && percentUsedOfWarehouse > 0.5){
                ns.corporation.upgradeWarehouse(divisionName, city);
            }

            if (warehouse.size < 2000 && percentUsedOfWarehouse > 0.5 && moneyLeft > capitalReserve && profit > 100) { 
                ns.corporation.upgradeWarehouse(divisionName, city);
            }

            if (warehouse.size < 5000 && percentUsedOfWarehouse > 0.5 && moneyLeft > capitalReserve && profit > 1_000_000) { 
                ns.corporation.upgradeWarehouse(divisionName, city);
            }
        }
    }
}