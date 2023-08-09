export async function main(ns) {
    const toJoinInOrderInWhichIWantToComplete = [
        "CyberSec",
        "NiteSec",
        "Bachman & Associates",
        "NWO",
        "Blade Industries",
        "OmniTek Incorporated",
        "ECorp",
        "The Covenant",
        "Daedalus", 
        "Illuminati",
        "Chongqing",
        "The Black Hand",
        "BitRunners",
        "Aevum",
        "Volhaven",
        "New Tokyo",
        "Ishima",
        "Tian Di Hui",
        "Netburners",
        "Slum Snakes",
        "Tetrads",
        "Speakers for the Dead",
        "The Syndicate",
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
        "Netburners",
        "Slum Snakes",
        "Tetrads",
        "Speakers for the Dead",
        "The Syndicate",
    ];

    const stopAtAugments = [
        { final: true, faction: "Chongqing", augmentToStopAt: "Neuregen Gene Modification" },
        { final: true, faction: "NiteSec", augmentToStopAt: "Cranial Signal Processors - Gen III" },
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