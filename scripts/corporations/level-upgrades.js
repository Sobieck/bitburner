export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const profit = corporation.revenue - corporation.expenses;

    const thingsToUpgrade = [
        "Smart Factories",
        "Smart Storage",
    ]

    if (corporation.funds > 200_000_000_000 && profit > 1_000_000) {

        for (const upgrade of thingsToUpgrade) {
            const level = ns.corporation.getUpgradeLevel(upgrade);
            if(level < 10){
                ns.corporation.levelUpgrade(upgrade);
            }
        }      
    }
}