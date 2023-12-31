export async function main(ns) {
    if (!ns.gang.inGang()) {
        return;
    }

    const gangFile = 'data/gang.txt';
    const gang = JSON.parse(ns.read(gangFile));

    const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
    let stockMarketReserveMoney = new ReserveForTrading();
    if (ns.fileExists(stockMarketReserveMoneyFile)) {
        stockMarketReserveMoney = new ReserveForTrading(JSON.parse(ns.read(stockMarketReserveMoneyFile)));
    }

    const equipmentNames = ns.gang.getEquipmentNames();
    const equipments = [];

    const currentEarnedRespectHighWaterMark = gang.memberNextToAscend.earnedRespect;

    for (const equipmentName of equipmentNames) {
        equipments.push({
            name: equipmentName,
            cost: ns.gang.getEquipmentCost(equipmentName),
            type: ns.gang.getEquipmentType(equipmentName),
            stats: ns.gang.getEquipmentStats(equipmentName)
        })
    }

    const basicLoadOut = ["Baseball Bat", "Bulletproof Vest", "Ford Flex V20"];

    if (currentEarnedRespectHighWaterMark < 600_000) {
        for (const member of gang.members) {
            if (member.def_asc_points > 0) {
                continue;
            }

            for (const equipName of basicLoadOut) {
                const equipmentToBuy = equipments.find(x => x.name === equipName);

                if (!member.upgrades.includes(equipName)) {
                    if (stockMarketReserveMoney.canSpend(ns, equipmentToBuy.cost)) {
                        ns.gang.purchaseEquipment(member.name, equipName);
                    }
                }
            }
        }
    } else {
        const armThoseWithXRespectOrLower = currentEarnedRespectHighWaterMark * .75;

        for (const member of gang.members) {
            if(member.earnedRespect > armThoseWithXRespectOrLower){
                continue;
            }

            for (const equipment of equipments.filter(x => x.type !== "Rootkit" && x.type !== "Augmentation")) {
                if (!member.upgrades.includes(equipment.name)) {
                    if (stockMarketReserveMoney.canSpend(ns, equipment.cost)) {
                        ns.gang.purchaseEquipment(member.name, equipment.name);
                    }
                }
            }
        }
    }
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

        if (canSpend === false) {
            this.requestMoney(ns, moneyNeeded);
        } else {
            this.moneyRequested = new Map(Array.from(this.moneyRequested));

            const nameOfRequest = "gang-equipement";
            this.moneyRequested.delete(nameOfRequest);
            const stockMarketReserveMoneyFile = "data/stockMarketReserveMoney.txt";
            ns.rm(stockMarketReserveMoneyFile);
            ns.write(stockMarketReserveMoneyFile, JSON.stringify(this), "W");
        }

        return canSpend;
    }

    requestMoney(ns, amount) {

        const nameOfRequest = "gang-equipement";
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
