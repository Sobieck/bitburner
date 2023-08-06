export async function main(ns) {

    const numberOfSleeves = ns.sleeve.getNumSleeves();
    const allSleeves = Array.from(Array(numberOfSleeves).keys())

    const priorities = [
        { actionName: "Syncronize", tasks: ["SYNCHRO"], who: allSleeves, priority: 0 },
        { actionName: "Recovery", tasks: ["RECOVERY"], who: allSleeves, priority: 1 },
        { actionName: "MirrorPlayer", tasks: ["FACTION", "CLASS", "COMPANY"], who: [0], priority: 2}, 
        { actionName: "DoCrime", tasks: ["CRIME"], who: allSleeves, priority: 3 }, //"task": { "type": "CRIME", "crimeType": "Shoplift", "cyclesWorked": 0, "cyclesNeeded": 10 }
        { actionName: "CrimeTrain", tasks: ["CLASS"], who: allSleeves, priority: 4 },
        // "task":{"type":"CLASS","classType":"str","location":"Iron Gym"}
    ]

    const updated = new Date();

    const sleevesFile = 'data/sleeves.txt';
    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify({numberOfSleeves, priorities, updated}), "W");
}