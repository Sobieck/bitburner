export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const actionName = "MirrorPlayer";
    const typeOfWork = "FACTION";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    const mainPlayerWork = ns.singularity.getCurrentWork(); 

    if (!mainPlayerWork || mainPlayerWork.type !== typeOfWork) {
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

        if (!sleeve.task || 
            (sleeve.task.type !== typeOfWork || 
                sleeve.task.factionWorkType !== mainPlayerWork.factionWorkType || 
                sleeve.task.factionName !== mainPlayerWork.factionName)) {

            ns.sleeve.setToFactionWork(sleeve.name, mainPlayerWork.factionName, mainPlayerWork.factionWorkType);
        }

        sleeve.actionTaken = currentActionsPriority.actionName;
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}