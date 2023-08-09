export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));
    const actionName = "Recovery";

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    let countOfUsingInitialMethod = 0;
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

        const shockToStopAt = sleeve.name * 10;

        if (sleeve.shock > shockToStopAt) {
            setShockRecovery(currentActionsPriority, sleeve, ns);
            countOfUsingInitialMethod++;
        }
    }

    if (countOfUsingInitialMethod === 0) {
        const countOfShocked = sleevesData.sleeves
            .filter(x => x.shock === 0)
            .length;

        const sleevesRecovering = sleevesData.sleeves
            .filter(x => x.task && x.task.type === "RECOVERY")

        if (countOfShocked > 0) {
            let sleeveToRecoverFully;

            if (sleevesRecovering.length === 0) {
                const sleeveWithTheMostShockToRecover = sleevesData
                    .sleeves
                    .filter(x => x.sync === 100 && x.shock !== 0)
                    .sort((a, b) => a.shock - b.shock)
                    .pop();

                sleeveToRecoverFully = sleeveWithTheMostShockToRecover;
            } else {
                sleeveToRecoverFully = sleevesRecovering.pop();
            }

            if (sleeveToRecoverFully) {
                setShockRecovery(currentActionsPriority, sleeveToRecoverFully, ns);
            }
        }
    }


    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}

function setShockRecovery(currentActionsPriority, sleeve, ns) {
    if (!currentActionsPriority.tasks.find(x => x === sleeve.task.type)) {
        ns.sleeve.setToShockRecovery(sleeve.name);
    }

    sleeve.actionTaken = currentActionsPriority.actionName;
}
