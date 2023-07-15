const backdooringFile = "data/backdooring.txt";
// run on n00dles continuously? that way we can maybe avoid the annoyingness on home of it going to other machiens. 
export async function main(ns) {
    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));

    if(ns.fileExists(backdooringFile)){
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
        
        ns.write(backdooringFile, JSON.stringify(new Date()), "W");
        
        for (const server of serverWithLineage.lineage) {
            await ns.singularity.connect(server);
        }

        await ns.singularity.connect(serverWithLineage.name);
        await ns.singularity.installBackdoor();
        await ns.singularity.connect("home");

        ns.rm(backdooringFile);
        return true;
    } 

    return false;

}