export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    const divisionsProductNames = new Map();

    if (corporation.divisions.includes("Gidget's Smokes")){
        divisionsProductNames.set("Gidget's Smokes", { division: "Gidget's Smokes", productNames: ["These Smokes Probably Won't Kill U v.", "These Smokes WILL Kill You v.", "This Leaf is Highly Addictive v.", "Behold, the bringer of Death v.", "You will live so fast and DIE young if you smoke these v."] });
    }

    const includedDivisions = Array.from(divisionsProductNames.keys());

    for (const divisionName of includedDivisions) {
        const division = ns.corporation.getDivision(divisionName);
        const divisionConstants = divisionsProductNames.get(divisionName);

        const products = [];
        let oneDeveloping = false;

        for (const productName of division.products) {
            const product = ns.corporation.getProduct(divisionName, "Aevum", productName);

            if (product.developmentProgress < 100) {
                oneDeveloping = true;
            }

            products.push(product);
        }

        let maximumProducts = 3;

        if(ns.corporation.hasResearched(divisionName, "uPgrade: Capacity.I")){
            maximumProducts = 4;
        }

        if(ns.corporation.hasResearched(divisionName, "uPgrade: Capacity.I")){
            maximumProducts = 5;
        }

        if (division.products.length < maximumProducts && !oneDeveloping) {
            const productName = divisionConstants.productNames[division.products.length];
            ns.corporation.makeProduct(divisionName, "Aevum", productName + 1, 1_000_000_000, 1_000_000_000);
        }

        if (division.products.length === maximumProducts && !oneDeveloping) {

            const lowestRatedProduct = products
                .sort((a, b) => b.rating - a.rating)
                .pop();

            ns.corporation.discontinueProduct(divisionName, lowestRatedProduct.name);

            const splitName = lowestRatedProduct.name.split("v.");

            ns.corporation.makeProduct(divisionName, "Aevum", `${splitName[0]}v.${Number(splitName[1]) + 1}`, 1_000_000_000, 1_000_000_000);
        }
    }
}
