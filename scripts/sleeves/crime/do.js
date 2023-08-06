export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const actionName = "DoCrime";
    const crimeTypeOfWork = "CRIME";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    const crimes = makeCrimes(ns);

    for (const sleeve of sleevesData.sleeves) {
        sleeve.crimeChances = crimes.map(crime => {
            const chance = calculateChance(sleeve, crime);
            return { chance, crime }
        });

        sleeve.highestDifficultyCrimeWithMoreThan50PercentChance = sleeve
            .crimeChances
            .filter(x => x.chance > 0.5)
            .sort((a, b) => a.crime.difficulty - b.crime.difficulty)
            .pop();

        sleeve.allCrimesChancesMaxed = sleeve.crimeChances.every(x => x.chance === 1);
    }

    const sleevesInClass = sleevesData.sleeves
        .filter(x => x.task)
        .filter(x => x.task.type === "CLASS");

    const sleevesCriming = sleevesData.sleeves
        .filter(x => x.task)
        .filter(x => x.task.type === crimeTypeOfWork);

    if (sleevesCriming.length > sleevesInClass.length && !sleevesData.sleeves.every(x => x.allCrimesChancesMaxed)) { // this logic doesn't handle things that won't benefit from more training, but there are some that will. We need to figure that out... but later. 
        ns.rm(sleevesFile);
        ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
        return;
    }

    const crimesBeingCommitted = sleevesCriming.map(x => x.task.crimeType);

    const sleevesToPossiblyCommitCrimes = sleevesData.sleeves
        .filter(x => x.task)
        .filter(x => x.task.type !== crimeTypeOfWork)
        .filter(x => x.highestDifficultyCrimeWithMoreThan50PercentChance)
        .sort((a, b) => b.highestDifficultyCrimeWithMoreThan50PercentChance.difficulty - a.highestDifficultyCrimeWithMoreThan50PercentChance.difficulty);

    for (let sleeve of sleevesToPossiblyCommitCrimes) {
        if (!currentActionsPriority.who.includes(sleeve.name)) {
            continue;
        }

        const jobsWithHigherPriority = sleevesData
            .priorities
            .filter(x => x.who.includes(sleeve.name) && x.priority < currentActionsPriority.priority);

        if (jobsWithHigherPriority.find(x => x.actionName === sleeve.actionTaken)) {
            continue;
        }

        if (sleeve.task && sleeve.task.type === crimeTypeOfWork) {
            sleeve.actionTaken = currentActionsPriority.actionName;
            continue;
        }

        let crimeToDo = sleeve.highestDifficultyCrimeWithMoreThan50PercentChance.crime.name;
        
        if (!sleeve.allCrimesChancesMaxed) {
            const highestDifficultyCrimeNotBeingCommitedElsewhere = sleeve
                .crimeChances
                .filter(x => x.chance > .5)
                .filter(x => !crimesBeingCommitted.includes(x.crime.name))
                .sort((a, b) => a.difficulty - b.difficulty)
                .pop();

            if (highestDifficultyCrimeNotBeingCommitedElsewhere) {
                crimeToDo = highestDifficultyCrimeNotBeingCommitedElsewhere.name;
            }
        }

        ns.sleeve.setToCommitCrime(sleeve.name, crimeToDo);
        sleeve.actionTaken = currentActionsPriority.actionName;
        break;
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}

function makeCrimes(ns) {
    //https://github.com/bitburner-official/bitburner-src/blob/c4fe88e0c7420956579ae6b8efa81261b430f1be/src/Crime/Crimes.ts#L23C1-L42C5
    const heist = new Crime(ns.enums.CrimeType.heist, 18);

    heist.hacking_success_weight = 1;
    heist.strength_success_weight = 1;
    heist.defense_success_weight = 1;
    heist.dexterity_success_weight = 1;
    heist.agility_success_weight = 1;
    heist.charisma_success_weight = 1;


    const assassination = new Crime(ns.enums.CrimeType.assassination, 8);

    assassination.strength_success_weight = 1;
    assassination.dexterity_success_weight = 2;
    assassination.agility_success_weight = 1;


    const kidnap = new Crime(ns.enums.CrimeType.kidnap, 5);

    kidnap.charisma_success_weight = 1;
    kidnap.strength_success_weight = 1;
    kidnap.dexterity_success_weight = 1;
    kidnap.agility_success_weight = 1;


    const traffickArms = new Crime(ns.enums.CrimeType.traffickArms, 2);

    traffickArms.charisma_success_weight = 1;
    traffickArms.strength_success_weight = 1;
    traffickArms.defense_success_weight = 1;
    traffickArms.dexterity_success_weight = 1;
    traffickArms.agility_success_weight = 1;


    const bondForgery = new Crime(ns.enums.CrimeType.bondForgery, 1 / 2);

    bondForgery.hacking_success_weight = 0.05;
    bondForgery.dexterity_success_weight = 1.25;


    const robStore = new Crime(ns.enums.CrimeType.robStore, 1 / 5);

    robStore.hacking_success_weight = 0.5;
    robStore.dexterity_success_weight = 1;
    robStore.agility_success_weight = 1;

    const crimes = [
        heist,
        assassination,
        kidnap,
        traffickArms,
        bondForgery,
        robStore,
    ]

    return crimes;
}

function calculateChance(sleeve, crime) {
    //https://github.com/bitburner-official/bitburner-src/blob/c4fe88e0c7420956579ae6b8efa81261b430f1be/src/Crime/Crime.ts#L119C36-L119C36
    let chance =
        crime.hacking_success_weight * sleeve.skills.hacking +
        crime.strength_success_weight * sleeve.skills.strength +
        crime.defense_success_weight * sleeve.skills.defense +
        crime.dexterity_success_weight * sleeve.skills.dexterity +
        crime.agility_success_weight * sleeve.skills.agility +
        crime.charisma_success_weight * sleeve.skills.charisma +
        0.025 * sleeve.skills.intelligence; // IntelligenceCrimeWeight https://github.com/bitburner-official/bitburner-src/blob/d63782875926fbab521d163dd5aba4ce2a9340a8/src/Constants.ts#L142

    const maxSkillLevel = 975; //https://github.com/bitburner-official/bitburner-src/blob/c4fe88e0c7420956579ae6b8efa81261b430f1be/src/Constants.ts#L94

    chance /= maxSkillLevel;
    chance /= crime.difficulty;
    chance *= sleeve.mults.crime_success;

    return Math.min(chance, 1);
}

class Crime {
    constructor(name, difficulty) {
        this.name = name;
        this.difficulty = difficulty;
    }

    hacking_success_weight = 0;
    strength_success_weight = 0;
    defense_success_weight = 0;
    dexterity_success_weight = 0;
    agility_success_weight = 0;
    charisma_success_weight = 0;
}


