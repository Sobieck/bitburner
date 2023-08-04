export async function main(ns) {
    if (ns.corporation.hasCorporation()) {
        return;
    }

    const moneyOnHome = ns.getServerMoneyAvailable("home");

    if (moneyOnHome > 200_000_000_000) {
        ns.corporation.createCorporation("Gidget's Keiretsu", true);
        ns.write("data/juice.txt", "buy", "W");
    }
}


