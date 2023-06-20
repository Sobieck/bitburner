/** @param {NS} ns */
/// run scripts/scan.js dispatchScript
export async function main(ns) {
    const dispatchScript = ns.args[0];

    if (dispatchScript === undefined){
        ns.tprint("Must define dispatch script for scan.")
        return;
    }

    const result = new dataMonger(ns).scanEnvironment();

    ns.rm('data/enviroment.txt')
    ns.write('data/enviroment.txt', JSON.stringify(result), "W")

    ns.run(dispatchScript)
}

export class dataMonger {
    constructor(ns) {
        this.ns = ns;
    }

    scanEnvironment(machineToScan = "home", serversToScan = [], scannedServers = [], result = []) {
        if (serversToScan.length === 0 && machineToScan !== "home") {
            return result;
        }

        let lineage = result
            .find(x => x.name === machineToScan)
            ?.lineage
            .map(x => x); // so we aren't using a reference

        const scan = this.ns
            .scan(machineToScan)
            .map(x => new ServerNode(
                machineToScan,
                this.ns.getServer(x),
                lineage
            ));

        scan.forEach(x => {
            if (!scannedServers.includes(x.name) && !serversToScan.includes(x.name)) {
                serversToScan.push(x.name);
                result.push(x);
            }
        });

        scannedServers.push(machineToScan);
        machineToScan = serversToScan.pop();
        return this.scanEnvironment(machineToScan, serversToScan, scannedServers, result);
    }
}

class ServerNode {
    constructor(parentsName, server, lineage = []) {
        this.name = server.hostname;
        this.lineage = lineage
        if (parentsName !== "home" && this.lineage !== undefined) {
            if (!this.lineage.includes(parentsName)) {
                this.lineage.push(parentsName)
            }
        }

        this.server = server;
    }
}