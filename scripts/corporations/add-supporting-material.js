export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }


    const gidgetsFarm = "Gidget's Farm";
    const division = ns.corporation.getDivision(gidgetsFarm);

    const industry = "Agriculture";

    const industryInformation = ns.corporation.getIndustryData(industry);

    //{"startingCost":40000000000,"description":"Cultivate crops and breed livestock to produce food.","recommendStarting":true,"realEstateFactor":0.72,"scienceFactor":0.5,"hardwareFactor":0.2,"robotFactor":0.3,"aiCoreFactor":0.3,"advertisingFactor":0.04,"requiredMaterials":{"Water":0.5,"Chemicals":0.2},"producedMaterials":["Plants","Food"]}

    const allMaterials = [
        { name: "Water", factorName: "waterFactor" },
        // { name: "Ore", factorName: "" },
        // { name: "Minerals", factorName: "" },
        // { name: "Food", factorName: "" },
        // { name: "Plants", factorName: "" },
        // { name: "Metal", factorName: "" },
        { name: "Hardware", factorName: "hardwareFactor" },
        // { name: "Chemicals", factorName: "" },
        // { name: "Drugs", factorName: "" },
        { name: "Robots", factorName: "robotFactor" },
        { name: "AI Cores", factorName: "aiCoreFactor" },
        { name: "Real Estate", factorName: "realEstateFactor" },
    ];

    const materialsToBuy = [];

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

    const fillXPercentOfWarehouseWithMultiplerMaterial = 0.4; // 0.5 was 789k profit

    for (const city of division.cities) {
        const warehouse = ns.corporation.getWarehouse(gidgetsFarm, city);  //{"level":3,"city":"Aevum","size":330,"sizeUsed":3.849301959694781,"smartSupplyEnabled":true}
        const amountToFillWithMultipliers = warehouse.size * fillXPercentOfWarehouseWithMultiplerMaterial;

        for (let material of materialsToBuy) {
            const percentOf = material.factor / sumOfAllMaterialsFactors;
            const spaceToFill = Math.floor(amountToFillWithMultipliers * percentOf);
            const countToBuy = Math.floor(spaceToFill / material.size);

            const materialInWarehouse = ns.corporation.getMaterial(gidgetsFarm, city, material.name); // {"marketPrice":8352.161099444254,"desiredSellPrice":"MP","desiredSellAmount":"MAX","name":"Hardware","stored":0,"quality":1,"productionAmount":0,"actualSellAmount":0,"exports":[]}
            let amountToBuy = 0;
            if (materialInWarehouse.stored < (countToBuy * .95)) {
                if(countToBuy < 200){
                    ns.corporation.bulkPurchase(gidgetsFarm, city, material.name, countToBuy);
                } else {
                    amountToBuy = Math.floor(countToBuy / 20);
                }
            }

            ns.corporation.buyMaterial(gidgetsFarm, city, material.name, amountToBuy)

            let amountToSell = 0;
            const freeSpacePercent = (warehouse.size - warehouse.sizeUsed) / warehouse.size
            if (freeSpacePercent < 0.1 && materialInWarehouse.stored > countToBuy){
                amountToSell = materialInWarehouse.stored - countToBuy;
                if (amountToSell > 30){
                    amountToSell = 30;
                }
            } 

            ns.corporation.sellMaterial(gidgetsFarm, city, material.name, amountToSell, "MP");

            material.countToBuy = countToBuy;
            material.spaceToFill = spaceToFill;
        }
    }

    // ns.rm("stuff.txt");
    // ns.write("stuff.txt", JSON.stringify(materialsToBuy), "W");
}