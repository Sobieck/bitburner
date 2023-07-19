export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const divisionsToOperateOn = corporation.divisions.filter(divisionName => divisionName !== "Gidget's Farm");

    const divisionsProductNames = new Map();

    divisionsProductNames.set("Gidget's Smokes", { division: "Gidget's Smokes", productNames: ["These Smokes Probably Won't Kill U v.", "These Smokes WILL Kill You v.", "This Leaf is Highly Addictive v."] });


    for (const divisionName of divisionsToOperateOn) {
        const division = ns.corporation.getDivision(divisionName);
        const divisionConstants = divisionsProductNames.get(divisionName);

        const products = [];
        let oneDeveloping = false;

        for (const productName of division.products) {
            for (const city of division.cities) {
                ns.corporation.sellProduct(divisionName, city, productName, "MAX", "MP", false)
            }

            const product = ns.corporation.getProduct(divisionName, "Aevum", productName);

            if (product.developmentProgress < 100) {
                oneDeveloping = true;
            }

            products.push(product);
        }

        ///{"name":"These Smokes Won't Kill U v.1","rating":0,"effectiveRating":0,"stats":{"quality":0,"performance":0,"durability":0,"reliability":0,"aesthetics":0,"features":0},"productionCost":0,"desiredSellPrice":"MP","desiredSellAmount":"MAX","stored":0,"productionAmount":0,"actualSellAmount":0,"developmentProgress":0.5884684893132216}

        ///{"name":"These Smokes Probably Won't Kill U v.1","rating":60.062971001653516,"effectiveRating":15.500060774287759,"stats":{"quality":61.39712772783787,"performance":57.1859948074073,"durability":59.6021252785258,"reliability":56.451080727629844,"aesthetics":55.623845321572134,"features":59.01132849214916},"productionCost":14455.726550399046,"desiredSellPrice":"MP","desiredSellAmount":"MAX","stored":0,"productionAmount":5.988354804376722,"actualSellAmount":5.988354804376722,"developmentProgress":100}

        if (division.products.length < 3 && !oneDeveloping) {
            const productName = divisionConstants.productNames[division.products.length];
            ns.corporation.makeProduct(divisionName, "Aevum", productName + 1, 1_000_000_000, 1_000_000_000);
        }

        if (division.products.length === 3 && !oneDeveloping) {

            const lowestRatedProduct = products
                .sort((a, b) => b.rating - a.rating)
                .pop();

            ns.corporation.discontinueProduct(divisionName, lowestRatedProduct.name);

            const splitName = lowestRatedProduct.name.split("v.");

            ns.corporation.makeProduct(divisionName, "Aevum", `${splitName[0]}v.${Number(splitName[1]) + 1}`, 1_000_000_000, 1_000_000_000);
        }
    }
}
