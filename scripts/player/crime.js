export async function main(ns) {
    const playerFile = 'data/player.txt';
    const player = JSON.parse(ns.read(playerFile));
    const actionName = "DoCrime";

    const currentActionsPriority = player.priorities.find(x => x.actionName === actionName);

    const jobsWithHigherPriority = player
        .priorities
        .filter(x => x.priority < currentActionsPriority.priority);

    if (jobsWithHigherPriority.find(x => x.actionName === player.actionTaken)) {
        return;
    }

    if (!player.inGang) {
        if (!player.work || player.work.type !== "CRIME") {

            ns.singularity.commitCrime(ns.enums.CrimeType.homicide);

        }
    } else {
        const crimes = makeCrimes(ns);

        for (const crime of crimes) {
            crime.chance = calculateChance(player, crime);
            crime.expectedMoneyPerTime = crime.moneyPerTime * crime.chance;
        }

        player.topMoneyMaker = crimes
            .sort((a, b) => b.expectedMoneyPerTime - a.expectedMoneyPerTime)
            .shift();

        if (!player.work || 
            player.work.type !== "CRIME" ||
            player.work.crimeType !== player.topMoneyMaker.type){

                ns.singularity.commitCrime(player.topMoneyMaker.type);
        }

    }


    player.actionTaken = actionName;

    ns.rm(playerFile);
    ns.write(playerFile, JSON.stringify(player), "W");
}


function makeCrimes(ns) {
    //https://github.com/bitburner-official/bitburner-src/blob/c4fe88e0c7420956579ae6b8efa81261b430f1be/src/Crime/Crimes.ts#L23C1-L42C5

    const crimes = [];

    for (let [key, crimeName] of Object.entries(ns.enums.CrimeType)) {
        const crime = ns.singularity.getCrimeStats(crimeName)
        crime.moneyPerTime = crime.money / crime.time;
        crime.karmaPerTime = crime.karma / crime.time;

        crimes.push(crime)
    }

    return crimes;
}


function calculateChance(player, crime) {
    //https://github.com/bitburner-official/bitburner-src/blob/c4fe88e0c7420956579ae6b8efa81261b430f1be/src/Crime/Crime.ts#L119C36-L119C36
    let chance =
        crime.hacking_success_weight * player.skills.hacking +
        crime.strength_success_weight * player.skills.strength +
        crime.defense_success_weight * player.skills.defense +
        crime.dexterity_success_weight * player.skills.dexterity +
        crime.agility_success_weight * player.skills.agility +
        crime.charisma_success_weight * player.skills.charisma +
        0.025 * player.skills.intelligence; // IntelligenceCrimeWeight https://github.com/bitburner-official/bitburner-src/blob/d63782875926fbab521d163dd5aba4ce2a9340a8/src/Constants.ts#L142

    const maxSkillLevel = 975; //https://github.com/bitburner-official/bitburner-src/blob/c4fe88e0c7420956579ae6b8efa81261b430f1be/src/Constants.ts#L94

    chance /= maxSkillLevel;
    chance /= crime.difficulty;
    chance *= player.mults.crime_success;

    return Math.min(chance, 1);
}