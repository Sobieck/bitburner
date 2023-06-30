export async function main(ns) {
    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const organizationsToJoin = ["CSEC", "I.I.I.I", "avmnite-02h", "Chongqing", "run4theh111z", "ecorp", "Tian Di Hui"];
    const factionInvitations = ns.singularity.checkFactionInvitations();
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    if (moneyAvailable > 1_000_000_000){
        ns.singularity.travelToCity("Chongqing");
    }

    for (const orgServerName of organizationsToJoin) {

        const serverWithLineage = enviroment.find(x => x.name === orgServerName);

        if (serverWithLineage && !serverWithLineage.server.backdoorInstalled && serverWithLineage.server.hasAdminRights) {
            for (const server of serverWithLineage.lineage) {
                await ns.singularity.connect(server);
            }

            await ns.singularity.connect(orgServerName);
            await ns.singularity.installBackdoor();
            await ns.singularity.connect("home");
        }

        if (serverWithLineage && factionInvitations.includes(serverWithLineage.server.organizationName)) {
            await ns.singularity.joinFaction(serverWithLineage.server.organizationName);
        }


        if (factionInvitations.includes(orgServerName)) {
            await ns.singularity.joinFaction(orgServerName);
        }
    }
}