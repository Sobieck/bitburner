export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    const actionName = "WorkForCompany";
    const typeOfWork = "COMPANY";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    if (currentActionsPriority.ignorePriorityForGang) {
        return;
    }

    const player = JSON.parse(ns.read('data/player.txt'));

    const companiesEmployedAt = [];

    for (let company in player.jobs) {
        companiesEmployedAt.push(company);
    }

    let companiesWeArentPartOfTheirFactionYet = companiesEmployedAt
        .filter(x => !player.factions.includes(x))

    if (companiesWeArentPartOfTheirFactionYet.length === 0) {
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

        sleeve.actionTaken = actionName;

        if (companiesWeArentPartOfTheirFactionYet.length === 0) {
            continue;
        }

        const companyToWorkAt = companiesWeArentPartOfTheirFactionYet.pop();
        sleeve.companyWorkingAt = companyToWorkAt;

        if (!sleeve.task ||
            (sleeve.task.type !== typeOfWork ||
                sleeve.task.companyName !== companyToWorkAt)) {

            ns.sleeve.setToCompanyWork(sleeve.name, companyToWorkAt);
        }
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}