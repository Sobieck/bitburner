export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const gidgetsFarm = "Gidget's Farm"
    const gidgetsSmokes = "Gidget's Smokes"
    const chemist = "Chemist Gidget's Lab"

    const corporation = ns.corporation.getCorporation();

    if (corporation.state !== "START") {
        return;
    }

    const gidgetsFarmExists = corporation.divisions.includes(gidgetsFarm);
    const gidgetsSmokesExists = corporation.divisions.includes(gidgetsSmokes);
    const chemistExists = corporation.divisions.includes(chemist);

    const rawMaterialProducers = [];
    const importExportRelationships = [];

    if (gidgetsFarmExists) {

        rawMaterialProducers.push({ producer: gidgetsFarm, materials: ["Food", "Plants"] });

        if (gidgetsSmokesExists) {
            importExportRelationships.push({ exporter: gidgetsFarm, importer: gidgetsSmokes, material: "Plants" })
        }
    }

    if (chemistExists) {
        rawMaterialProducers.push({ producer: chemist, materials: [ "Chemicals" ] });

        if(gidgetsFarmExists){
            importExportRelationships.push({ exporter: gidgetsFarm, importer: chemist, material: "Plants" });
            importExportRelationships.push({ exporter: chemist, importer: gidgetsFarm, material: "Chemicals" });
        }
    }

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);

        const divisionHasExportRelationship = importExportRelationships.find(x => x.exporter === divisionName);

        const exportRelationships = importExportRelationships.filter(x => x.exporter === divisionName);

        for (const exportRelationship of exportRelationships) {
            for (const city of division.cities) {
                ns.corporation.cancelExportMaterial(exportRelationship.exporter, city, exportRelationship.importer, city, exportRelationship.material);
                ns.corporation.exportMaterial(exportRelationship.exporter, city, exportRelationship.importer, city, exportRelationship.material, "-(IPROD)"); 
            }
        }
        
        if (divisionHasExportRelationship) {
            for (const city of division.cities) {

            }
        }

        for (const productName of division.products) {
            if (ns.corporation.hasResearched(divisionName, "Market-TA.II")) {
                ns.corporation.setProductMarketTA2(divisionName, productName, true);
                continue;
            }

            for (const city of division.cities) {
                const product = ns.corporation.getProduct(divisionName, city, productName);

                if (product.developmentProgress !== 100) {
                    continue;
                }

                if (product.desiredSellPrice === 0) {
                    let mostExpensivePrice = 0;

                    for (const productNameForPrice of division.products) {
                        const product = ns.corporation.getProduct(divisionName, city, productNameForPrice);
                        if (product.desiredSellPrice === 0) {
                            continue;
                        }

                        let price = product.desiredSellPrice;

                        if (isNaN(price)) {
                            price = Number(price.split(')')[1]);
                        }

                        if (price > mostExpensivePrice) {
                            mostExpensivePrice = price;
                        }
                    }

                    if (mostExpensivePrice === 0) {
                        mostExpensivePrice = product.productionCost * 2;
                    }

                    ns.corporation.sellProduct(divisionName, city, productName, "MAX", `${mostExpensivePrice}`, false)
                } else {
                    if (product.stored === 0) {
                        const priceToSet = adjustPriceUp(product.desiredSellPrice, product.productionCost);

                        ns.corporation.sellProduct(divisionName, city, productName, "MAX", priceToSet, false)
                    }

                    if (product.stored > 20) {
                        const priceToSet = adjustPriceDown(product.desiredSellPrice, product.productionCost);

                        ns.corporation.sellProduct(divisionName, city, productName, "MAX", priceToSet, false);
                    }
                }
            }
        }

        const rawMaterialProducer = rawMaterialProducers.find(x => x.producer === divisionName);
        //not working
        if (rawMaterialProducer) {
            for (const city of division.cities) {
                for (const materialName of rawMaterialProducer.materials) {

                    const material = ns.corporation.getMaterial(divisionName, city, materialName);

                    const warehouse = ns.corporation.getWarehouse(divisionName, city);

                    const percentUsed = warehouse.sizeUsed / warehouse.size;

                    if (ns.corporation.hasResearched(divisionName, "Market-TA.II") && material.stored === 0) {
                        ns.corporation.setMaterialMarketTA2(divisionName, city, materialName, true);
                        continue;
                    } else if (ns.corporation.hasResearched(divisionName, "Market-TA.II") && percentUsed < 0.8) {
                        ns.corporation.setMaterialMarketTA2(divisionName, city, materialName, true);
                        continue;
                    } else if (ns.corporation.hasResearched(divisionName, "Market-TA.II")){
                        ns.corporation.setMaterialMarketTA2(divisionName, city, materialName, false);
                    }

                    const marketPrice = material.marketPrice;
    
                    if (material.desiredSellPrice === 0 || material.desiredSellPrice === "MP" || material.desiredSellPrice === "MP+5") {
                        ns.corporation.sellMaterial(divisionName, city, material.name, "MAX", marketPrice);
                    } else {
                          if (material.stored === 0) {
                            const priceToSet = adjustPriceUp(material.desiredSellPrice, marketPrice);
                            ns.corporation.sellMaterial(divisionName, city, material.name, "MAX", priceToSet);
                        }

                        if (material.stored > 20) {
                            const priceToSet = adjustPriceDown(material.desiredSellPrice, marketPrice);

                            ns.corporation.sellMaterial(divisionName, city, material.name, "MAX", priceToSet);
                        }
                    }
                }
            }
        }
    }
}

function adjustPriceUp(oldPrice, marketPrice) {

    if (isNaN(oldPrice)) {
        const adjuster = Number(oldPrice.split(')')[1]);
        oldPrice = adjuster + marketPrice;
    }

    let newPrice = 0;
    if (oldPrice >= 0) {
        if (oldPrice > 100) {
            newPrice = oldPrice * 1.05;
        } else {
            newPrice = oldPrice + 10;
        }
    }

    if (oldPrice < 0) {
        newPrice = 10;
    }

    if (newPrice <= 0) {
        return oldPrice;
    }

    return newPrice;
}

function adjustPriceDown(oldPrice, marketPrice) {

    if (isNaN(oldPrice)) {
        const adjuster = Number(oldPrice.split(')')[1]);
        oldPrice = adjuster + marketPrice;
    }

    let newPrice = 0;
    if (oldPrice >= 0) {
        if (oldPrice > 100) {
            newPrice = oldPrice * 0.97;
        } else {
            newPrice = oldPrice - 5;
        }
    }

    if (oldPrice < 0) {
        newPrice = 10;
    }

    if (newPrice <= 0) {
        return oldPrice;
    }

    return newPrice;
}
