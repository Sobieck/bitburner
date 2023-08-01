export async function main(ns) {

    const ownedAugmentations = ns.singularity.getOwnedAugmentations(false);
    const includesRedPill = ownedAugmentations.includes("The Red Pill");
    const currentHackingLevel = ns.getHackingLevel();
    const endgameServer = "w0r1d_d43m0n";

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const serverWithLineage = enviroment.find(x => x.name === endgameServer);

    if (includesRedPill && currentHackingLevel > serverWithLineage.server.requiredHackingSkill) {
        if (serverWithLineage && serverWithLineage.server.hasAdminRights) {
            for (const server of serverWithLineage.lineage) {
                await ns.singularity.connect(server);
            }

            await ns.singularity.connect(endgameServer);
            await ns.singularity.installBackdoor();
        }


        ns.singularity.destroyW0r1dD43m0n(10, 'scripts/coordinator.js'); // 10 (new mechanic) 
    }
}
