
let backdooring = false;

export async function main(ns) {
    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    if(backdooring){
        return;
    }
    
    const machinesToBackdoorFirst = ["CSEC", "avmnite-02h", "I.I.I.I.", "run4theh111z"]

    for(const machineName of machinesToBackdoorFirst){
        if(await backdoorMachine(machineName, enviroment, ns)){
            return;
        }
    }

    for (const machineName of enviroment.map(x => x.name)) {
        if(await backdoorMachine(machineName, enviroment, ns)){
            return;
        }
    }
}

async function backdoorMachine (machineName, enviroment, ns){
    const serverWithLineage = enviroment.find(x => x.name === machineName)

    if (serverWithLineage && !serverWithLineage.server.backdoorInstalled && serverWithLineage.server.hasAdminRights && !serverWithLineage.server.purchasedByPlayer) {
        backdooring = true;
        for (const server of serverWithLineage.lineage) {
            await ns.singularity.connect(server);
        }

        await ns.singularity.connect(serverWithLineage.name);
        await ns.singularity.installBackdoor();
        await ns.singularity.connect("home");

        backdooring = false;
        return true;
    } 

    return false;

}