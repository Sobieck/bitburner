const actionName = "DoCrime";
const crimeTypeOfWork = "CRIME";

export async function main(ns) {

    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    for (let i = 0; i < sleevesData.sleeves.length; i += 2) {
        const sleeve = sleevesData.sleeves[i];
        const partner = sleevesData.sleeves[sleeve.partner]

        const sleeveCanWork = canWork(sleeve, sleevesData);
        const partnerCanWork = canWork(partner, sleevesData);

        if (!sleeveCanWork && !partnerCanWork) {
            continue;
        }

        let sleevesBestAction = [];
        let partnersBestAction = [];

        let sleevesTopValue = 0;
        let partnersTopValue = 0;
        let bestPossibleAction;

        if (sleevesData.maximizeWhat === "money") {
            sleevesBestAction = sleeve.topMoneyMakers[0]
            sleevesTopValue = sleevesBestAction.expectedMoneyPerTime;

            if (partner) {
                partnersBestAction = partner.topMoneyMakers[0];
                partnersTopValue = partnersBestAction.expectedMoneyPerTime;
            }

            bestPossibleAction = sleevesData.mostMoneyCrime.type;
        } else {
            sleevesBestAction = sleeve.topKarmaMakers[0];
            sleevesTopValue = sleevesBestAction.expectedKarmaPerTime;

            if (partner) {
                partnersBestAction = partner.topKarmaMakers[0];
                partnersTopValue = partnersBestAction.expectedKarmaPerTime;
            }

            bestPossibleAction = sleevesData.mostKarmaCrime.type;
        }

        const whos = [];
        let whatCrimeToDo;

        if (!partnerCanWork) {
            whos.push(sleeve);
            whatCrimeToDo = sleevesBestAction.type;
        } else if (!sleeveCanWork) {
            whos.push(partner);
            whatCrimeToDo = partnersBestAction.type;
        } else {
            if (sleevesBestAction.type === bestPossibleAction &&
                partnersBestAction.type === bestPossibleAction &&
                sleevesBestAction.chance === 1 &&
                partnersBestAction.chance === 1) {

                whos.push(sleeve);
                whos.push(partner);
                whatCrimeToDo = bestPossibleAction;
            } else {
                if (sleevesTopValue > partnersTopValue) {
                    whos.push(sleeve);
                    whatCrimeToDo = sleevesBestAction.type;
                    partner.actionTaken = undefined;
                } else {
                    whos.push(partner);
                    whatCrimeToDo = partnersBestAction.type;
                    sleeve.actionTaken = undefined;
                }
            }
        }

        for (const who of whos) {
            if (!who.task ||
                who.task.type !== crimeTypeOfWork ||
                who.task.crimeType !== whatCrimeToDo
            ) {
                ns.sleeve.setToCommitCrime(who.name, whatCrimeToDo);
            }

            who.actionTaken = actionName;
        }
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}


function canWork(sleeve, sleevesData) {
    if (!sleeve) {
        return false;
    }

    const currentActionsPriority = sleevesData.priorities.find(x => x.actionName === actionName);

    if (!currentActionsPriority.who.includes(sleeve.name)) {
        return false;
    }

    const jobsWithHigherPriority = sleevesData
        .priorities
        .filter(x => x.who.includes(sleeve.name) && x.priority < currentActionsPriority.priority);

    if (jobsWithHigherPriority.find(x => x.actionName === sleeve.actionTaken)) {
        return false;
    }

    return true;
}


