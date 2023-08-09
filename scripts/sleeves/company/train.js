export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const actionName = "WorkForCompany";
    const typeOfWork = "CLASS";

    let computerTrain = false;

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    if (currentActionsPriority.ignorePriorityForGang) {
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

        if(sleeve.actionTaken === actionName && !sleeve.companyWorkingAt){
            let trainWhat = ns.enums.UniversityClassType.leadership;
            
            if(computerTrain){
                trainWhat = ns.enums.UniversityClassType.algorithms
            }

            if (sleeve.task && 
                (sleeve.task.type !== typeOfWork ||
                sleeve.task.classType !== trainWhat)) { 
    
                ns.sleeve.setToUniversityCourse(sleeve.name, ns.enums.LocationName.Sector12RothmanUniversity, trainWhat) 
            }

            sleeve.actionTaken = actionName;
            computerTrain = !computerTrain;
        }
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}