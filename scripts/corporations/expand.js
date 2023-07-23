export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();

    const divisionsGoal = [
        { order: 0, fundsNeeded: 0, name: "Gidget's Farm", industry: "Agriculture", profitNeeded: 0 },
        { order: 1, fundsNeeded: 750_000_000_000, name: "Gidget's Smokes", industry: "Tobacco", profitNeeded: 10_000_000 },
        { order: 2, fundsNeeded: 2_000_000_000_000, name: "Chemist Gidget's Lab", industry: "Chemical", profitNeeded: 2_000_000_000 },
    ]

    const profit = corporation.revenue - corporation.expenses;

    for (const divisionGoal of divisionsGoal) {
        if (corporation.divisions.length === divisionGoal.order && corporation.funds > divisionGoal.fundsNeeded && !corporation.divisions.includes(divisionGoal.name) && profit > divisionGoal.profitNeeded) {
            ns.corporation.expandIndustry(divisionGoal.industry, divisionGoal.name);
        }
    }
}