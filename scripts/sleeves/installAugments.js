export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    for (const sleeve of sleevesData.sleeves) {
        if (sleeve.shock > 0 || (sleeve.task && (sleeve.task.type === "CRIME" || sleeve.actionTaken === 'DoCrime'))) {
            continue;
        }

        let filterToUse = allowNoneFilter;

        let moneyOnHome = ns.getServerMoneyAvailable("home");
        if (moneyOnHome > 30_000_000_000_000) {
            filterToUse = universalFilter;
        } else {
            if (sleeve.task && sleeve.task.factionWorkType === ns.enums.FactionWorkType.hacking) {
                filterToUse = hackingFilter;
            }

            if (sleeve.task && sleeve.task.type === "COMPANY") {
                filterToUse = companyFilter;
            }

            if (sleeve.task && sleeve.task.classType === ns.enums.UniversityClassType.leadership) {
                filterToUse = leadershipFilter;
            }

            if (sleeve.task && sleeve.task.classType === ns.enums.UniversityClassType.algorithms) {
                filterToUse = hackingFilter;
            }

            if (sleeve.task && sleeve.task.classType === ns.enums.GymType.agility) {
                filterToUse = agilityFilter;
            }

            if (sleeve.task && sleeve.task.classType === ns.enums.GymType.defense) {
                filterToUse = defenseFilter;
            }

            if (sleeve.task && sleeve.task.classType === ns.enums.GymType.dexterity) {
                filterToUse = dexterityFilter;
            }

            if (sleeve.task && sleeve.task.classType === ns.enums.GymType.strength) {
                filterToUse = strengthFilter;
            }
        }

        const buyableAugment = ns.sleeve
            .getSleevePurchasableAugs(sleeve.name)
            .map(x => {
                const stats = ns.singularity.getAugmentationStats(x.name)

                return {
                    name: x.name,
                    cost: x.cost,
                    stats
                }
            })
            .filter(filterToUse)
            .sort((a, b) => b.cost - a.cost)
            .pop();


        if (buyableAugment === undefined) {
            continue;
        }

        const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
        let stockMarketReserveMoney = new ReserveForTrading();
        if (ns.fileExists(stockMarketReserveMoneyFile)) {
            stockMarketReserveMoney = new ReserveForTrading(JSON.parse(ns.read(stockMarketReserveMoneyFile)));
        }

        if (stockMarketReserveMoney.canSpend(ns, buyableAugment.cost)) {
            ns.sleeve.purchaseSleeveAug(sleeve.name, buyableAugment.name);
            break;
        }
    }
}

function universalFilter(x) {
    return true;
}

function allowNoneFilter(x) {
    return false;
}

function leadershipFilter(x) {
    return x.stats.charisma_exp > 1 ||
        x.stats.charisma > 1;
}

function defenseFilter(x) {
    return x.stats.defense > 1 ||
        x.stats.dexterity_exp > 1;
}

function dexterityFilter(x) {
    return x.stats.dexterity > 1 ||
        x.stats.dexterity_exp > 1 ||
        x.stats.crime_success > 1 ||
        x.stats.crime_money > 1
}

function strengthFilter(x) {
    return x.stats.strength > 1 ||
        x.stats.strength_exp > 1;
}

function agilityFilter(x) {
    return x.stats.agility > 1 ||
        x.stats.agility_exp > 1
}

function companyFilter(x) {
    return x.stats.company_rep > 1 ||
        x.stats.work_money > 1 ||
        x.stats.charisma_exp > 1 ||
        x.stats.charisma > 1 ||
        x.stats.hacking_chance > 1 ||
        x.stats.hacking_speed > 1 ||
        x.stats.hacking_money > 1 ||
        x.stats.hacking_grow > 1 ||
        x.stats.hacking > 1 ||
        x.stats.hacking_exp > 1;
}

function hackingFilter(x) {
    return x.stats.hacking_chance > 1 ||
        x.stats.hacking_speed > 1 ||
        x.stats.hacking_money > 1 ||
        x.stats.hacking_grow > 1 ||
        x.stats.hacking > 1 ||
        x.stats.hacking_exp > 1 ||
        x.stats.faction_rep > 1;
}


class ReserveForTrading {
    stockMarketReserveMoneyLimit = 1_500_000_000_000;
    capitalToReserveForTrading = 500_000_000;
    moneyInvested = 0;
    moneyRequested = new Map();
    countOfVisitedWithoutFillingRequest = 0;

    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    setMoneyInvested(moneyInvested, ns) {
        this.moneyInvested = moneyInvested;

        const potentialCapitalReserve = moneyInvested / 2;

        this.capitalToReserveForTrading = Math.max(...[potentialCapitalReserve, this.capitalToReserveForTrading]);

        if (this.capitalToReserveForTrading > this.stockMarketReserveMoneyLimit) {
            this.capitalToReserveForTrading = this.stockMarketReserveMoneyLimit;
        }

        this.countOfVisitedWithoutFillingRequest++;
    }

    canSpend(ns, moneyNeeded) {
        const moneyOnHome = ns.getServerMoneyAvailable("home");

        let moneyToSaveForTrading = this.capitalToReserveForTrading - this.moneyInvested;

        if (moneyToSaveForTrading < 0) {
            moneyToSaveForTrading = 0;
        }

        if (moneyToSaveForTrading > this.stockMarketReserveMoneyLimit) {
            moneyToSaveForTrading = this.stockMarketReserveMoneyLimit;
        }

        const canSpend = moneyNeeded < moneyOnHome - moneyToSaveForTrading
        // ns.tprint(`${canSpend} = ${moneyNeeded} < ${moneyOnHome} - ${moneyToSaveForTrading}`)
        if (canSpend === false) {
            this.requestMoney(ns, moneyNeeded);
        } else {
            const debugInfor = { moneyOnHome, moneyNeeded, moneyToSaveForTrading, canSpend }
            // ns.write(`data/canpuchase${new Date().toJSON().replaceAll(".", "")}.txt`, JSON.stringify(debugInfor), "W")
            this.moneyRequested = new Map(Array.from(this.moneyRequested));

            const nameOfRequest = "purchase-server";
            this.moneyRequested.delete(nameOfRequest);
            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
        }

        return canSpend;
    }

    requestMoney(ns, amount) {
        const nameOfRequest = "purchase-server";
        this.moneyRequested = new Map(Array.from(this.moneyRequested));

        const moneyRequestedPreviously = this.moneyRequested.get(nameOfRequest);
        if (moneyRequestedPreviously) {
            if (moneyRequestedPreviously < amount) {
                this.moneyRequested.set(nameOfRequest, amount);
                this.moneyRequested = Array.from(this.moneyRequested);

                const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
                ns.rm(stockMarketReserveMoneyFile);
                ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
            }
        } else {
            this.moneyRequested.set(nameOfRequest, amount);
            this.moneyRequested = Array.from(this.moneyRequested);

            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
        }
    }
}