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
        { round: 1, investment: 95_000_000_000, goPublic: false },
        { round: 2, investment: 900_000_000_000, goPublic: true },
    ]

    const investmentOffer = ns.corporation.getInvestmentOffer();

    for (const minimumInvestment of investmentWeWillTake) {
        if (investmentOffer.round === minimumInvestment.round && investmentOffer.funds > minimumInvestment.investment) {
            if (goPublic === false) {
                ns.corporation.acceptInvestmentOffer();
            } else {
                const sharesToSell = corporation.totalShares * .25;
                ns.corporation.goPublic(sharesToSell);
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
//https://github.com/danielyxie/bitburner/blob/be42689697164bf99071c0bcf34baeef3d9b3ee8/src/Corporation/Corporation.tsx#L172
// function getValuation(corporation, ns) {
//     let val,
//         profit = corporation.revenue - corporation.expenses;
//     if (corporation.public) {
//         // Account for dividends
//         if (corporation.dividendRate > 0) {
//             profit *= 1 - corporation.dividendRate;
//         }

//         val = corporation.funds + profit * 85e3;
//         val *= Math.pow(1.1, corporation.divisions.length);
//         val = Math.max(val, 0);
//     } else {
//         val = 10e9 + Math.max(corporation.funds, 0) / 3; //Base valuation
//         if (profit > 0) {
//             val += profit * 315e3;
//         }
//         val *= Math.pow(1.1, corporation.divisions.length);
//         val -= val % 1e6; //Round down to nearest millionth
//     }
// // default https://github.com/danielyxie/bitburner/blob/be42689697164bf99071c0bcf34baeef3d9b3ee8/src/BitNode/BitNode.tsx#L500C2-L500C27
// // CorporationValuation: 1,

//     return val * 1;// BitNodeMultipliers.CorporationValuation; ns.getBitNodeMultipliers().CorporationValuation
// }

// const valuationsList = [];

// function determineValuation(corporation, ns) {
//     const valuationsLength = 10;
//     valuationsList.push(getValuation(corporation, ns)); //Add current valuation to the list
//     if (valuationsList.length > valuationsLength) valuationsList.shift();
//     let val = valuationsList.reduce((a, b) => a + b); //Calculate valuations sum
//     val /= valuationsLength; //Calculate the average  // corpConstants.valuationLength;
//     return val;
//   }

