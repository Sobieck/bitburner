export async function main(ns) {
    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const organizationTextFileName = "data/organizations.txt";
    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);

    const toJoin = ["CSEC", "I.I.I.I", "avmnite-02h", "Chongqing", "run4theh111z", "ecorp", "Tian Di Hui", "Daedalus", "BitRunners", "The Black Hand", "Netburners", "Illuminati", "The Covenant", "Blade Industries"]; //?? Bachman instead of Ecorp? 
    const lowPriority = ["Chongqing", "Tian Di Hui", "Netburners"];

    const factionInvitations = ns.singularity.checkFactionInvitations();
    const moneyAvailable = ns.getServerMoneyAvailable("home");


    if (!ownedAugmentations.includes('Neuregen Gene Modification')) {
        if (moneyAvailable > 1_000_000_000) {
            if (ns.singularity.getFactionRep("Chongqing") === 0) {
                ns.singularity.travelToCity("Chongqing");
            }
        }
    } else if (!ownedAugmentations.includes("CashRoot Starter Kit")) {
        toJoin.push("Sector-12");
        lowPriority.push("Sector-12");
    } else if (moneyAvailable > 1_000_000_000 && ns.singularity.getFactionRep("Tian Di Hui") === 0) {
        if (ns.singularity.getFactionRep("Chongqing") === 0) {
            ns.singularity.travelToCity("Chongqing");
        }
    }

    const organzations = { toJoin, lowPriority };

    ns.rm(organizationTextFileName);
    ns.write(organizationTextFileName, JSON.stringify(organzations), "W");

    for (const orgServerName of organzations.toJoin) {

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