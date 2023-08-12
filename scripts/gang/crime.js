export async function main(ns) {
    if(!ns.gang.inGang()){
        return;
    }
    
    const gangFile = 'data/gang.txt';
    const gang = JSON.parse(ns.read(gangFile));
    const actionName = "Crime";

    const currentActionsPriority = gang.priorities.find(x => x.actionName === actionName);

    const jobsWithHigherPriority = gang
        .priorities
        .filter(x => x.priority < currentActionsPriority.priority);

    const shouldDoMoneyCrimes = true;
    let moneyCrimeNext = true;
    
    for (const member of gang.members.sort((a,b) => b.earnedRespect - a.earnedRespect)) {
        if (jobsWithHigherPriority.find(x => x.actionName === member.actionTaken)) {
            continue;
        }

        if(shouldDoMoneyCrimes && moneyCrimeNext){
            if(member.task !== member.maxMoneyGain.name){
                ns.gang.setMemberTask(member.name, member.maxMoneyGain.name);
            }

            moneyCrimeNext = false;
        } else {
            if(member.task !== member.maxRespectGain.name){
                ns.gang.setMemberTask(member.name, member.maxRespectGain.name);
            }

            moneyCrimeNext = true;
        }


        member.actionTaken = actionName;
    }

    ns.rm(gangFile);
    ns.write(gangFile, JSON.stringify(gang, "W"));
}