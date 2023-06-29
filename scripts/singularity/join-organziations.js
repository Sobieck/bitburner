export async function main(ns) {
    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const organizationsToJoin = ["CSEC", "I.I.I.I", "avmnite-02h", "run4theh111z", "ecorp"];
    const factionInvitations = ns.singularity.checkFactionInvitations();

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

        if (factionInvitations.includes(serverWithLineage.server.organizationName)) {
            await ns.singularity.joinFaction(serverWithLineage.server.organizationName);
        }
    }
}