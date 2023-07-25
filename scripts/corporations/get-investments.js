export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const profit = corporation.revenue - corporation.expenses;

    // ns.tprint(ns.corporation.getInvestmentOffer())

    ///{"funds":96283140000,"shares":100000000,"round":1}

    // { round: 1, investment: 100_000_000 },
    // { round: 2, investment: 300_000_000 }, // worked, but I bet we can do better
    // { round: 3, investment: 3_000_000_000 },
    
    const investmentWeWillTake = [
        { round: 1, investment: 100_000_000_000 },   
        { round: 2, investment: 800_000_000_000 },
    ]

    const investmentOffer = ns.corporation.getInvestmentOffer();

    if (corporation.public === false) {
        for (const minimumInvestment of investmentWeWillTake) {
            if(investmentOffer.round === minimumInvestment.round && investmentOffer.funds > minimumInvestment.investment) {
                ns.corporation.acceptInvestmentOffer();
            }
        }
    }

    if (profit > 200_000_000 && corporation.public === false) {
        ns.corporation.goPublic(0);
    }

    if (corporation.public && corporation.dividendRate !== .01 && !ns.corporation.hasUnlock("Government Partnership")) {
        ns.corporation.issueDividends(.01);
    }

    if (corporation.public && corporation.dividendRate !== .5 && ns.corporation.hasUnlock("Government Partnership")) {
        ns.corporation.issueDividends(.5);
    }
}