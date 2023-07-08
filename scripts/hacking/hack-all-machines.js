export async function main(ns) {

    const helpers = new Helpers(ns);

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));

    const portsWeCanPop = helpers.numberOfPortsWeCanPop();
    const currentHackingLevel = ns.getHackingLevel();

    const allHackableMachines = enviroment
        .filter(x => x.server.requiredHackingSkill < currentHackingLevel)
        .filter(x => x.server.numOpenPortsRequired <= portsWeCanPop || x.server.purchasedByPlayer);

    allHackableMachines
        .filter(x => !x.server.hasAdminRights)
        .map(x => helpers.hackMachine(x.name));
}

export class Helpers {
    constructor(ns) {
        this.ns = ns;
    }

    hackMachine(hostname) {
        if (this.fileExists("BruteSSH.exe")) {
            this.ns.brutessh(hostname);
        }

        if (this.fileExists("FTPCrack.exe")) {
            this.ns.ftpcrack(hostname);
        }

        if (this.fileExists("relaySMTP.exe")) {
            this.ns.relaysmtp(hostname)
        }

        if (this.fileExists("HTTPWorm.exe")) {
            this.ns.httpworm(hostname)
        }

        if (this.fileExists("SQLInject.exe")) {
            this.ns.sqlinject(hostname)
        }

        this.ns.nuke(hostname);
        this.ns.killall(hostname);
    }

    numberOfPortsWeCanPop() {
        let portsWeCanPop = 0;
        if (this.fileExists("BruteSSH.exe")) {
            portsWeCanPop++;
        }

        if (this.fileExists("FTPCrack.exe")) {
            portsWeCanPop++;
        }

        if (this.fileExists("relaySMTP.exe")) {
            portsWeCanPop++;
        }

        if (this.fileExists("HTTPWorm.exe")) {
            portsWeCanPop++;
        }

        if (this.fileExists("SQLInject.exe")) {
            portsWeCanPop++;
        }

        return portsWeCanPop;
    }

    fileExists(fileName) {
        return this.ns.fileExists(fileName, "home");
    }
}