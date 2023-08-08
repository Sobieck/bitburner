export async function main(ns) {

    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const crimeTypeOfWork = "CRIME";
    const crimes = makeCrimes(ns);

    sleevesData.maximizeWhat = "money"; //"karma";
    sleevesData.mostKarmaCrime = crimes
        .map(x => x)
        .sort((a, b) => b.karmaPerTime - a.karmaPerTime)
        .shift();

    sleevesData.mostMoneyCrime = crimes
        .map(x => x)
        .sort((a, b) => b.moneyPerTime - a.moneyPerTime)
        .shift();

    for (const sleeve of sleevesData.sleeves) {
        sleeve.crimeChances = crimes.map(crime => {
            crime.chance = calculateChance(sleeve, crime, ns);
            crime.expectedKarmaPerTime = crime.karmaPerTime * crime.chance;
            crime.expectedMoneyPerTime = crime.moneyPerTime * crime.chance;

            return crime;
        });

        sleeve.topKarmaMakers = sleeve
            .crimeChances
            .sort((a, b) => b.expectedKarmaPerTime - a.expectedKarmaPerTime)
            .slice(0, 4);

        sleeve.topMoneyMakers = sleeve
            .crimeChances
            .sort((a, b) => b.expectedMoneyPerTime - a.expectedMoneyPerTime)
            .slice(0, 4);

        sleeve.allCrimesChancesMaxed = sleeve.crimeChances.every(x => x.chance === 1);

        if (sleeve.task.type === crimeTypeOfWork) {
            sleeve.actionTaken = "DoCrime";
        }
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
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


function calculateChance(sleeve, crime, ns) {
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