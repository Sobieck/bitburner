export async function main(ns) {
    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));

    const toJoin = ["CSEC", "I.I.I.I", "avmnite-02h", "Chongqing", "run4theh111z", "ecorp", "Tian Di Hui", "Daedalus", "BitRunners", "The Black Hand", "Netburners", "Illuminati", "Blade Industries", "OmniTek Incorporated", "NWO", "Aevum", "Volhaven", "New Tokyo", "Ishima", "Bachman & Associates"]; //"The Covenant"
    const lowPriority = ["Chongqing", "Tian Di Hui", "Netburners", "Aevum", "Volhaven", "New Tokyo", "Ishima", "Sector-12"];

    const factionInvitations = ns.singularity.checkFactionInvitations();

    const organzations = { toJoin, lowPriority };

    const organizationTextFileName = "data/organizations.txt";
    ns.rm(organizationTextFileName);
    ns.write(organizationTextFileName, JSON.stringify(organzations), "W");

    for (const orgServerName of organzations.toJoin) {

        for (const serverWithLineage of enviroment) {

            if (serverWithLineage && factionInvitations.includes(serverWithLineage.server.organizationName)) {
                await ns.singularity.joinFaction(serverWithLineage.server.organizationName);
            }


            if (factionInvitations.includes(orgServerName)) {
                await ns.singularity.joinFaction(orgServerName);
            }
        }
    }
}