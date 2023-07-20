export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const corporateProfits = corporation.revenue - corporation.expenses;

    const divisionalCorporateProfitsFile = "data/divisionalCorporateProfits.txt";
    let divisionalCorporateProfits = new Map();
    if (ns.fileExists(divisionalCorporateProfitsFile)) {
        divisionalCorporateProfits = new Map(JSON.parse(ns.read(divisionalCorporateProfitsFile)));
    }

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName);

        const divisionalProfitsLastCycle = division.lastCycleRevenue - division.lastCycleExpenses;

        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });
        // ns.toast(formatter.format(divisionalProfitsLastCycle))

        let divisionProfitsRecord;

        if (divisionalCorporateProfits.has(divisionName)) {
            divisionProfitsRecord = divisionalCorporateProfits.get(divisionName);
        } else {
            divisionProfitsRecord = { sumOfProfitsInThisAccountingPeriod: 0, count: 0, lastProfit: 0, teaPartyCost: 0, partyEffect: [] };
        }

        if (divisionProfitsRecord.lastProfit !== divisionalProfitsLastCycle) {
            divisionProfitsRecord.count++;
            divisionProfitsRecord.sumOfProfitsInThisAccountingPeriod += divisionalProfitsLastCycle;
            divisionProfitsRecord.lastProfit = divisionalProfitsLastCycle;



            let employeeCount = 0;
            let morales = [];
            let energies = [];

            for (const city of division.cities) {
                const office = ns.corporation.getOffice(divisionName, city);

                morales.push(office.avgMorale);
                energies.push(office.avgEnergy);

                employeeCount += office.numEmployees;
            }

            const averageMorale = averageArray(morales);
            const averageEnergy = averageArray(energies);

            const teaCostPerHead = 500_000;
            divisionProfitsRecord.teaPartyCost = employeeCount * teaCostPerHead;

            const minimumMoraleAndEnergy = 60;
            const divisionIsStrugglingAndWeAreProfitableAndHaveMoney = (averageMorale < minimumMoraleAndEnergy || averageEnergy < minimumMoraleAndEnergy) && corporateProfits > 5_000_000 && corporation.funds > 100_000_000_000;


            const divisionalProfitsCanSustain = divisionProfitsRecord.sumOfProfitsInThisAccountingPeriod > divisionProfitsRecord.teaPartyCost;
            const shouldTreatOurEmployees = divisionalProfitsCanSustain || divisionIsStrugglingAndWeAreProfitableAndHaveMoney

            // if(divisionName === "Gidget's Smokes"){
            //     ns.tprint(`${divisionalProfitsCanSustain} ${shouldTreatOurEmployees} ${formatter.format(corporateProfits)} ${formatter.format(corporation.funds)}`)
            // }

            if (shouldTreatOurEmployees) {
                const goal = 90;

                let tea = false;
                let party = false;

                if (averageEnergy < averageMorale) {
                    if (averageEnergy < goal) {
                        tea = true;
                    }
                }

                if (averageMorale < averageEnergy) {
                    if (averageMorale < goal) {
                        party = true;
                    }
                }

                let effects = [];

                for (const city of division.cities) {
                    if (party) {
                        const effect = ns.corporation.throwParty(divisionName, city, teaCostPerHead);
                        effects.push(effect);
                    }

                    if (tea) {
                        const effect = ns.corporation.buyTea(divisionName, city);
                        effects.push(effect);
                    }
                }

                if (party) {
                    divisionProfitsRecord.partyEffect = recordEffectiveness(averageMorale, effects, divisionProfitsRecord.partyEffect);
                }

                resetProfitRecord(divisionProfitsRecord);
            }
        }

        divisionalCorporateProfits.set(divisionName, divisionProfitsRecord);
    }

    

    ns.rm(divisionalCorporateProfitsFile);
    ns.write(divisionalCorporateProfitsFile, JSON.stringify(Array.from(divisionalCorporateProfits.entries()), "W"));
}

function recordEffectiveness(average, effects, array) {
    const mapToWorkOn = new Map(array);

    const averageBracket = Math.floor(average / 10);
    const averageEffect = averageArray(effects);
    let newAverageOverTime;

    if (mapToWorkOn.has(averageBracket)) {
        let previousEffect = mapToWorkOn.get(averageBracket);
        previousEffect += averageEffect;
        newAverageOverTime = previousEffect / 2;
    } else {
        newAverageOverTime = averageEffect;
    }

    mapToWorkOn.set(averageBracket, newAverageOverTime);

   return Array.from(mapToWorkOn);
}

function averageArray(array) {
    return array.reduce((acc, x) => acc + x, 0) / array.length;
}

function resetProfitRecord(divisionProfitsRecord) {
    divisionProfitsRecord.count = 0;
    divisionProfitsRecord.sumOfProfitsInThisAccountingPeriod = 0;
}
