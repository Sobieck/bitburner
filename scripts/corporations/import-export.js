export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }


    const corporation = ns.corporation.getCorporation();
    const corporateProfits = corporation.revenue - corporation.expenses;

    const divisionName = "Gidget's Import/Export";
    const unlocksNeeded = [
        "Export",
        "Market Research - Demand",
    ]

    const materialNames = [
        "Water",
        "Ore",
        "Minerals",
        "Food",
        "Plants",
        "Metal",
        "Hardware",
        "Chemicals",
        "Drugs",
        "Robots",
        "AI Cores",
        "Real Estate"
    ]

    if (corporation.funds > 400_000_000_000 && !corporation.divisions.includes(divisionName)) {
        ns.corporation.expandIndustry("Agriculture", divisionName);

        for (const unlockName of unlocksNeeded) {
            if (!ns.corporation.hasUnlock(unlockName)) {
                ns.corporation.purchaseUnlock(unlockName);
            }
        }
    }

    if (corporation.divisions.includes(divisionName)) {
        const division = ns.corporation.getDivision(divisionName);

        for (let [key, city] of Object.entries(ns.enums.CityName)) {
            if (!division.cities.includes(city)) {
                ns.corporation.expandCity(divisionName, city);
            }
        }

        for (let city of division.cities) {
            if (!ns.corporation.hasWarehouse(divisionName, city)) {
                ns.corporation.purchaseWarehouse(divisionName, city);
            }

            const warehouse = ns.corporation.getWarehouse(divisionName, city);

            if (warehouse.smartSupplyEnabled) {
                ns.corporation.setSmartSupply(divisionName, city, false);
            }

        }

        let allMaterials = [];

        for (const materialName of materialNames) {
            let materials = []

            let lowestPrice;
            let highestPrice;

            for (let city of division.cities) {
                let materialFromCity = ns.corporation.getMaterial(divisionName, city, materialName);
                materialFromCity.city = city;
                materials.push(materialFromCity);

                if (!lowestPrice || lowestPrice > materialFromCity.marketPrice) {
                    lowestPrice = materialFromCity.marketPrice;
                }

                if (!highestPrice || highestPrice < materialFromCity.marketPrice) {
                    highestPrice = materialFromCity.marketPrice;
                }
            }

            for (const materialFromCity of materials) {
                materialFromCity.delta = materialFromCity.marketPrice - lowestPrice;
            }

            const delta = highestPrice - lowestPrice;
            materials = materials.sort((a, b) => b.marketPrice - a.marketPrice);

            allMaterials.push({ materials, delta });
        }

        allMaterials = allMaterials.sort((a, b) => b.delta - a.delta);

        const filename = "junk.txt";
        ns.rm(filename);
        ns.write(filename, JSON.stringify(allMaterials), "W");

        const materialsToImportExport = allMaterials.filter(x => x.delta > 500);

        // if all stored === 0, then do another round
        for (const materialToImportExport of materialsToImportExport) {
            const exportOrders = []
            // ns.tprint(materialToImportExport);
            const inventoryCount = materialToImportExport.materials.reduce((acc, b) => acc + b.stored, 0);

            if (inventoryCount > 0) {
                continue;
            }

            for (const materialFromCity of materialToImportExport.materials) {
                const materialName = materialFromCity.name;

                for (const exportMaterial of materialFromCity.exports) {
                    ns.corporation.cancelExportMaterial(divisionName, materialFromCity.city, divisionName, exportMaterial.city, materialName);
                }

                if (materialFromCity.delta > 0) {
                    ns.corporation.sellMaterial(divisionName, materialFromCity.city, materialName, "MAX", "MP");

                    if (materialFromCity.delta > 500) {
                        exportOrders.push({ city: materialFromCity.city, demand: materialFromCity.demand });
                    }
                } else {
                    ns.corporation.sellMaterial(divisionName, materialFromCity.city, materialName, 0, 0);

                    let purchaseAmount = 0;
                    for (const exportOrder of exportOrders) {
                        ns.corporation.exportMaterial(divisionName, materialFromCity.city, divisionName, exportOrder.city, materialName, exportOrder.demand);
                        purchaseAmount += exportOrder.demand;
                    }

                    const materialData = ns.corporation.getMaterialData(materialName); // {"name":"Real Estate","size":0.005,"demandBase":50,"demandRange":[5,99],"competitionBase":50,"competitionRange":[25,75],"baseCost":80000,"maxVolatility":1.5,"baseMarkup":1.5}

                    const spaceNeeded = purchaseAmount * materialData.size;

                    const warehouse = ns.corporation.getWarehouse(divisionName, materialFromCity.city);
                    const freeSpace = warehouse.size - warehouse.sizeUsed;

                    if (freeSpace > spaceNeeded) {
                        ns.corporation.bulkPurchase(divisionName, materialFromCity.city, materialName, purchaseAmount);
                    } else {
                        ns.corporation.upgradeWarehouse(divisionName, materialFromCity.city);
                    }
                }
            }
        }
    }
}