export async function main(ns) {

    const ownedAugmentations = ns.singularity.getOwnedAugmentations(false);
    if(ownedAugmentations.includes("The Red Pill")){
        ns.singularity.destroyW0r1dD43m0n(4, 'scripts/coordinator.js');
    }
}