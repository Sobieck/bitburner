export async function main(ns) {

    const numberOfSleeves = ns.sleeve.getNumSleeves();
    const allSleeves = Array.from(Array(numberOfSleeves).keys())
    const inGang = ns.gang.inGang();

    const priorities = [
        { actionName: "Syncronize", tasks: ["SYNCHRO"], who: allSleeves, priority: 0 },
        { actionName: "Recovery", tasks: ["RECOVERY"], who: allSleeves, priority: 1 },
        { actionName: "WorkForCompany", tasks: ["COMPANY"], who: allSleeves, priority: 10 },
        { actionName: "MirrorPlayer", tasks: ["FACTION", "CLASS", "COMPANY"], who: [6], priority: 20}, 
        { actionName: "DoCrime", tasks: ["CRIME"], who: allSleeves, priority: 30 }, //"task": { "type": "CRIME", "crimeType": "Shoplift", "cyclesWorked": 0, "cyclesNeeded": 10 }
        { actionName: "CrimeTrain", tasks: ["CLASS"], who: allSleeves, priority: 31 },
        // "task":{"type":"CLASS","classType":"str","location":"Iron Gym"}
    ]

    if(!inGang){
       // change crime priority to 2, when gangs are available. Then go through and make karma generation the most important thing. 
    }

    const updated = new Date();

    const sleevesFile = 'data/sleeves.txt';
    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify({numberOfSleeves, priorities, updated, inGang}), "W");
}