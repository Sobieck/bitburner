export async function main(ns) {

    const ownedAugmentations = ns.singularity.getOwnedAugmentations(false);
    const includesRedPill = ownedAugmentations.includes("The Red Pill");
    const currentHackingLevel = ns.getHackingLevel();
    const orgServerName = "w0r1d_d43m0n";

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const serverWithLineage = enviroment.find(x => x.name === orgServerName);

    if (includesRedPill && currentHackingLevel > serverWithLineage.server.requiredHackingSkill) {
        const helper = new Helpers(ns);
        helper.hackMachine(orgServerName);

        if (serverWithLineage && serverWithLineage.server.hasAdminRights) {
            for (const server of serverWithLineage.lineage) {
                await ns.singularity.connect(server);
            }

            await ns.singularity.connect(orgServerName);
            await ns.singularity.installBackdoor();
        }


        ns.singularity.destroyW0r1dD43m0n(4, 'scripts/coordinator.js');
    }
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

        if (hostname !== "home") {
            this.ns
                .ls(hostname, '.js')
                .map(y => this.ns.rm(y, hostname))
        }
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