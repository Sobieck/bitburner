export async function main(ns) {
    const toJoinInOrderInWhichIWantToComplete = [
        "CyberSec",
        "NiteSec",
        "The Black Hand",
        "Chongqing",
        "Bachman & Associates",
        "BitRunners",
        "Daedalus",
        "NWO",
        "OmniTek Incorporated",
        "Blade Industries",
        "ECorp",
    // "The Covenant",
        "Illuminati",
        "Aevum",
        "Volhaven",
        "New Tokyo",
        "Ishima",
        "Tian Di Hui",
        "Netburners",
    ];

    const companiesWeWantToBecomePartOf = [
        "Bachman & Associates", 
        "NWO", 
        "OmniTek Incorporated", 
        "Blade Industries", 
        "ECorp"
    ]; 

    const doNoWorkFor = [
        "Aevum",
        "Volhaven",
        "New Tokyo",
        "Ishima",
        "Tian Di Hui",
        "Netburners"
    ];

    const factionInvitations = ns.singularity.checkFactionInvitations();

    const organzations = { toJoinInOrderInWhichIWantToComplete, companiesWeWantToBecomePartOf, doNoWorkFor };

    const organizationTextFileName = "data/organizations.txt";
    ns.rm(organizationTextFileName);
    ns.write(organizationTextFileName, JSON.stringify(organzations), "W");

    for (const name of toJoinInOrderInWhichIWantToComplete) {
        if (factionInvitations.includes(name)) {
            await ns.singularity.joinFaction(name);
        }
    }
}