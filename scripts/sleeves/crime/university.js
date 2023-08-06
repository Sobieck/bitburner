export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const actionName = "CrimeTrain";
    const classTypeOfWork = "CLASS";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    for (let sleeve of sleevesData.sleeves) {
        if (!currentActionsPriority.who.includes(sleeve.name)) {
            continue;
        }

        const jobsWithHigherPriority = sleevesData
            .priorities
            .filter(x => x.who.includes(sleeve.name) && x.priority < currentActionsPriority.priority);

        if (jobsWithHigherPriority.find(x => x.actionName === sleeve.actionTaken)) {
            continue;
        }

        if (sleeve.allCrimesChancesMaxed) {
            continue;
        }

        if (sleeve.lowestStage.typeOfTraining === ns.enums.GymType.strength ||
            sleeve.lowestStage.typeOfTraining === ns.enums.GymType.defense ||
            sleeve.lowestStage.typeOfTraining === ns.enums.GymType.dexterity ||
            sleeve.lowestStage.typeOfTraining === ns.enums.GymType.agility ) {
            continue;
        }
        
        if (sleeve.task && 
            sleeve.task.type === classTypeOfWork &&
            sleeve.task.classType === sleeve.lowestStage.typeOfTraining) { 

            sleeve.actionTaken = currentActionsPriority.actionName;
            continue;
        }

        ns.toast("hi");

        ns.sleeve.setToUniversityCourse(sleeve.name, ns.enums.LocationName.Sector12RothmanUniversity, sleeve.lowestStage.typeOfTraining) 
        sleeve.actionTaken = currentActionsPriority.actionName;

    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
    
}