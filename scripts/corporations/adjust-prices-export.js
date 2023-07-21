export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const excludedDivisions = [
    ]

    const gidgetsFarm = "Gidget's Farm"
    const gidgetsSmokes = "Gidget's Smokes"

    const corporation = ns.corporation.getCorporation();

    if (corporation.state !== "START") {
        return;
    }

    const gidgetsFarmExists = corporation.divisions.includes(gidgetsFarm);
    const gidgetsSmokesExists = corporation.divisions.includes(gidgetsSmokes);

    const rawMaterialProducers = [];
    const importExportRelationships = [];

    if (gidgetsFarmExists) {

        rawMaterialProducers.push({ producer: gidgetsFarm, materials: ["Food", "Plants"] });

        if (gidgetsSmokesExists) {
            importExportRelationships.push({ exporter: gidgetsFarm, importer: gidgetsSmokes, material: "Plants" })
        }
    }

    // {"startingCost":10_000_000_000,"description":"Gather water through passive means.","recommendStarting":false,"realEstateFactor":0.2,"scienceFactor":0.1,"hardwareFactor":0,"robotFactor":0,"aiCoreFactor":0.1,"advertisingFactor":0.03,"requiredMaterials":{},"producedMaterials":["Water"]}

    //{"startingCost":70_000_000_000,"description":"Produce industrial chemicals.","recommendStarting":false,"realEstateFactor":0.25,"scienceFactor":0.75,"hardwareFactor":0.2,"robotFactor":0.25,"aiCoreFactor":0.2,"advertisingFactor":0.07,"requiredMaterials":{"Plants":1,"Water":0.5},"producedMaterials":["Chemicals"]}


    const divisionsToOperateOn = corporation.divisions.filter(divisionName => !excludedDivisions.includes(divisionName));

    for (const divisionName of divisionsToOperateOn) {
        const division = ns.corporation.getDivision(divisionName);

        const divisionHasExportRelationship = importExportRelationships.find(x => x.exporter === divisionName);

        if (divisionHasExportRelationship) {
            for (const city of division.cities) {
                ns.corporation.cancelExportMaterial(divisionHasExportRelationship.exporter, city, divisionHasExportRelationship.importer, city, divisionHasExportRelationship.material);
                ns.corporation.exportMaterial(divisionHasExportRelationship.exporter, city, divisionHasExportRelationship.importer, city, divisionHasExportRelationship.material, "-(IPROD)");
            }
        }

        for (const city of division.cities) {
            for (const productName of division.products) {
                const product = ns.corporation.getProduct(divisionName, city, productName);

                if(product.developmentProgress !== 100){
                    continue;
                }

                if (product.desiredSellPrice === 0) {
                    let mostExpensivePrice = 0;

                    for (const productNameForPrice of division.products) {
                        const product = ns.corporation.getProduct(divisionName, city, productNameForPrice);
                        if (product.desiredSellPrice === 0) {
                            continue;
                        }

                        const price = Number(product.desiredSellPrice.split(')')[1])

                        if (price > mostExpensivePrice) {
                            mostExpensivePrice = price;
                        }
                    }

                    ns.corporation.sellProduct(divisionName, city, productName, "MAX", `(MP)+${mostExpensivePrice}`, false)
                } else {
                    if (product.stored === 0) {
                        const priceToSet = adjustPriceUp(product.desiredSellPrice);
    
                        ns.corporation.sellProduct(divisionName, city, productName, "MAX", priceToSet, false)
                    }
    
                    if (product.stored > 20) {
                        const priceToSet = adjustPriceDown(product.desiredSellPrice);
    
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
                    const material = ns.corporation.getMaterial(divisionName, city, materialName);  //{"marketPrice":3245.007553378283,"desiredSellPrice":"MP","desiredSellAmount":"MAX","name":"Food","stored":64100.69340032647,"quality":14.512531257704307,"demand":82.58491635176067,"productionAmount":387.8,"actualSellAmount":375.5010978448139,"exports":[]}

                    if (material.desiredSellPrice === 0 || material.desiredSellPrice === "MP" || material.desiredSellPrice === "MP+5"){
                        ns.corporation.sellMaterial(divisionName, city, material.name, "MAX", "(MP)+0");
                    } else {
                        if (material.stored === 0) {
                            const priceToSet = adjustPriceUp(material.desiredSellPrice);
                            ns.corporation.sellMaterial(divisionName, city, material.name, "MAX", priceToSet);
                        } 
                        
                        if (material.stored > 20) {
                            const priceToSet = adjustPriceDown(material.desiredSellPrice);
                            ns.corporation.sellMaterial(divisionName, city, material.name, "MAX", priceToSet);
                        }
                    }
                }
            }
        }
    }
}

function adjustPriceUp(desiredSellPrice) {
    const oldPriceAdjuster = Number(desiredSellPrice.split(')')[1]);
    let adjustment = 0;
    if (oldPriceAdjuster >= 0) {
        if (oldPriceAdjuster > 100) {
            adjustment = oldPriceAdjuster * 1.05;
        } else {
            adjustment = oldPriceAdjuster + 10;
        }
    }

    if (oldPriceAdjuster < 0) {
        if (oldPriceAdjuster < -100) {
            adjustment = oldPriceAdjuster * 0.95;
        } else {
            adjustment = oldPriceAdjuster + 10;
        }
    }

    const sign = adjustment >= 0 ? "+" : "";
    const priceToSet = `(MP)${sign}${adjustment}`;

    return priceToSet;
}

function adjustPriceDown(desiredSellPrice) {
    const oldPriceAdjuster = Number(desiredSellPrice.split(')')[1]);
    let adjustment = 0;
    if (oldPriceAdjuster >= 0) {
        if (oldPriceAdjuster > 100) {
            adjustment = oldPriceAdjuster * 0.97;
        } else {
            adjustment = oldPriceAdjuster - 5;
        }
    }

    if (oldPriceAdjuster < 0) {
        if (oldPriceAdjuster < -100) {
            adjustment = oldPriceAdjuster * 1.03;
        } else {
            adjustment = oldPriceAdjuster - 5;
        }
    }

    const sign = adjustment >= 0 ? "+" : "";
    const priceToSet = `(MP)${sign}${adjustment}`;

    return priceToSet;
}
