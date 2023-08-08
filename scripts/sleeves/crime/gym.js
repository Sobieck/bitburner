export async function main(ns) {

    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const actionName = "CrimeTrain";
    const classTypeOfWork = "CLASS";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    for (let sleeve of sleevesData.sleeves) {

        if(!sleevesData.sleeves[sleeve.partner]){
            continue;
        }

        if (sleevesData.maximizeWhat === "money") {
            const currentMoneyMaker = sleevesData.sleeves[sleeve.partner].topMoneyMakers[0];

            if (currentMoneyMaker.chance !== 1) {
                sleeve.crimeToTrainFor = currentMoneyMaker;
            } else {
                sleeve.crimeToTrainFor = sleevesData.sleeves[sleeve.partner]
                    .crimeChances
                    .filter(x => x.moneyPerTime > currentMoneyMaker.moneyPerTime && x.chance !== 1)
                    .sort((a, b) => b.expectedMoneyPerTime - a.expectedMoneyPerTime)
                    .shift()
            }
        } else {
            const currentKarmaMaker = sleevesData.sleeves[sleeve.partner].topKarmaMakers[0];

            if (currentKarmaMaker.chance !== 1) {
                sleeve.crimeToTrainFor = currentKarmaMaker;
            } else {
                sleeve.crimeToTrainFor = sleevesData.sleeves[sleeve.partner]
                    .crimeChances
                    .filter(x => x.karmaPerTime > currentKarmaMaker.karmaPerTime && x.chance !== 1)
                    .sort((a, b) => b.expectedKarmaPerTime - a.expectedKarmaPerTime)
                    .shift()
            }
        }

        let totalPoints = 0;

        totalPoints += sleeve.crimeToTrainFor.hacking_success_weight;
        totalPoints += sleeve.crimeToTrainFor.strength_success_weight;
        totalPoints += sleeve.crimeToTrainFor.defense_success_weight;
        totalPoints += sleeve.crimeToTrainFor.dexterity_success_weight;
        totalPoints += sleeve.crimeToTrainFor.agility_success_weight;
        totalPoints += sleeve.crimeToTrainFor.charisma_success_weight;

        const hackingStage = trainingStage(sleeve.crimeToTrainFor.hacking_success_weight, totalPoints, sleeve.skills.hacking);
        const strengthStage = trainingStage(sleeve.crimeToTrainFor.strength_success_weight, totalPoints, sleeve.skills.strength);
        const defenseStage = trainingStage(sleeve.crimeToTrainFor.defense_success_weight, totalPoints, sleeve.skills.defense);
        const dexterityStage = trainingStage(sleeve.crimeToTrainFor.dexterity_success_weight, totalPoints, sleeve.skills.dexterity);
        const agilityStage = trainingStage(sleeve.crimeToTrainFor.agility_success_weight, totalPoints, sleeve.skills.agility);
        const charismaStage = trainingStage(sleeve.crimeToTrainFor.charisma_success_weight, totalPoints, sleeve.skills.charisma);

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
