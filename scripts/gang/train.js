export async function main(ns) {
    if(!ns.gang.inGang()){
        return;
    }
    
    const gangFile = 'data/gang.txt';
    const gang = JSON.parse(ns.read(gangFile));
    const actionName = "Train Combat";

    const currentActionsPriority = gang.priorities.find(x => x.actionName === actionName);

    const jobsWithHigherPriority = gang
        .priorities
        .filter(x => x.priority < currentActionsPriority.priority);


    for (const member of gang.members) {
        if (jobsWithHigherPriority.find(x => x.actionName === member.actionTaken)) {
            continue;
        }

        const goal = 75;

        if (
            member.str < goal ||
            member.def < goal ||
            member.agi < goal ||
            member.dex < goal
        ) {

            if (member.task !== actionName) {
                ns.gang.setMemberTask(member.name, actionName);
            } 

            member.actionTaken = actionName;
        }
    }

    ns.rm(gangFile);
    ns.write(gangFile, JSON.stringify(gang), "W");
}