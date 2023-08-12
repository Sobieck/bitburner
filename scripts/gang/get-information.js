export async function main(ns) {
    if(!ns.gang.inGang()){
        return;
    }
    
    const gangFile = 'data/gang.txt';
    let oldGangData;

    if (ns.fileExists(gangFile)) {
        oldGangData = JSON.parse(ns.read(gangFile));
    }

    const gangInfo = ns.gang.getGangInformation();
    const members = ns
        .gang
        .getMemberNames()
        .map(memberName => ns.gang.getMemberInformation(memberName))

    const other = ns.gang.getOtherGangInformation();

    const priorities = [
        { actionName: "Vigilante Justice", priority: 0 },
        { actionName: "Train Combat", priority: 1 },
        { actionName: "Crime", priority: 11},
    ]

    const tasks = ns
        .gang
        .getTaskNames()
        .map(x => ns.gang.getTaskStats(x))
        .filter(x => x.isCombat);

    for (const member of members) {
        const memberTasks = tasks
            .map(taskStat => {
                taskStat.moneyGain = ns.formulas.gang.moneyGain(gangInfo, member, taskStat);
                taskStat.respectGain = ns.formulas.gang.respectGain(gangInfo, member, taskStat);

                return taskStat;
            });

        member.maxMoneyGain = memberTasks.sort((a, b) => b.moneyGain - a.moneyGain)[0];

        member.maxRespectGain = memberTasks.sort((a, b) => b.respectGain - a.respectGain)[0];
    }

    let memberNextToAscend = members
        .sort((a, b) => b.earnedRespect - a.earnedRespect)[0];

    const gangStuff = { gangInfo, members, other, priorities };

    if (oldGangData && memberNextToAscend !== oldGangData.memberNextToAscend) {
        const memberAscendingNext = members.find(x => x.name === oldGangData.memberNextToAscend.name);

        if (memberAscendingNext.earnedRespect * 1.15 < memberNextToAscend.earnedRespect) {
            ns.gang.ascendMember(oldGangData.memberNextToAscend.name)
        } else {
            memberNextToAscend = oldGangData.memberNextToAscend;
        }
    }

    gangStuff.memberNextToAscend = memberNextToAscend;

    ns.rm(gangFile);
    ns.write(gangFile, JSON.stringify(gangStuff), "W");
}
