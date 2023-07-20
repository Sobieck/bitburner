export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }


    const corporation = ns.corporation.getCorporation();
    const corporateProfits = corporation.revenue - corporation.expenses;

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);
    }
}