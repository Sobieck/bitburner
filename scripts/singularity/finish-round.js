let incomePerHourEstimate;

export async function main(ns) {

    const factionToMaxFile = "data/factionToMax.txt";
    const factionDonationFile = 'data/factionDonatation.txt'
    const incomeEveryMinuteObservationsFile = 'data/incomeEveryMinuteForTheLast30Minutes.txt'

    let factionToMax;

    let incomeObservations = [];
    const lastObservation = new Date();
    let lastObservationRecordedMoney;

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
        const totalIncomeSinceAugInstall = ns.getMoneySources().sinceInstall.total;

        incomeObservations.push(totalIncomeSinceAugInstall);

        if (incomeObservations.length > 59) {
            const totalIncome30MinutesAgo = incomeObservations.shift();

            const incomePerMinute = (totalIncomeSinceAugInstall - totalIncome30MinutesAgo) / 60;
            incomePerHourEstimate = incomePerMinute * 60;
        }

        ns.rm(incomeEveryMinuteObservationsFile);
        ns.write(incomeEveryMinuteObservationsFile, JSON.stringify({ incomeObservations, lastObservation }), "W");
    }

    if (ns.fileExists(factionToMaxFile) || ns.fileExists(factionDonationFile)) {
        if (ns.fileExists(factionToMaxFile)) {
            factionToMax = ns.read(factionToMaxFile);
        } else {
            factionToMax = ns.read(factionDonationFile);
        }
    } else {
        return;
    }

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

    const currentFactionRep = ns.singularity.getFactionRep(targetFaction.faction)

    const currentFavor = ns.singularity.getFactionFavor(targetFaction.faction);
    const favorNeeded = 150 - currentFavor;

    let targetRep = 700_000;
    if (ns.fileExists("Formulas.exe")) {
        targetRep = ns.formulas.reputation.calculateFavorToRep(favorNeeded)
    }

    if (targetFaction.maximumAugRep < currentFactionRep || targetRep < currentFactionRep || (ns.fileExists(factionDonationFile) && !ns.fileExists(factionToMaxFile))) {

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


        let buyAugmentsWhenWeHaveMoreThanThisMuchMoney = priceOfMostExpensiveAugment * 100;

        if (targetFaction.faction === "CyberSec") {
            buyAugmentsWhenWeHaveMoreThanThisMuchMoney = priceOfMostExpensiveAugment * 10;
        }

        const estimatedIncomeForTheNextFourHours = incomePerHourEstimate * 4;

        const moneyAvailable = ns.getServerMoneyAvailable("home");

        const moneyFormatted = formatter.format(incomePerHourEstimate);

        if (moneyFormatted !== "$NaN") {
            const hoursTillInstall = Math.floor(buyAugmentsWhenWeHaveMoreThanThisMuchMoney / incomePerHourEstimate);
            ns.toast(`Income Per Hour Estimate: ${moneyFormatted}. ~Hours to install: ${hoursTillInstall}`, "success", 180000)
        }

        if (estimatedIncomeForTheNextFourHours > buyAugmentsWhenWeHaveMoreThanThisMuchMoney || moneyAvailable > buyAugmentsWhenWeHaveMoreThanThisMuchMoney) {

            const stopInvestingFileName = "stopInvesting.txt";
            if (!ns.fileExists(stopInvestingFileName)) {
                ns.write(stopInvestingFileName, buyAugmentsWhenWeHaveMoreThanThisMuchMoney, "W")
                return;
            } 
            
            if (moneyAvailable > buyAugmentsWhenWeHaveMoreThanThisMuchMoney || moneyAvailable > 1_000_000_000_000_000) {
                const stopStockTradingFileName = "stopTrading.txt";
                if (!ns.fileExists(stopStockTradingFileName)) {
                    ns.write(stopStockTradingFileName, "", "W")
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

                const targetFactionsAugments = factionsWithAugmentsToBuy.find(x => x.faction === targetFaction.faction);

                for (const augmentData of targetFactionsAugments.factionAugmentsThatIDontOwnAndCanAfford) {
                    purchaseAug(ns, targetFactionsAugments.faction, augmentData.augmentName, augmentData.prereqs, purchasableAugments);
                }

                const augmentsLeft = Array.from(purchasableAugments.entries());

                for (const augmentData of augmentsLeft) {
                    const augment = augmentData[0];
                    const data = augmentData[1];

                    purchaseAug(ns, data.faction, augment, data.prereqs, purchasableAugments);
                }

                upgradeHomeMachine(ns);

                const factionsByRating = factionsWithAugmentsToBuy.sort((a, b) => b.factionRep - a.factionRep);

                purchaseNeuroFluxGovernors(ns, factionsByRating[0].faction);

                ns.singularity.installAugmentations('scripts/coordinator.js')
            }
        }
    }
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

function purchaseNeuroFluxGovernors(ns, faction) {
    const augmentName = "NeuroFlux Governor"
    const price = ns.singularity.getAugmentationPrice(augmentName);
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    const augmentRepPrice = ns.singularity.getAugmentationRepReq(augmentName);
    let factionRep = ns.singularity.getFactionRep(faction);

    if (moneyAvailable > price) {
        if (factionRep < augmentRepPrice) {
            if (ns.fileExists("Formulas.exe")) {
                const repNeeded = augmentRepPrice - factionRep;
                let dollarsDonated = 0;
                let purchasedRep = 0;
                while (repNeeded > purchasedRep) {
                    dollarsDonated += 1_000_000;
                    purchasedRep = ns.formulas.reputation.repFromDonation(dollarsDonated, player);
                }

                ns.singularity.donateToFaction(faction, dollarsDonated);
            }
        }

        factionRep = ns.singularity.getFactionRep(faction);

        if (factionRep > augmentRepPrice) {
            ns.singularity.purchaseAugmentation(faction, augmentName);
        }

    } else {
        return;
    }

    purchaseNeuroFluxGovernors(ns, faction);
}

function upgradeHomeMachine(ns) {
    const ramCost = ns.singularity.getUpgradeHomeRamCost();
    const coreCost = ns.singularity.getUpgradeHomeCoresCost();
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (ramCost > moneyAvailable && coreCost > moneyAvailable) {
        return;
    }

    if (ramCost > coreCost) {
        ns.singularity.upgradeHomeCores();
    } else {
        ns.singularity.upgradeHomeRam();
    }

    return upgradeHomeMachine(ns);
}

function purchaseAug(ns, faction, augmentName, prereqs, purchasableAugments) {
    const ownedAugments = ns.singularity.getOwnedAugmentations(true)

    if (ownedAugments.includes(augmentName) === false) {
        for (const prereq of prereqs) {
            if (!ownedAugments.includes(prereq)) {
                const prereqAugment = purchasableAugments.get(prereq);
                if (prereqAugment) {
                    purchaseAug(ns, prereqAugment.faction, prereq, prereqAugment.prereqs, purchasableAugments);
                }
            }
        }

        if (ns.singularity.getAugmentationPrice(augmentName) < ns.getServerMoneyAvailable("home")) {
            ns.singularity.purchaseAugmentation(faction, augmentName);
            purchasableAugments.delete(augmentName);
        }
    }
}
