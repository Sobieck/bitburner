export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const materialGoalsGoals = [];

    const corporation = ns.corporation.getCorporation();

    for (const divisionName of corporation.divisions) {
        const materialGoals = [];

        const division = ns.corporation.getDivision(divisionName);
        const allMaterials = [
            { name: "Water", factorName: "waterFactor" },
            { name: "Hardware", factorName: "hardwareFactor" },
            { name: "AI Cores", factorName: "aiCoreFactor" },
            { name: "Robots", factorName: "robotFactor" },
            { name: "Real Estate", factorName: "realEstateFactor" },
            // { name: "Ore", factorName: "" },
            // { name: "Minerals", factorName: "" },
            // { name: "Food", factorName: "" },
            // { name: "Plants", factorName: "" },
            // { name: "Metal", factorName: "" },
            // { name: "Chemicals", factorName: "" },
            // { name: "Drugs", factorName: "" },
        ];

        const materialsToBuy = [];

        const industryInformation = ns.corporation.getIndustryData(division.type);
        const itemsInIndustry = Object.entries(industryInformation);

        let sumOfAllMaterialsFactors = 0;

        for (const material of allMaterials) {
            const materialImprovesProduction = itemsInIndustry.find(x => x[0] === material.factorName);

            if (materialImprovesProduction) {
                const materialData = ns.corporation.getMaterialData(material.name);

                const factor = materialImprovesProduction[1];
                sumOfAllMaterialsFactors += factor;

                const size = materialData.size;
                const name = material.name;
                materialsToBuy.push({ name, factor, size });
            }
        }

        let fillXPercentOfWarehouseWithMultiplerMaterial = 0.5; // 0.5 was 789k profit 0.4 500k .6 was 402k

        if(division.type === "Chemical"){
            fillXPercentOfWarehouseWithMultiplerMaterial = 0.8;
        }

        for (const city of division.cities) {
            const warehouse = ns.corporation.getWarehouse(divisionName, city);
            const amountToFillWithMultipliers = warehouse.size * fillXPercentOfWarehouseWithMultiplerMaterial;

            for (let material of materialsToBuy) {
                const percentOf = material.factor / sumOfAllMaterialsFactors;
                const spaceToFill = Math.floor(amountToFillWithMultipliers * percentOf);
                const countToBuy = Math.floor(spaceToFill / material.size);

                const materialInWarehouse = ns.corporation.getMaterial(divisionName, city, material.name);

                let amountToBuy = 0;
                if (materialInWarehouse.stored < (countToBuy * .95)) {
                    if (countToBuy < 200) {
                        ns.corporation.bulkPurchase(divisionName, city, material.name, countToBuy);
                    } else {
                        amountToBuy = Math.floor(countToBuy / 20);
                    }
                }

                ns.corporation.buyMaterial(divisionName, city, material.name, amountToBuy)

                let amountToSell = 0;
                const freeSpacePercent = (warehouse.size - warehouse.sizeUsed) / warehouse.size
                if (freeSpacePercent < 0.1 && materialInWarehouse.stored > countToBuy) {
                    amountToSell = materialInWarehouse.stored - countToBuy;
                    if (amountToSell > 30) {
                        amountToSell = 30;
                    }
                }

                ns.corporation.sellMaterial(divisionName, city, material.name, amountToSell, "MP");

                material.countToBuy = countToBuy;
                material.spaceToFill = spaceToFill;

                const materialInGoals = materialGoals.find(x => x.name === material.name);

                if (!materialInGoals) {
                    materialGoals.push(material);
                }
            }
        }

        materialGoalsGoals.push(materialGoals);
    }

    // ns.rm("stuff.txt");
    // ns.write("stuff.txt", JSON.stringify(materialGoalsGoals), "W");
}