export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));
    const actionName = "MatchPlayer";
    const typeOfWork = "FACTION";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    const mainPlayerWork = ns.singularity.getCurrentWork();

    if (mainPlayerWork.type !== typeOfWork) {
        return;
    }

    for (let sleeve of sleevesData.sleeves) {
        if (!currentActionsPriority.who.includes(sleeve.name)) {
            continue;
        }

        const jobsWithHigherPriority = sleevesData
            .priorities
            .filter(x => x.who.includes(sleeve.name) && x.priority < currentActionsPriority.priority);

        if (jobsWithHigherPriority.find(x => x.actionName === sleeve.actionTaken)) {
            continue;
        }



        // if (!currentActionsPriority.tasks.find(x => x === sleeve.task.type)) {
        //     const mainPlayerWork = ns.singularity.getCurrentWork(); // {"type":"FACTION","cyclesWorked":126473,"factionWorkType":"hacking","factionName":"Chongqing"}


        //     if (mainPlayerWork.type === typeOfWork && sleeve.task.type !== typeOfWork) {
        //         ns.sleeve.setToFactionWork(sleeve.name, mainPlayerWork.factionName, mainPlayerWork.factionWorkType);
        //     }

        //     ns.sleeve.setToSynchronize(sleeve.name)
        // }

        // sleeve.actionTaken = currentActionsPriority.actionName;
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}