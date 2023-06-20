//take an hours until payoff numberz

//hacknet

describe("calculateTimeLeftInSeconds", () => {
    it('should return 1000 seconds', () => {
        const result = calculateTimeLeftInSeconds(1, 0, 1);
        expect(result).toBe(1000);
    });

    it('should return 2000 seconds when changing goal', () => {
        const result = calculateTimeLeftInSeconds(2, 0, 1);
        expect(result).toBe(2000);
    });

    it('should return 2000 seconds when current goal', () => {
        const result = calculateTimeLeftInSeconds(3, 1, 1);
        expect(result).toBe(2000);
    });

    it('should return 150317 when using real numbers', () => {
        const result = calculateTimeLeftInSeconds(1000, 243, 5.036);
        expect(result).toBe(150317.71247021446);
    });
});


function calculateTimeLeftInSeconds(targetRepInThousands, currentRepInThousands, currentRepPerSecond) {
    const repLeftInThousands = targetRepInThousands - currentRepInThousands;
    const repLeftInSeconds = repLeftInThousands * 1000;

    return repLeftInSeconds / currentRepPerSecond;
}



describe("buy hacknet nodes", () => {
    it('not buy if not enough money', () => {
        const hacknet = new MockHackNet(2);
        const ns = new MockNs(25, hacknet);

        const result = buyHacknetNodeIfAboveBreakeven(ns, 400000);

        expect(ns.hostOfGetServerMoneyAvailable).toBe("home");
        expect(result).toBeFalsy();
        expect(hacknet.purchasedNode).toBeFalsy();
    });

    it('not buy if not enough time', () => {
        const hacknet = new MockHackNet(2);
        const ns = new MockNs(25, hacknet);

        hacknet.purchaseCost = 1;

        const result = buyHacknetNodeIfAboveBreakeven(ns, 2500);
        expect(ns.hostOfGetServerMoneyAvailable).toBe("home");
        expect(result).toBeFalsy();
        expect(hacknet.purchasedNode).toBeFalsy();
    });

    it('buy if enough money and time', () => {
        const hacknet = new MockHackNet(2);

        const ns = new MockNs(385461000 + 130000, hacknet);

        const nodeIndex = 12314

        hacknet.purchaseCost = 129000;
        hacknet.nodeIndex = nodeIndex;

        const result = buyHacknetNodeIfAboveBreakeven(ns, 400000);
        expect(result).toBeTruthy();

        expect(hacknet.purchasedNode).toBeTruthy();

        expect(hacknet.levelUpgradeInput.index).toBe(nodeIndex);
        expect(hacknet.levelUpgradeInput.number).toBe(199);

        expect(hacknet.ramUpgradeInput.index).toBe(nodeIndex);
        expect(hacknet.ramUpgradeInput.number).toBe(6);

        expect(hacknet.coreUpgradeInput.index).toBe(nodeIndex);
        expect(hacknet.coreUpgradeInput.number).toBe(15);

    });
});


function buyHacknetNodeIfAboveBreakeven(ns, secondsLeft) {
    const fixedCostOfFullyUpgradedNode = 385461000;
    const variableCost = ns.hacknet.getPurchaseNodeCost();
    const totalCost = variableCost + fixedCostOfFullyUpgradedNode;

    const moneyToInvest = ns.getServerMoneyAvailable("home");

    if (totalCost > moneyToInvest) {
        return false;
    }

    const revPerSecond = 9736;
    const expectedValue = secondsLeft * revPerSecond;

    if (expectedValue < totalCost) {
        return false;
    }

    const indexOfNode = ns.hacknet.purchaseNode();
    ns.hacknet.upgradeLevel(indexOfNode, 199);
    ns.hacknet.upgradeRam(indexOfNode, 6);
    ns.hacknet.upgradeCore(indexOfNode, 15);

    return true;
}

class MockNs {
    constructor(moneyAvailable, hacknet) {
        this.moneyAvailable = moneyAvailable;
        this.costOfAdditionalServer = 20;
        this.hostOfGetServerMoneyAvailable = "";
        this.hacknet = hacknet;
        this.purchasedNode = false;
    }

    getServerMoneyAvailable(host) {
        this.hostOfGetServerMoneyAvailable = host;
        return this.moneyAvailable;
    }
}

class MockHackNet {
    constructor(purchaseCost) {
        this.purchaseCost = purchaseCost;
        this.levelUpgradeInput = {};
        this.nodeIndex = 0;
    }

    getPurchaseNodeCost() {
        return this.purchaseCost;
    }

    purchaseNode() {
        this.purchasedNode = true;
        return this.nodeIndex;
    }

    upgradeLevel(index, number) {
        this.levelUpgradeInput = { index, number };
    }

    upgradeRam(index, number) {
        this.ramUpgradeInput = { index, number };

    }

    upgradeCore(index, number) {
        this.coreUpgradeInput = { index, number };
    }
}