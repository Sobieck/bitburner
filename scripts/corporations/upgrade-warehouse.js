export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);
        


        const industryData = ns.corporation.getIndustryData(division.type); // {"startingCost":20000000000,"description":"Create and distribute tobacco and tobacco-related products.","product":{"name":"Product","verb":"Create","desc":"Create a new tobacco product!","ratingWeights":{"quality":0.7,"durability":0.1,"aesthetics":0.2}},"recommendStarting":true,"realEstateFactor":0.15,"scienceFactor":0.75,"hardwareFactor":0.15,"robotFactor":0.2,"aiCoreFactor":0.15,"advertisingFactor":0.2,"requiredMaterials":{"Plants":1}}
        // ns.tprint(industryData);

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

            if (warehouse.size < 4000 && percentUsedOfWarehouse > 0.5 && moneyLeft > 100_000_000_000 && profit > 500_000) {
                ns.corporation.upgradeWarehouse(divisionName, city);
            }
        }
    }
}