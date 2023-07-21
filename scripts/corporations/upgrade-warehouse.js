export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const excludedDivisions = [
        "Gidget's Import/Export"
    ]

    const corporation = ns.corporation.getCorporation();
    const divisionsToOperateOn = corporation.divisions.filter(divisionName => !excludedDivisions.includes(divisionName));

    for (const divisionName of divisionsToOperateOn) {
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

            if (warehouse.size < 4000 && percentUsedOfWarehouse > 0.5 && moneyLeft > 100_000_000_000 && profit > 500_000) {
                ns.corporation.upgradeWarehouse(divisionName, city);
            }
        }
    }
}