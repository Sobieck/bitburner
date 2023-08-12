let incomePerHourEstimate;
let updatedMoneyEstimate = false;

export async function main(ns) {
    if (!ns.stock.has4SDataTIXAPI() ||
        !ns.corporation.hasCorporation() ||
        !ns.gang.inGang() ||
        ns.fileExists('data/juice.txt')
    ) {
        return;
    }

    if (ns.singularity.getOwnedAugmentations(true) !== ns.singularity.getOwnedAugmentations(false)) {
        ns.singularity.installAugmentations('scripts/coordinator.js')
    }

    const slumSnakesName = 'Slum Snakes'
    let slumSnakesRep;
    const player = ns.getPlayer();

    const hasSlumSnakes = player.factions.includes(slumSnakesName);
    if (hasSlumSnakes) {
        slumSnakesRep = ns.singularity.getFactionRep(slumSnakesName);
    }

    const incomeEveryMinuteObservationsFile = 'data/incomeEveryMinuteForTheLast30Minutes.txt'

    let incomeObservations = [];
    const lastObservation = new Date();
    let lastObservationRecordedMoney = new Date();

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    if (ns.fileExists(incomeEveryMinuteObservationsFile)) {
        const incomePlusDateFromFile = JSON.parse(ns.read(incomeEveryMinuteObservationsFile));
        incomeObservations = incomePlusDateFromFile.incomeObservations;
        lastObservationRecordedMoney = new Date(incomePlusDateFromFile.lastObservation);
    } else {
        ns.write(incomeEveryMinuteObservationsFile, JSON.stringify({ incomeObservations, lastObservation }), "W");
    }

    if (lastObservationRecordedMoney.getMinutes() !== lastObservation.getMinutes()) {
        let totalIncomeSinceAugInstall = 0

        const moneySources = ns.getMoneySources();

        for (let [key, value] of Object.entries(moneySources.sinceInstall)) {
            if (key !== "total" && value > 0 && key !== "stock") {
                totalIncomeSinceAugInstall += value;
            }
        }
        incomeObservations.push(totalIncomeSinceAugInstall);

        const totalIncome30MinutesAgo = incomeObservations[0];

        const incomePerMinute = (totalIncomeSinceAugInstall - totalIncome30MinutesAgo) / incomeObservations.length;
        incomePerHourEstimate = incomePerMinute * 60;
        updatedMoneyEstimate = true;

        if (incomeObservations.length > 30) {
            incomeObservations.shift();
        }

        ns.rm(incomeEveryMinuteObservationsFile);
        ns.write(incomeEveryMinuteObservationsFile, JSON.stringify({ incomeObservations, lastObservation }), "W");
    } else {
        updatedMoneyEstimate = false;
    }



    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);

    const notOwnedAugments = ns
        .singularity
        .getAugmentationsFromFaction(slumSnakesName)
        .filter(x => x !== "NeuroFlux Governor")
        .filter(x => !ownedAugmentations.includes(x))
        .map(y => {
            return {
                augmentName: y,
                augmentationRepCost: ns.singularity.getAugmentationRepReq(y),
                price: ns.singularity.getAugmentationPrice(y),
                prereqs: ns.singularity.getAugmentationPrereq(y)
            }
        })
        .sort((a, b) => b.price - a.price);

    const splits = [
        6_500,
        18_000,
        100_000_000
    ]

    let repGoal = 0;
    let augmentsToBuy = [];
    for (const split of splits) {
        augmentsToBuy = notOwnedAugments.filter(x => x.augmentationRepCost <= split);
        repGoal = split;
        if (augmentsToBuy.length > 0) {
            break;
        }
    }

    let analytics = new EndOfRoundAnalytics();
    const endOfRoundAnalyticsFile = "analytics/end-round.txt";
    if (ns.fileExists(endOfRoundAnalyticsFile)) {
        analytics = JSON.parse(ns.read(endOfRoundAnalyticsFile));
    }


    if (!analytics.firstEncounterOfRepTrigger) {
        const repTrigger = populateRepTrigger(repGoal, slumSnakesRep);
        analytics.firstEncounterOfRepTrigger = repTrigger;
        saveAnalytics(ns, analytics);
    }

    if (repGoal < slumSnakesRep) {
        if (!analytics.repTrigger) {
            const repTrigger = populateRepTrigger(repGoal, slumSnakesRep);
            analytics.repTrigger = repTrigger;
            saveAnalytics(ns, analytics);
        }

        const priceOfMostExpensiveAugment = Math.max(...augmentsToBuy.map(x => x.price));

        if (priceOfMostExpensiveAugment < 0) {
            return;
        }

        const purchasableAugments = new Map();

        for (const augment of augmentsToBuy) {
            if (purchasableAugments.has(augment.augmentName) === false) {
                const item = {
                    augmentationRepCost: augment.augmentationRepCost,
                    price: augment.price,
                    prereqs: augment.prereqs,
                    faction: slumSnakesName
                }
                purchasableAugments.set(augment.augmentName, item)
            }
        }

        const augmentsLeft = Array.from(purchasableAugments.entries()).sort((a, b) => b[1].price - a[1].price);

        const orderedAugments = [];

        function addPrereqs(prereqName) {
            const augment = purchasableAugments.get(prereqName);

            if (augment && !ownedAugmentations.find(x => x.augmentName === prereqName)) {

                if (augment.prereqs.length > 0) {
                    for (const prereq of augment.prereqs) {
                        addPrereqs(prereq)
                    }
                }

                if (!orderedAugments.find(x => x.augmentName === prereqName)) {
                    orderedAugments.push({ faction: augment.faction, augmentName: prereqName, basePrice: augment.price });
                }
            }
        }

        for (const augmentData of augmentsLeft) {
            const augmentName = augmentData[0];
            const augment = augmentData[1];

            if (augment.prereqs.length > 0) {
                for (const prereqName of augment.prereqs) {
                    addPrereqs(prereqName);
                }
            }

            if (!orderedAugments.find(x => x.augmentName === augmentName)) {
                orderedAugments.push({ faction: augment.faction, augmentName: augmentName, basePrice: augment.price, multipledPrice: 0 })
            }
        }

        let priceMultipler = 1;

        for (const augment of orderedAugments) {
            augment.multipledPrice = augment.basePrice * priceMultipler;
            priceMultipler *= 1.9;
        }

        const moneyNeededForAugments = orderedAugments.reduce((acc, x) => acc + x.multipledPrice, 0);

        let moneyNeededForSleeveAugments = 0;

        const sleevesFile = 'data/sleeves.txt';
        let sleevesData = JSON.parse(ns.read(sleevesFile));

        for (const sleeve of sleevesData.sleeves.filter(x => x.shock === 0)) {
            moneyNeededForSleeveAugments += ns.sleeve
                .getSleevePurchasableAugs(sleeve.name)
                .map(x => x.cost)
                .reduce((acc, b) => acc + b, 0);
        }

        let buyAugmentsWhenWeHaveMoreThanThisMuchMoney = moneyNeededForAugments + moneyNeededForSleeveAugments;

        const estimatedIncomeForTheNextFourHours = incomePerHourEstimate * 4;
        const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
        const stockMarketReserveMoney = JSON.parse(ns.read(stockMarketReserveMoneyFile));

        const moneyAvailable = ns.getServerMoneyAvailable("home") + (stockMarketReserveMoney.moneyInvested * .9);

        const moneyFormatted = formatter.format(incomePerHourEstimate);

        if (moneyFormatted !== "$NaN") {
            const hoursTillInstall = Math.floor(buyAugmentsWhenWeHaveMoreThanThisMuchMoney / incomePerHourEstimate);
            if (updatedMoneyEstimate) {
                const now = new Date();
                const timeStamp = `[${String(now.getHours()).padStart(2, 0)}:${String(now.getMinutes()).padStart(2, 0)}]`

                ns.toast(`${timeStamp} Income Per Hour Estimate: ${moneyFormatted}. ~Hours to install: ${hoursTillInstall} Money Needed: ${formatter.format(moneyNeededForAugments)}`, "success", 60000)
            }

            ns.write("data/needMoney.txt", "", "W");
        }

        if (!analytics.firstEncoundedMoneyTrigger) {
            const moneyTrigger = createMoneyTrigger(estimatedIncomeForTheNextFourHours, buyAugmentsWhenWeHaveMoreThanThisMuchMoney, moneyAvailable, formatter);

            analytics.firstEncoundedMoneyTrigger = moneyTrigger;
            saveAnalytics(ns, analytics);
        }

        if (estimatedIncomeForTheNextFourHours > buyAugmentsWhenWeHaveMoreThanThisMuchMoney || moneyAvailable > buyAugmentsWhenWeHaveMoreThanThisMuchMoney) {

            const stopInvestingFileName = "stopInvesting.txt";
            if (!ns.fileExists(stopInvestingFileName)) {
                ns.write(stopInvestingFileName, buyAugmentsWhenWeHaveMoreThanThisMuchMoney, "W")
                return;
            }

            if (moneyAvailable > buyAugmentsWhenWeHaveMoreThanThisMuchMoney) {
                const stopStockTradingFileName = "stopTrading.txt";
                if (!ns.fileExists(stopStockTradingFileName)) {
                    ns.write(stopStockTradingFileName, "", "W")
                    return;
                }

                if (!analytics.moneyTrigger) {
                    const moneyTrigger = createMoneyTrigger(estimatedIncomeForTheNextFourHours, buyAugmentsWhenWeHaveMoreThanThisMuchMoney, moneyAvailable, formatter);

                    analytics.moneyTrigger = moneyTrigger;
                    saveAnalytics(ns, analytics);
                }

                for (const sleeve of sleevesData.sleeves) {
                    if (sleeve.shock > 0) {
                        continue;
                    }

                    const augmentsToInstall = ns.sleeve
                        .getSleevePurchasableAugs(sleeve.name)
                        .map(x => x.name);

                    for (const augment of augmentsToInstall) {
                        ns.sleeve.purchaseSleeveAug(sleeve.name, augment);
                    }
                }

                analytics.costOfSleeveAugments = moneyNeededForSleeveAugments;

                for (const augment of orderedAugments) {
                    purchaseAug(ns, augment, analytics);
                }

                upgradeHomeMachine(ns, analytics);


                purchaseNeuroFluxGovernors(ns, slumSnakesName, analytics);

                const corporation = ns.corporation.getCorporation();
                const moneyOnHome = ns.getServerMoneyAvailable("home") * 0.9;

                let sharesToBuy = Math.floor(moneyOnHome / corporation.sharePrice);
                if (sharesToBuy > corporation.issuedShares) {
                    sharesToBuy = corporation.issuedShares;
                }

                if (sharesToBuy > 0) {
                    ns.corporation.buyBackShares(sharesToBuy);
                }

                analytics.shareBoughtBack = sharesToBuy;

                analytics.moneyLeft = ns.getServerMoneyAvailable("home");

                saveAnalytics(ns, analytics, true);

                ns.singularity.installAugmentations('scripts/coordinator.js')
            }
        }
    }

    saveAnalytics(ns, analytics);
}

function createMoneyTrigger(estimatedIncomeForTheNextFourHours, buyAugmentsWhenWeHaveMoreThanThisMuchMoney, moneyAvailable, formatter) {
    const moneyTrigger = new MoneyTrigger();
    moneyTrigger.estimatedIncomeTriggered = estimatedIncomeForTheNextFourHours > buyAugmentsWhenWeHaveMoreThanThisMuchMoney;
    moneyTrigger.moneyIsGreaterThanTriggered = moneyAvailable > buyAugmentsWhenWeHaveMoreThanThisMuchMoney;

    moneyTrigger.estimatedIncomeForTheNextFourHours = formatter.format(estimatedIncomeForTheNextFourHours);
    moneyTrigger.moneyRightNow = formatter.format(moneyAvailable);
    moneyTrigger.buyArgumentsWhenWeHave = formatter.format(buyAugmentsWhenWeHaveMoreThanThisMuchMoney);
    return moneyTrigger;
}

function populateRepTrigger(repGoal, currentFactionRep) {
    const repTrigger = new RepTrigger();

    repTrigger.maximumAugRepNeeded = repGoal;
    repTrigger.currentFactionRep = currentFactionRep;
    return repTrigger;
}

function saveAnalytics(ns, analytics, final = false) {
    let endOfRoundAnalyticsFile = "analytics/end-round.txt";
    ns.rm(endOfRoundAnalyticsFile);

    if (final) {
        const now = new Date()
        const factionToMax = analytics.factionsToMax[analytics.factionsToMax.length - 1].factionToMax.replaceAll(' ', '');
        endOfRoundAnalyticsFile = `analytics/${now.toISOString().split('T')[0]}-${String(now.getHours()).padStart(2, 0)}-${String(now.getMinutes()).padStart(2, 0)}-${factionToMax}-end-round.txt`;
    }

    analytics.lastSaved = new Date();
    ns.write(endOfRoundAnalyticsFile, JSON.stringify(analytics), "W");
}


function purchaseNeuroFluxGovernors(ns, faction, analytics) {

    const multiplersFile = "data/multipliers.txt";
    const multipliers = JSON.parse(ns.read(multiplersFile));

    const augmentName = "NeuroFlux Governor"

    let price = ns.singularity.getAugmentationPrice(augmentName);
    let moneyAvailable = ns.getServerMoneyAvailable("home");
    let augmentRepPrice = ns.singularity.getAugmentationRepReq(augmentName);
    let factionRep = ns.singularity.getFactionRep(faction);

    while (price < moneyAvailable) {
        if (factionRep < augmentRepPrice) {
            if (ns.singularity.getFactionFavor(faction) > (150 * multipliers.RepToDonateToFaction) && ns.fileExists("Formulas.exe")) {
                const repNeeded = augmentRepPrice - factionRep;
                let dollarsDonated = 0;
                let purchasedRep = 0;
                const player = ns.getPlayer();
                while (repNeeded > purchasedRep) {
                    dollarsDonated += 1_000_000;
                    purchasedRep = ns.formulas.reputation.repFromDonation(dollarsDonated, player);
                }

                analytics.moneySpent.repPurchased += dollarsDonated;
                ns.singularity.donateToFaction(faction, dollarsDonated);
            } else {
                break;
            }
        }

        factionRep = ns.singularity.getFactionRep(faction);

        if (factionRep > augmentRepPrice) {
            analytics.moneySpent.fluxGovernors += price;
            ns.singularity.purchaseAugmentation(faction, augmentName);
        }

        price = ns.singularity.getAugmentationPrice(augmentName);
        moneyAvailable = ns.getServerMoneyAvailable("home");
        augmentRepPrice = ns.singularity.getAugmentationRepReq(augmentName);
    }
}

function upgradeHomeMachine(ns, analytics) {
    const home = "home";
    const ramCost = ns.singularity.getUpgradeHomeRamCost();
    const coreCost = ns.singularity.getUpgradeHomeCoresCost();
    const moneyAvailable = ns.getServerMoneyAvailable(home);
    const orginalSpecs = ns.getServer(home);

    if (ramCost > moneyAvailable && coreCost > moneyAvailable) {
        return;
    }

    if (ramCost > coreCost) {
        analytics.moneySpent.homeCores += coreCost;
        ns.singularity.upgradeHomeCores();
    } else {
        analytics.moneySpent.homeRam += ramCost;
        ns.singularity.upgradeHomeRam();
    }

    const upgradedServer = ns.getServer(home);

    analytics.amountOfRamIncrease += upgradedServer.maxRam - orginalSpecs.maxRam;
    analytics.amountOfCoresIncrease += upgradedServer.cpuCores - orginalSpecs.cpuCores;

    return upgradeHomeMachine(ns, analytics);
}

function purchaseAug(ns, augment, analytics) {
    const ownedAugments = ns.singularity.getOwnedAugmentations(true);
    const augmentName = augment.augmentName;

    if (ownedAugments.includes(augmentName) === false) {
        const augmentPrice = ns.singularity.getAugmentationPrice(augmentName);
        const amountOfMoneyWeHave = ns.getServerMoneyAvailable("home")

        if (augmentPrice < amountOfMoneyWeHave) {
            analytics.moneySpent.augments += augmentPrice;
            if (!analytics.augsBought) {
                analytics.augsBought = [];
            }
            analytics.augsBought.push(augmentName)

            ns.singularity.purchaseAugmentation(augment.faction, augmentName);
        }
    }
}


class EndOfRoundAnalytics {
    firstStarted = new Date();

    firstEncounterOfRepTrigger;
    repTrigger;

    firstEncoundedMoneyTrigger;
    moneyTrigger;

    augsBought = [];

    amountOfRamIncrease
    amountOfCoresIncrease

    moneySpent = new MoneySpent();

    moneyLeft = 0;
    lastSaved;
}

class MoneyTrigger {
    estimatedIncomeTriggered;
    moneyIsGreaterThanTriggered;

    estimatedIncomeForTheNextFourHours;
    moneyRightNow;
    buyArgumentsWhenWeHave;

    time = new Date();
}

class MoneySpent {

    augments = 0;
    homeCores = 0;
    homeRam = 0;
    fluxGovernors = 0;
    repPurchased = 0;
}

class RepTrigger {
    maximumAugRepNeeded;
    currentFactionRep;

    time = new Date();
}

