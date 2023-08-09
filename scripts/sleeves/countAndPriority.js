export async function main(ns) {

    const numberOfSleeves = ns.sleeve.getNumSleeves();
    const allSleeves = Array.from(Array(numberOfSleeves).keys())
    const inGang = true; //ns.gang.inGang();


    const priorities = [
        { actionName: "Syncronize", tasks: ["SYNCHRO"], who: allSleeves, priority: 0, ignorePriorityForGang: false },
        { actionName: "Recovery", tasks: ["RECOVERY"], who: allSleeves, priority: 1, ignorePriorityForGang: false },
        { actionName: "WorkForCompany", tasks: ["COMPANY"], who: allSleeves, priority: 10, ignorePriorityForGang: !inGang },
        { actionName: "MirrorPlayer", tasks: ["FACTION", "CLASS", "COMPANY"], who: [0], priority: 20, ignorePriorityForGang: !inGang },
        { actionName: "DoCrime", tasks: ["CRIME"], who: allSleeves, priority: 30 },
        { actionName: "CrimeTrain", tasks: ["CLASS"], who: allSleeves, priority: 31 },
    ]


    const updated = new Date().toLocaleString();

    const sleevesFile = 'data/sleeves.txt';
    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify({ numberOfSleeves, priorities, updated, inGang }), "W");
}