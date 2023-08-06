export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));
    const actionName = "Syncronize";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

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

        if (sleeve.sync < 100) {
            if(!currentActionsPriority.tasks.find(x => x === sleeve.task.type)){
                ns.sleeve.setToSynchronize(sleeve.name)
            }
    
            sleeve.actionTaken = currentActionsPriority.actionName;
        }
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}