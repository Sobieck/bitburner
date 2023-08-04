export async function main(ns) {

    const numberOfSleeves = ns.sleeve.getNumSleeves();
    const allSleeves = Array.from(Array(numberOfSleeves).keys())

    const priorities = [
        { actionName: "Syncronize", tasks: ["SYNCHRO"], who: allSleeves, priority: 0 },
        { actionName: "Recovery", tasks: ["RECOVERY"], who: allSleeves, priority: 1 }, // "task":{"type":"RECOVERY"}
        { actionName: "MatchPlayer", tasks: ["FACTION", "CLASS"], who: allSleeves, priority: 2}, //"task": { "type": "FACTION", "factionWorkType": "hacking", "factionName": "Chongqing"
        { actionName: "DoCrime", tasks: "CRIME", who: allSleeves, priority: 3}, //"task": { "type": "CRIME", "crimeType": "Shoplift", "cyclesWorked": 0, "cyclesNeeded": 10 }
        // "task":{"type":"CLASS","classType":"Computer Science","location":"Rothman University"}}
        // "task":{"type":"CLASS","classType":"str","location":"Iron Gym"}
    ]

    const updated = new Date();

    const sleevesFile = 'data/sleeves.txt';
    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify({numberOfSleeves, priorities, updated}), "W");
}