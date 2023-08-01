export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const profitPerSecond = corporation.revenue - corporation.expenses;

    const divisionsProductNames = new Map();

    if (corporation.divisions.includes("Gidget's Smokes")){
        divisionsProductNames.set("Gidget's Smokes", { division: "Gidget's Smokes", productNames: ["These Smokes Probably Won't Kill U v.", "These Smokes WILL Kill You v.", "This Leaf is Highly Addictive v.", "Behold, the bringer of Death v.", "You will live so fast and DIE young if you smoke these v."] });
    }

    if (corporation.divisions.includes("Gidget's Computers & Hardware")){
        divisionsProductNames.set("Gidget's Computers & Hardware", { division: "Gidget's Computers & Hardware", productNames: ["Desktop Computer v.", "Router v.", "Laptop Computer v.", "Smart Phone v.", "Computer Monitor v."] });
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

        let mimimumSpend = 1_000_000_000;

        if(profitPerSecond > mimimumSpend){
            mimimumSpend = profitPerSecond;
        }

        if (division.products.length < division.maxProducts && !oneDeveloping) {
            const productName = divisionConstants.productNames[division.products.length];

            ns.corporation.makeProduct(divisionName, "Aevum", productName + 1, mimimumSpend, mimimumSpend);
        }

        if (division.products.length === division.maxProducts && !oneDeveloping) {

            const lowestRatedProduct = products
                .sort((a, b) => b.rating - a.rating)
                .pop();

            ns.corporation.discontinueProduct(divisionName, lowestRatedProduct.name);

            const splitName = lowestRatedProduct.name.split("v.");

            ns.corporation.makeProduct(divisionName, "Aevum", `${splitName[0]}v.${Number(splitName[1]) + 1}`, mimimumSpend, mimimumSpend);
        }
    }
}
