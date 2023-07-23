export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const profit = corporation.revenue - corporation.expenses;

    if (corporation.public === false && corporation.totalShares === corporation.numShares) {
        const investmentOffer = ns.corporation.getInvestmentOffer();
        
        if(investmentOffer.funds > 300_000_000_000){
            
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