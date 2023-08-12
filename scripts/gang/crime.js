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

    const currentEarnedRespectHighWaterMark = gang.memberNextToAscend.earnedRespect;
    const respectWaterMark = currentEarnedRespectHighWaterMark * .75;

    const moneyMakingGangsters = gang.members.filter(x => x.maxMoneyGain.name === x.task)

    for (const member of gang.members) {
        if (jobsWithHigherPriority.find(x => x.actionName === member.actionTaken)) {
            continue;
        }

        if(member.earnedRespect > respectWaterMark && shouldDoMoneyCrimes){
            if(member.task !== member.maxMoneyGain.name){
                ns.gang.setMemberTask(member.name, member.maxMoneyGain.name);
            } else {
                const topGansterDoingSameWork = moneyMakingGangsters
                    .filter(x => x.task === member.task)
                    .sort((a,b) => b.moneyGain - a.moneyGain)[0];

                if(topGansterDoingSameWork && topGansterDoingSameWork.moneyGain * .30 > member.moneyGain){
                    ns.gang.ascendMember(member.name)
                }
            }

        } else {
            if(member.task !== member.maxRespectGain.name){
                ns.gang.setMemberTask(member.name, member.maxRespectGain.name);
            }
        }


        member.actionTaken = actionName;
    }

    ns.rm(gangFile);
    ns.write(gangFile, JSON.stringify(gang, "W"));
}