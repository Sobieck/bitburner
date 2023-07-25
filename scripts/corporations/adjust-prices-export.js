export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    if (corporation.state !== "START") {
        return;
    }

    if(corporation.divisions.length > 1){
        if (!ns.corporation.hasUnlock("Export")) {
            ns.corporation.purchaseUnlock("Export");
        }
    }

    const gidgetsFarm = "Gidget's Farm";
    const gidgetsSmokes = "Gidget's Smokes";
    const chemist = "Chemist Gidget's Lab";
    const water = "Gidget's Municipal Water";
    const hardware = "Gidget's Computers & Hardware";
    const metal = "Gidget's Metallurgy";
    const mining = "Gidget's Land Destroyer";

    const divisionalTies = [
        {
            name: gidgetsFarm, materialsSold: ["Food", "Plants"], exports: [
                { importer: gidgetsSmokes, material: "Plants" },
                { importer: chemist, material: "Plants" }
            ]
        },
        {
            name: chemist, materialsSold: ["Chemicals"], exports: [
                { importer: gidgetsFarm, material: "Chemicals" }
            ]
        },
        {
            name: water, materialsSold: ["Water"], exports: [
                { importer: gidgetsFarm, material: "Water" },
                { importer: chemist, material: "Water" },
            ]
        },
        {
            name: hardware, materialsSold: ["Hardware"], exports: [
                { importer: water, material: "Hardware" },
                { importer: mining, material: "Hardware" },
            ]
        },
        {
            name: metal, materialsSold: ["Metal"], exports: [
                { importer: hardware, material: "Metal" },
            ]
        },
        {
            name: mining, materialsSold: ["Ore", "Minerals"], exports: [
                    { importer: metal, material: "Ore" },
                ]
        },
    ]

    const rawMaterialProducers = [];
    const importExportRelationships = [];

    for (const division of divisionalTies) {
        if (corporation.divisions.includes(division.name)) {
            rawMaterialProducers.push({ producer: division.name, materials: division.materialsSold });
            for (const EXPORT of division.exports) {
                if(corporation.divisions.includes(EXPORT.importer)){
                    importExportRelationships.push({ exporter: division.name, importer: EXPORT.importer, material: EXPORT.material });
                }                
            }
        }
    }

    for (const divisionName of corporation.divisions.filter(x => x.name !== "Gidget's Import/Export")) {
        const division = ns.corporation.getDivision(divisionName);

        const divisionHasExportRelationship = importExportRelationships.find(x => x.exporter === divisionName);

        const exportRelationships = importExportRelationships.filter(x => x.exporter === divisionName);

        for (const exportRelationship of exportRelationships) {
            for (const city of division.cities) {
                ns.corporation.cancelExportMaterial(exportRelationship.exporter, city, exportRelationship.importer, city, exportRelationship.material);
                ns.corporation.exportMaterial(exportRelationship.exporter, city, exportRelationship.importer, city, exportRelationship.material, "-(IPROD)");
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
                    } else if (ns.corporation.hasResearched(divisionName, "Market-TA.II")) {
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
                            let priceToSet = adjustPriceDown(material.desiredSellPrice, marketPrice);

                            if  (material.stored > material.productionAmount * 2){
                                priceToSet = adjustPriceDown(priceToSet, marketPrice, true);
                            }

                            const materialData = ns.corporation.getMaterialData(material.name);

                            const costOfGoodsSold = material.marketPrice / materialData.baseMarkup;

                            if (priceToSet < costOfGoodsSold){
                                priceToSet = costOfGoodsSold * 0.1;
                            }

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

function adjustPriceDown(oldPrice, marketPrice, fastDrop) {

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

    if (fastDrop){
        newPrice = oldPrice * 0.9;
    }

    if (oldPrice < 0) {
        newPrice = 10;
    }

    if (newPrice <= 0) {
        return oldPrice;
    }

    return newPrice;
}
