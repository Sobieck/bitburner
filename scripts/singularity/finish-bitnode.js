export async function main(ns) {

    const ownedAugmentations = ns.singularity.getOwnedAugmentations(false);
    const includesRedPill = ownedAugmentations.includes("The Red Pill");
    const currentHackingLevel = ns.getHackingLevel();
    const orgServerName = "w0r1d_d43m0n";

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const serverWithLineage = enviroment.find(x => x.name === orgServerName);

    if (includesRedPill && currentHackingLevel > serverWithLineage.server.requiredHackingSkill) {
        if (serverWithLineage && serverWithLineage.server.hasAdminRights) {
            for (const server of serverWithLineage.lineage) {
                await ns.singularity.connect(server);
            }

            await ns.singularity.connect(orgServerName);
            await ns.singularity.installBackdoor();
        }


        ns.singularity.destroyW0r1dD43m0n(8, 'scripts/coordinator.js'); // 3 (corps) - 5 (formula.exe + int passive) - 10 (new) 
    }
}
