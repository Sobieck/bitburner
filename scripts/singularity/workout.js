export async function main(ns) {

    const ownedAugmentations = ns.singularity.getOwnedAugmentations(false);
    const includesHVMind = ownedAugmentations.includes("ECorp HVMind Implant");

    if (!includesHVMind) {
        return;
    }

    if(getBuffForFaction(ns, "The Covenant", 850)){
        return;
    } 

    if(getBuffForFaction(ns, "Illuminati", 1200)){
        return;
    }

    const currentWork = ns.singularity.getCurrentWork();
    if(currentWork && currentWork.type === "CLASS"){
        ns.singularity.stopAction();
    }

}

function getBuffForFaction(ns, faction, targetForAttributes){
    const player = ns.getPlayer();
    const currentWork = ns.singularity.getCurrentWork();

    if (!player.factions.includes(faction) && (!currentWork || currentWork.type === "CLASS")) {
        
        if(doExersizeIfAppropriate(player.skills.agility, currentWork, ns, ns.enums.GymType.agility, targetForAttributes)){
            return true;
        }

        if(doExersizeIfAppropriate(player.skills.defense, currentWork, ns, ns.enums.GymType.defense, targetForAttributes)){
            return true;
        }

        if(doExersizeIfAppropriate(player.skills.strength, currentWork, ns, ns.enums.GymType.strength, targetForAttributes)){
            return true;
        }

        if(doExersizeIfAppropriate(player.skills.dexterity, currentWork, ns, ns.enums.GymType.dexterity, targetForAttributes)){
            return true;
        }
    }
}

function doExersizeIfAppropriate(skill, currentWork, ns, type, targetForAttributes) {
    if (skill < targetForAttributes) {
        if (!currentWork || currentWork.classType !== type) {
            ns.singularity.travelToCity(ns.enums.CityName.Sector12);
            ns.singularity.gymWorkout(ns.enums.LocationName.Sector12PowerhouseGym, type, true);
        }
        return true;
    }

    return false;
}
