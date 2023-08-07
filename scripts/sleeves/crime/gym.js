export async function main(ns) {

    return;
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const actionName = "CrimeTrain";
    const classTypeOfWork = "CLASS";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    for (let sleeve of sleevesData.sleeves) {
        const sortedCrimesThatArent1HighestToLowest = sleeve
            .crimeChances
            .filter(x => x.chance !== 1)
            .sort((a, b) => b.chance - a.chance);

        const allCrimesOver50 = sortedCrimesThatArent1HighestToLowest.every(x => x.chance > 0.5);
        if (allCrimesOver50) {
            sleeve.crimeToTrainFor = sortedCrimesThatArent1HighestToLowest.pop(); // lowest chance crime
        } else {
            sleeve.crimeToTrainFor = sortedCrimesThatArent1HighestToLowest.filter(x => x.chance < 0.5).shift();
        }

        let totalPoints = 0;

        totalPoints += sleeve.crimeToTrainFor.crime.hacking_success_weight;
        totalPoints += sleeve.crimeToTrainFor.crime.strength_success_weight;
        totalPoints += sleeve.crimeToTrainFor.crime.defense_success_weight;
        totalPoints += sleeve.crimeToTrainFor.crime.dexterity_success_weight;
        totalPoints += sleeve.crimeToTrainFor.crime.agility_success_weight;
        totalPoints += sleeve.crimeToTrainFor.crime.charisma_success_weight;

        const hackingStage = trainingStage(sleeve.crimeToTrainFor.crime.hacking_success_weight, totalPoints, sleeve.skills.hacking);
        const strengthStage = trainingStage(sleeve.crimeToTrainFor.crime.strength_success_weight, totalPoints, sleeve.skills.strength);
        const defenseStage = trainingStage(sleeve.crimeToTrainFor.crime.defense_success_weight, totalPoints, sleeve.skills.defense);
        const dexterityStage = trainingStage(sleeve.crimeToTrainFor.crime.dexterity_success_weight, totalPoints, sleeve.skills.dexterity);
        const agilityStage = trainingStage(sleeve.crimeToTrainFor.crime.agility_success_weight, totalPoints, sleeve.skills.agility);
        const charismaStage = trainingStage(sleeve.crimeToTrainFor.crime.charisma_success_weight, totalPoints, sleeve.skills.charisma);

        sleeve.stages = [
            new StageNames(hackingStage, ns.enums.UniversityClassType.algorithms),
            new StageNames(strengthStage, ns.enums.GymType.strength),
            new StageNames(defenseStage, ns.enums.GymType.defense),
            new StageNames(dexterityStage, ns.enums.GymType.dexterity),
            new StageNames(agilityStage, ns.enums.GymType.agility),
            new StageNames(charismaStage, ns.enums.UniversityClassType.leadership),
        ]

        for (const stage of sleeve.stages) {
            if (!stage.stage) {
                continue;
            }

            if (!sleeve.lowestStage) {
                sleeve.lowestStage = stage;
            }

            if (sleeve.lowestStage.stage > stage.stage) {
                sleeve.lowestStage = stage;
            }
        }

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

        if (sleeve.lowestStage.typeOfTraining === ns.enums.UniversityClassType.algorithms ||
            sleeve.lowestStage.typeOfTraining === ns.enums.UniversityClassType.leadership) {
            continue;
        }

        if (sleeve.task &&
            sleeve.task.type === classTypeOfWork &&
            sleeve.task.classType === sleeve.lowestStage.typeOfTraining) {

            sleeve.actionTaken = currentActionsPriority.actionName;
            continue;
        }

        ns.sleeve.setToGymWorkout(sleeve.name, ns.enums.LocationName.Sector12PowerhouseGym, sleeve.lowestStage.typeOfTraining)
        sleeve.actionTaken = currentActionsPriority.actionName;
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");

}

function trainingStage(weight, totalPoints, skill) {
    if (weight === 0) {
        return null;
    }
    return Math.ceil(skill / Math.min((weight / totalPoints) * 100));
}

class StageNames {
    constructor(stage, typeOfTraining) {
        this.stage = stage;
        this.typeOfTraining = typeOfTraining;
    }
}
