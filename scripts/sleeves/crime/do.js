export async function main(ns) {
return;
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const actionName = "DoCrime";
    const crimeTypeOfWork = "CRIME";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    const sleevesInClassCount = sleevesData.sleeves
        .filter(x => x.task)
        .filter(x => x.task.type === "CLASS")
        .length;

    const sleevesCriming = sleevesData.sleeves
        .filter(x => x.task)
        .filter(x => x.task.type === crimeTypeOfWork);


    if (sleevesCriming.length >= sleevesInClassCount && !sleevesData.sleeves.every(x => x.allCrimesChancesMaxed)) { // this logic doesn't handle things that won't benefit from more training, but there are some that will. We need to figure that out... but later. 
// ns.toast(`${sleevesCriming.length} >= ${sleevesInClassCount} && ${!sleevesData.sleeves.every(x => x.allCrimesChancesMaxed)}`)

        const difference = sleevesCriming.length - sleevesInClassCount;

        const sortedCrimersByLowestDifficulty = sleevesCriming.sort((a,b) => b.task.difficulty - a.task.difficulty);

        for (let i = 0; i < difference; i++) {
            const crimer = sortedCrimersByLowestDifficulty[i];
            crimer.actionTaken = undefined;
        }

        ns.rm(sleevesFile);
        ns.write(sleevesFile, JSON.stringify(sleevesData), "W");

        return;
    }

    const sleevesToPossiblyCommitCrimes = sleevesData.sleeves
        .filter(x => x.task)
        .filter(x => x.task.type !== crimeTypeOfWork)
        .filter(x => x.highestDifficultyCrimeWithMoreThan50PercentChance)
        .sort((a, b) => b.highestDifficultyCrimeWithMoreThan50PercentChance.difficulty - a.highestDifficultyCrimeWithMoreThan50PercentChance.difficulty);

    let assignedNewSleeveAlready = false;

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

        let crimeToDo = sleeve.highestDifficultyCrimeWithMoreThan50PercentChance.crime.type;

        if (!sleeve.allCrimesChancesMaxed) {
            const crimesBeingCommitted = sleevesCriming.map(x => x.task.crimeType);

            const highestDifficultyCrimeNotBeingCommitedElsewhere = sleeve
                .crimeChances
                .filter(x => x.chance > .5)
                .filter(x => !crimesBeingCommitted.includes(x.crime.type))
                .sort((a, b) => a.difficulty - b.difficulty)
                .pop();

            if (highestDifficultyCrimeNotBeingCommitedElsewhere) {
                crimeToDo = highestDifficultyCrimeNotBeingCommitedElsewhere.crime.type;
            }
        }

        if(assignedNewSleeveAlready === false){
            ns.sleeve.setToCommitCrime(sleeve.name, crimeToDo);

            sleeve.actionTaken = currentActionsPriority.actionName;
            assignedNewSleeveAlready = true;
        }
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}



