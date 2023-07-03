export async function main(ns) {

    const ownedAugmentations = ns.singularity.getOwnedAugmentations(false);
    const includesHVMind = ownedAugmentations.includes("ECorp HVMind Implant");

    if (!includesHVMind) {
        return;
    }

    const player = ns.getPlayer();
    const currentWork = ns.singularity.getCurrentWork();

    if (!player.factions.includes("The Covenant") && (!currentWork || currentWork.type === "CLASS")) {
        
        // if(doExersizeIfAppropriate(player.skills.agility, currentWork, ns, 'agi')){
        //     return;
        // }

        // if(doExersizeIfAppropriate(player.skills.defense, currentWork, ns, 'def')){
        //     return;
        // }

        // if(doExersizeIfAppropriate(player.skills.strength, currentWork, ns, 'str')){
        //     return;
        // }

        // if(doExersizeIfAppropriate(player.skills.dexterity, currentWork, ns, 'dex')){
        //     return;
        // }
    }
}

function doExersizeIfAppropriate(skill, currentWork, ns, type) {
    const targetForAttributes = 850;
    if (skill < targetForAttributes) {
        if (!currentWork || currentWork.classType !== type) {
            ns.singularity.gymWorkout("powerhouse gym", type, true);
        }
        return true;
    }

    return false;
}
