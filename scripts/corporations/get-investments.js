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
        { round: 1, investment: 95_000_000_000, stayPrivate: true },
        { round: 2, investment: 900_000_000_000, stayPrivate: false },
    ]

    //https://steamcommunity.com/app/1812820/discussions/0/3843305519473742719/
    let value = 10e9 + Math.max(corporation.funds, 0) / 3 //Base valuation
    if (profit > 0) { value += profit * 315e3 }
    value *= Math.pow(1.1, corporation.divisions.length)
    value -= value % 1e6 //Round down to nearest millionth
    value *= 2 //ns.getBitNodeMultipliers().CorporationValuation
    const pricePerShare = value / corporation.totalShares // Per share, don't divide if you want full valuatio

    if (corporation.public === false) {
        for (const minimumInvestment of investmentWeWillTake) {
            if (stayPrivate) {
                const investmentOffer = ns.corporation.getInvestmentOffer();
                if (investmentOffer.round === minimumInvestment.round && investmentOffer.funds > minimumInvestment.investment) {
                    ns.corporation.acceptInvestmentOffer();
                }
            } else {
                const sharesToSell = corporation.totalShares * .25;
                const raiseAmount = pricePerShare * sharesToSell;

                if (raiseAmount > minimumInvestment.investment) {
                    ns.corporation.goPublic(sharesToSell);
                }
            }
        }
    }

    if (profit > 200_000_000 && corporation.public === false) {
        ns.corporation.goPublic(0);
    }

    if (corporation.public && corporation.dividendRate !== .01 && !ns.corporation.hasUnlock("Government Partnership") && profit > 200_000_000) {
        ns.corporation.issueDividends(.01);
    }

    if (corporation.public && corporation.dividendRate !== .5 && ns.corporation.hasUnlock("Government Partnership") && profit > 200_000_000) {
        ns.corporation.issueDividends(.5);
    }
}

