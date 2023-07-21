export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const excludedDivisions = [
        "Gidget's Import/Export"
    ]

    const importExportRelationships = [
        { exporter: "Gidget's Farm", importer: "Gidget's Smokes", material: "Plants" }
    ];

    const rawMaterialProducers = [
        { producer: "Gidget's Farm", produces: ["Food", "Plants"]}
    ]

    // {"startingCost":10_000_000_000,"description":"Gather water through passive means.","recommendStarting":false,"realEstateFactor":0.2,"scienceFactor":0.1,"hardwareFactor":0,"robotFactor":0,"aiCoreFactor":0.1,"advertisingFactor":0.03,"requiredMaterials":{},"producedMaterials":["Water"]}

    //{"startingCost":70_000_000_000,"description":"Produce industrial chemicals.","recommendStarting":false,"realEstateFactor":0.25,"scienceFactor":0.75,"hardwareFactor":0.2,"robotFactor":0.25,"aiCoreFactor":0.2,"advertisingFactor":0.07,"requiredMaterials":{"Plants":1,"Water":0.5},"producedMaterials":["Chemicals"]}

    const corporation = ns.corporation.getCorporation();
    const divisionsToOperateOn = corporation.divisions.filter(divisionName => !excludedDivisions.includes(divisionName));

    if (corporation.state !== "START") {
        return;
    }


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

                if(product.desiredSellPrice === 0){
                    product.desiredSellPrice = '(MP)+0'
                }

                const oldPriceAdjuster = Number(product.desiredSellPrice.split(')')[1]);
               
                if (product.stored === 0 && product.developmentProgress === 100) {
                    const adjustment = oldPriceAdjuster + 1;
                    const sign = adjustment >= 0 ? "+" : ""
                    ns.corporation.sellProduct(divisionName, city, productName, "MAX", `(MP)${sign}${adjustment}`, false)
                }

                if (product.stored > 10) {
                    const adjustment = oldPriceAdjuster - 1;
                    const sign = adjustment >= 0 ? "+" : ""
                    ns.corporation.sellProduct(divisionName, city, productName, "MAX", `(MP)${sign}${adjustment}`, false)
                }
            }
        }

        for (const rawMaterialProducer of rawMaterialProducers) {
            for (const city of division.cities) {

                

            }
        }
    }
}