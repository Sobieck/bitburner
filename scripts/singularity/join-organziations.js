export async function main(ns) {
    const toJoinInOrderInWhichIWantToComplete = [
        "CyberSec",
        "NiteSec",
        "Chongqing",
        "The Black Hand",
        "Bachman & Associates",
        "BitRunners",
        "Daedalus",
        "NWO",
        "OmniTek Incorporated",
        "Blade Industries",
        "ECorp",
        "The Covenant",
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

    const stopAtAugments = [
        { final: true, faction: "Chongqing", augmentToStopAt: "Neuregen Gene Modification" },
        { final: true, faction: "NiteSec", augmentToStopAt: "Cranial Signal Processors - Gen III" },
        { final: true, faction: "The Black Hand", augmentToStopAt: "Cranial Signal Processors - Gen IV" },
    ]

    const moneyAvailable = ns.getServerMoneyAvailable("home");
    if (moneyAvailable > 150_000_000) {
        toJoinInOrderInWhichIWantToComplete.push("Sector-12");
        doNoWorkFor.push("Sector-12");
    }

    const factionInvitations = ns.singularity.checkFactionInvitations();

    const organzations = { toJoinInOrderInWhichIWantToComplete, companiesWeWantToBecomePartOf, doNoWorkFor, stopAtAugments };

    const organizationTextFileName = "data/organizations.txt";
    ns.rm(organizationTextFileName);
    ns.write(organizationTextFileName, JSON.stringify(organzations), "W");

    for (const name of toJoinInOrderInWhichIWantToComplete) {
        if (factionInvitations.includes(name)) {
            await ns.singularity.joinFaction(name);
        }
    }
}