let incomePerHourEstimate;
let updatedMoneyEstimate = false;

export async function main(ns) {
    if (!ns.stock.has4SDataTIXAPI() || !ns.corporation.hasCorporation() || ns.fileExists('data/juice.txt')) {
        return;
    }

    const factionToMaxFile = "data/factionToMax.txt";
    const factionDonationFile = 'data/factionDonatation.txt'
    const incomeEveryMinuteObservationsFile = 'data/incomeEveryMinuteForTheLast30Minutes.txt'

    let factionToMax;

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

    let analytics = new EndOfRoundAnalytics();
    const endOfRoundAnalyticsFile = "analytics/end-round.txt";
    if (ns.fileExists(endOfRoundAnalyticsFile)) {
        analytics = JSON.parse(ns.read(endOfRoundAnalyticsFile));
    }

    if (ns.fileExists(factionToMaxFile) || ns.fileExists(factionDonationFile)) {
        if (ns.fileExists(factionToMaxFile)) {
            factionToMax = ns.read(factionToMaxFile);

            if (!analytics.firstAssignFactionToMax) {
                analytics.firstAssignFactionToMax = new Date();
            }
        } else {
            factionToMax = ns.read(factionDonationFile);

            if (!analytics.firstAssignFactionToMaxViaDonation) {
                analytics.firstAssignFactionToMaxViaDonation = new Date();
            }
        }
    } else {
        return;
    }

    if (!analytics.factionsToMax.find(x => x.factionToMax === factionToMax)) {
        const firstTime = new Date();
        analytics.factionsToMax.push({ factionToMax, firstTime });
    }

    saveAnalytics(ns, analytics);

    const player = ns.getPlayer();

    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);

    const mostRepExpensiveForEachFaction = [];
    for (const faction of player.factions) {
        const maximumAugRep = Math.max(...ns
            .singularity
            .getAugmentationsFromFaction(faction)
            .filter(x => x !== "NeuroFlux Governor")
            .filter(x => !ownedAugmentations.includes(x))
            .map(x => ns.singularity.getAugmentationRepReq(x)));

        if (maximumAugRep > 0) {
            mostRepExpensiveForEachFaction.push({ faction, maximumAugRep });
        }
    }

    const targetFaction = mostRepExpensiveForEachFaction
        .filter(x => x.faction === factionToMax)
        .pop();

    setGoalAugment(ownedAugmentations, factionToMax, targetFaction, ns);

    if (ns.singularity.getOwnedAugmentations(true) !== ns.singularity.getOwnedAugmentations(false)) {
        ns.singularity.installAugmentations('scripts/coordinator.js')
    }
    const currentFactionRep = ns.singularity.getFactionRep(targetFaction.faction);
  

    if (!analytics.firstEncounterOfRepTrigger) {
        const repTrigger = populateRepTrigger(targetFaction, ns, factionDonationFile, factionToMaxFile);
        analytics.firstEncounterOfRepTrigger = repTrigger;
        saveAnalytics(ns, analytics);
    }

    if (targetFaction.maximumAugRep < currentFactionRep  || (ns.fileExists(factionDonationFile) && !ns.fileExists(factionToMaxFile))) {

        if (!analytics.repTrigger) {
            const repTrigger = populateRepTrigger(targetFaction, ns, factionDonationFile, factionToMaxFile);
            analytics.repTrigger = repTrigger;
            saveAnalytics(ns, analytics);
        }

        const factionsWithAugmentsToBuy =
            mostRepExpensiveForEachFaction
                .map(x => {
                    {
                        const faction = x.faction;
                        const factionRep = ns.singularity.getFactionRep(faction);
                        const factionAugmentsThatIDontOwnAndCanAfford = ns
                            .singularity
                            .getAugmentationsFromFaction(faction)
                            .filter(y => y !== "NeuroFlux Governor")
                            .filter(y => !ownedAugmentations.includes(y))
                            .filter(y => {
                                if (ownedAugmentations.length > 0) {
                                    return true;
                                } else { // on first install, we only want to install hacking and skill related. because it takes a long time to get the stock predictor and a company going. So it becomes prohibatively expensive to buy all the augments. 
                                    const stats = ns.singularity.getAugmentationStats(y);

                                    return stats.hacking_chance > 1 ||
                                        stats.hacking_speed > 1 ||
                                        stats.hacking_money > 1 ||
                                        stats.hacking_grow > 1 ||
                                        stats.hacking > 1 ||
                                        stats.hacking_exp > 1 ||
                                        stats.faction_rep > 1
                                }
                            })
                            .map(y => {
                                return {
                                    augmentName: y,
                                    augmentationRepCost: ns.singularity.getAugmentationRepReq(y),
                                    price: ns.singularity.getAugmentationPrice(y),
                                    prereqs: ns.singularity.getAugmentationPrereq(y)
                                }
                            })
                            .filter(y => y.augmentationRepCost < factionRep)
                            .sort((a, b) => b.price - a.price);

                        return {
                            faction,
                            factionRep,
                            factionAugmentsThatIDontOwnAndCanAfford
                        }
                    }
                });

        const priceOfMostExpensiveAugment = Math.max(...factionsWithAugmentsToBuy.find(x => x.faction === targetFaction.faction).factionAugmentsThatIDontOwnAndCanAfford.map(x => x.price));


        if (priceOfMostExpensiveAugment < 0) {
            return;
        }

        const purchasableAugments = new Map();

        for (const factionWithAugments of factionsWithAugmentsToBuy) {
            for (const augment of factionWithAugments.factionAugmentsThatIDontOwnAndCanAfford) {
                if (purchasableAugments.has(augment.augmentName) === false) {
                    const item = {
                        augmentationRepCost: augment.augmentationRepCost,
                        price: augment.price,
                        prereqs: augment.prereqs,
                        faction: factionWithAugments.faction
                    }
                    purchasableAugments.set(augment.augmentName, item)
                }
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

        const moneyAvailable = ns.getServerMoneyAvailable("home");

        const buyRepFile = 'data/buyRep.txt';
        if (moneyAvailable - moneyNeededForAugments > 3_000_000_000_000 && !ns.fileExists(buyRepFile)) {
            ns.write(buyRepFile, "", "W");
            return;
        }

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

                const factionsByRating = factionsWithAugmentsToBuy.sort((a, b) => b.factionRep - a.factionRep);

                purchaseNeuroFluxGovernors(ns, factionsByRating[0].faction, analytics, minRepToDonateToFaction);

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

function populateRepTrigger(targetFaction, ns, factionDonationFile, factionToMaxFile) {
    const repTrigger = new RepTrigger();
    repTrigger.factionDonationTrigger = ns.fileExists(factionDonationFile) && !ns.fileExists(factionToMaxFile);

    repTrigger.maximumAugRepNeeded = targetFaction.maximumAugRep;
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

function setGoalAugment(ownedAugmentations, factionToMax, targetFaction, ns) {
    const organizations = JSON.parse(ns.read("data/organizations.txt"));

    for (const stopAtAugment of organizations.stopAtAugments) {
        const goalAugment = stopAtAugment.augmentToStopAt;
        const goalFaction = stopAtAugment.faction;

        if (!ownedAugmentations.includes(goalAugment) && factionToMax === goalFaction) {
            targetFaction.maximumAugRep = ns.singularity.getAugmentationRepReq(goalAugment);
            break;
        }
    }
}

function purchaseNeuroFluxGovernors(ns, faction, analytics, minRepToDonateToFaction) {

    const augmentName = "NeuroFlux Governor"

    let price = ns.singularity.getAugmentationPrice(augmentName);
    let moneyAvailable = ns.getServerMoneyAvailable("home");
    let augmentRepPrice = ns.singularity.getAugmentationRepReq(augmentName);
    let factionRep = ns.singularity.getFactionRep(faction);

    while (price < moneyAvailable) {
        if (factionRep < augmentRepPrice) {
            if (ns.singularity.getFactionFavor(faction) > minRepToDonateToFaction && ns.fileExists("Formulas.exe")) {
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


    firstAssignFactionToMax;
    firstAssignFactionToMaxViaDonation;

    factionsToMax = [];

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

    factionRepGreaterThanMaximumAug;
    factionRepGreaterThanTargetToGetToFavorNeeded;
    factionDonationTrigger;


    maximumAugRepNeeded;
    currentFactionRep;

    time = new Date();
}