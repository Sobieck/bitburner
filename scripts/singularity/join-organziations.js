export async function main(ns) {
    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const organizationTextFileName = "data/organizations.txt";


    const toJoin = ["CSEC", "I.I.I.I", "avmnite-02h", "Chongqing", "run4theh111z", "ecorp", "Tian Di Hui", "Daedalus", "BitRunners", "The Black Hand", "Netburners", "Illuminati", "The Covenant", "Blade Industries", "OmniTek Incorporated", "NWO", "Aevum", "Volhaven", "New Tokyo", "Ishima"];
    const lowPriority = ["Chongqing", "Tian Di Hui", "Netburners", "Aevum", "Volhaven", "New Tokyo", "Ishima"];

    const factionInvitations = ns.singularity.checkFactionInvitations();
    const moneyAvailable = ns.getServerMoneyAvailable("home");
    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);

    if (travelToGetUniqueAugments(ns, "Neuregen Gene Modification", "Chongqing")) { } 
    else if (travelToGetUniqueAugments(ns, 'PCMatrix', "Aevum")) { }
    else if (!ownedAugmentations.includes("CashRoot Starter Kit")) {
        toJoin.push("Sector-12");
        lowPriority.push("Sector-12");
    } 
    else if (travelToGetUniqueAugments(ns, "DermaForce Particle Barrier", "Volhaven")) { }
    else if (travelToGetUniqueAugments(ns, "NutriGen Implant", "New Tokyo")) { }
    else if (travelToGetUniqueAugments(ns, "INFRARET Enhancement", "Ishima")) { }
    
    if (moneyAvailable > 10_000_000_000 && ns.singularity.getFactionRep("Tian Di Hui") === 0) {
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


function travelToGetUniqueAugments(ns, augmentWanted, city) {
    const moneyAvailable = ns.getServerMoneyAvailable("home");

    const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);
    if (!ownedAugmentations.includes(augmentWanted)) {
        if (moneyAvailable > 1_000_000_000) {
            if (ns.singularity.getFactionRep(city) === 0) {
                ns.singularity.travelToCity(city);
                return true;
            }
        }
        return false;
    }

}