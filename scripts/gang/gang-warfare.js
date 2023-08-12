export async function main(ns) {
    if(!ns.gang.inGang()){
        return;
    }
    
    const gangFile = 'data/gang.txt';
    const gang = JSON.parse(ns.read(gangFile));
    const actionName = "Territory Warfare";

    if(gang.respect < 20_000_000){
        return;
    }

    const currentActionsPriority = gang.priorities.find(x => x.actionName === actionName);

    const jobsWithHigherPriority = gang
        .priorities
        .filter(x => x.priority < currentActionsPriority.priority);


    let assignedFighters = 0;
    let fightersToAssign = 0;

    for (const member of gang.members.sort((a,b) => b.earnedRespect - a.earnedRespect)) {
        if (jobsWithHigherPriority.find(x => x.actionName === member.actionTaken)) {
            continue;
        }

        if(assignedFighters >= fightersToAssign){
            continue;
        }

        ns.gang.setMemberTask(member.name, actionName);
        member.actionTaken = actionName;
        assignedFighters++;
    }

    ns.rm(gangFile);
    ns.write(gangFile, JSON.stringify(gang), "W");
}