export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const actionName = "MirrorPlayer";
    const typeOfWork = "COMPANY";

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
                sleeve.task.companyName !== mainPlayerWork.companyName)) {

            ns.sleeve.setToCompanyWork(sleeve.name, mainPlayerWork.companyName);
        }

        sleeve.actionTaken = currentActionsPriority.actionName;
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}