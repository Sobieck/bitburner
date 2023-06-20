class MockNs {
    constructor(purchasedServerLimit, moneyAvailable) {
        this.purchasedServerLimit = purchasedServerLimit;
        this.moneyAvailable = moneyAvailable;
        this.deletedServers = [];
        this.purchasedServers = [];
        this.killedAll = [];
        this.hostOfGetServerMoneyAvailable = "";
    }

    getPurchasedServerLimit() {
        return this.purchasedServerLimit;
    };

    getServerMoneyAvailable(host) {
        this.hostOfGetServerMoneyAvailable = host;
        return this.moneyAvailable;
    }

    getPurchasedServerCost(ramToBuy) {
        if (ramToBuy === 1048576)
            return 57671680000;
        else {
            return 5767168000000
        }
    }

    deleteServer(host) {
        this.deletedServers.push(host);
    }

    purchaseServer(name, ramToBuy) {
        this.moneyAvailable -= 57671680000;
        this.purchasedServers.push({ name, ramToBuy });
    }

    killall(name) {
        this.killedAll.push(name);
    }
}

describe("replaceSmallMachinesWithMax", () => {
    let ns;
    let environment

    beforeEach(() => {
        environment = [{
            "name": "darkweb",
            "lineage": [],
            "server": {
                "hostname": "darkweb",
                "maxRam": 0,
                "purchasedByPlayer": false
            }
        },
        {
            "name": "Thomas",
            "lineage": [],
            "server": {
                "maxRam": 262144,
                "purchasedByPlayer": true,
            }
        },
        {
            "name": "Lisa",
            "lineage": [],
            "server": {
                "maxRam": 262144,
                "purchasedByPlayer": true,
            }
        },
        {
            "name": "Gidget",
            "lineage": [],
            "server": {
                "maxRam": 524288,
                "purchasedByPlayer": true,
            }
        },
        {
            "name": "darkweb2",
            "lineage": [],
            "server": {
                "hostname": "darkweb",
                "maxRam": 0,
                "purchasedByPlayer": false
            }
        }]
    });

    it("should do nothing if there are big servers.", () => {
        environment[1].server.maxRam = 1048576;
        environment[2].server.maxRam = 1048576;
        ns = new MockNs(3, 1000000000000);
        replaceSmallMachinesWithMax(ns, environment);
        expect(ns.deletedServers.length).toBe(0);
        expect(ns.purchasedServers.length).toBe(0);
    });

    describe("and there is enough money for 1", () => {
        beforeEach(() => {
            ns = new MockNs(3, 57671680000 + 1);
        });

        it("should delete Thomas and add a new one.", () => {
            replaceSmallMachinesWithMax(ns, environment);

            expect(ns.hostOfGetServerMoneyAvailable).toBe("home");
            expect(ns.deletedServers[0]).toBe("Thomas");
            expect(ns.purchasedServers[0].name).toContain("CLOUD");
            expect(ns.purchasedServers[0].ramToBuy).toBe(1048576);

            expect(ns.deletedServers.length).toBe(1);
            expect(ns.purchasedServers.length).toBe(1);
        });

        describe("and there are two small servers.", () => {
            it("should only delete one of those servers and buy one server.", () => {
                replaceSmallMachinesWithMax(ns, environment);

                expect(ns.deletedServers[0]).toBe("Thomas");
                expect(ns.purchasedServers[0].name).toContain("CLOUD");
                expect(ns.purchasedServers[0].ramToBuy).toBe(1048576);

                expect(ns.deletedServers.length).toBe(1);
                expect(ns.purchasedServers.length).toBe(1);
            });
        });
    });

    describe("and there is enough money for 2", () => {
        beforeEach(() => {
            ns = new MockNs(3, (57671680000 * 2) + 1);
        });

        it("should purchase two servers", () => {
            replaceSmallMachinesWithMax(ns, environment);

            expect(ns.deletedServers[0]).toBe("Thomas");
            expect(ns.deletedServers[1]).toBe("Lisa");
            expect(ns.purchasedServers[0].name).toContain("CLOUD");
            expect(ns.purchasedServers[0].ramToBuy).toBe(1048576);
            expect(ns.killedAll[0]).toBe("Thomas");
            expect(ns.killedAll[1]).toBe("Lisa");

            expect(ns.deletedServers.length).toBe(2);
            expect(ns.purchasedServers.length).toBe(2);
        });
    });


    describe("and there isn't enough money", () => {
        beforeEach(() => {
            ns = new MockNs(3, 57671680000 - 1);
        });

        it("shouldn't do anything", () => {
            replaceSmallMachinesWithMax(ns, environment);
            expect(ns.deletedServers.length).toBe(0);
            expect(ns.purchasedServers.length).toBe(0);
            expect(ns.killedAll.length).toBe(0);
        });
    })
});


function replaceSmallMachinesWithMax(ns, environment) {
    const ramToBuy = 1048576;
    const costOfRamToBuy = ns.getPurchasedServerCost(ramToBuy);

    environment
        .filter(x => x.server.purchasedByPlayer)
        .map(x => {
            const moneyAvailable = ns.getServerMoneyAvailable("home")

            if(moneyAvailable > costOfRamToBuy && x.server.maxRam < 524288){
                ns.killall(x.name);
                ns.deleteServer(x.name);
                const name = "CLOUD-" + String(Math.floor(Math.random()*(100000))).padStart(6, '0');
                ns.purchaseServer(name, 1048576);
            }
        });
}