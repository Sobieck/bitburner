
let backdooring = false;

export async function main(ns) {
    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    if(backdooring){
        return;
    }

    for (const serverWithLineage of enviroment) {
        if (serverWithLineage && !serverWithLineage.server.backdoorInstalled && serverWithLineage.server.hasAdminRights && !serverWithLineage.server.purchasedByPlayer) {
            backdooring = true;
            for (const server of serverWithLineage.lineage) {
                await ns.singularity.connect(server);
            }
    
            await ns.singularity.connect(serverWithLineage.name);
            await ns.singularity.installBackdoor();
            await ns.singularity.connect("home");
            backdooring = false;
            break;
        } 
    }
}