export async function main(ns) {
    if (!ns.corporation.hasCorporation() || ns.fileExists('data/juice.txt')) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    if (corporation.public && corporation.divisions.length === 1){
        return;
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

    if (corporation.state !== "PRODUCTION") {
        for (const divisionName of corporation.divisions) {
            const division = ns.corporation.getDivision(divisionName);

            if (division.makesProducts) {
                continue;
            }

            const divisionalTie = divisionalTies.find(x => x.name === divisionName);

            if (divisionalTie.materialsSold.length < 2) {
                continue;
            }

            const citiesToShip = [];
            let problemProduct;

            for (const city of division.cities) {
                if (ns.corporation.hasWarehouse(divisionName, city)) {
                    for (const materialWeCareAbout of divisionalTie.materialsSold) {
                        const material = ns.corporation.getMaterial(divisionName, city, materialWeCareAbout);

                        for (const EXPORT of material.exports) {
                            if (EXPORT.division === divisionName) {
                                ns.corporation.cancelExportMaterial(divisionName, city, divisionName, EXPORT.city, material.name);
                            }
                        }

                        if (material.stored > material.actualSellAmount * 3) {
                            const warehouse = ns.corporation.getWarehouse(divisionName, city);
                            const freeSpace = warehouse.size - warehouse.sizeUsed;

                            if (freeSpace < 500) {
                                if (!problemProduct || problemProduct.freeSpace > freeSpace) {
                                    problemProduct = { material: material.name, city, freeSpace, amountToShip: material.stored / 20 };
                                }
                            }

                            if (freeSpace > 1_000) {
                                if (!citiesToShip.includes(city)) {
                                    citiesToShip.push(city);
                                }
                            }
                        }
                    }
                }
            }

            if (problemProduct) {
                for (const city of citiesToShip) {
                    ns.corporation.exportMaterial(divisionName, problemProduct.city, divisionName, city, problemProduct.material, problemProduct.amountToShip);
                }
            }
        }
    }


    if (corporation.state !== "START") {
        return;
    }

    if (corporation.divisions.length > 1) {
        if (!ns.corporation.hasUnlock("Export")) {
            ns.corporation.purchaseUnlock("Export");
        }
    }



    const rawMaterialProducers = [];
    const importExportRelationships = [];

    for (const division of divisionalTies) {
        if (corporation.divisions.includes(division.name)) {
            rawMaterialProducers.push({ producer: division.name, materials: division.materialsSold });
            for (const EXPORT of division.exports) {
                if (corporation.divisions.includes(EXPORT.importer)) {
                    importExportRelationships.push({ exporter: division.name, importer: EXPORT.importer, material: EXPORT.material });
                }
            }
        }
    }

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);
        const exportRelationships = importExportRelationships.filter(x => x.exporter === divisionName);

        for (const exportRelationship of exportRelationships) {
            for (const city of division.cities) {
                if (ns.corporation.hasWarehouse(exportRelationship.exporter, city) && ns.corporation.hasWarehouse(exportRelationship.importer, city)) {
                    ns.corporation.cancelExportMaterial(exportRelationship.exporter, city, exportRelationship.importer, city, exportRelationship.material);
                    ns.corporation.exportMaterial(exportRelationship.exporter, city, exportRelationship.importer, city, exportRelationship.material, "-(IPROD)");
                }
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

                    if (product.stored > 30) {
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

                    if(!ns.corporation.hasWarehouse(divisionName, city)){
                        continue;
                    }

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

                        const materialData = ns.corporation.getMaterialData(material.name);
                        const costOfGoodsSold = material.marketPrice / materialData.baseMarkup;

                        if (material.stored === 0) {
                            let priceToSet = adjustPriceUp(material.desiredSellPrice, marketPrice);

                            if (priceToSet < costOfGoodsSold) {
                                priceToSet = costOfGoodsSold * 1.04;
                            }

                            ns.corporation.sellMaterial(divisionName, city, material.name, "MAX", priceToSet);
                        }

                        if (material.stored > 30) {
                            let priceToSet = adjustPriceDown(material.desiredSellPrice, marketPrice);

                            if (material.stored > material.productionAmount * 3) {
                                priceToSet = adjustPriceDown(priceToSet, marketPrice, true);
                            }

                            if (priceToSet < costOfGoodsSold) {
                                priceToSet = costOfGoodsSold * 1.04;
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

function adjustPriceDown(oldPrice, marketPrice, fastDrop = false) {

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

    if (fastDrop) {
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
