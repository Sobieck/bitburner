export async function main(ns) {
    if(!ns.gang.inGang()){
        return;
    }

    const gangFile = 'data/gang.txt';
    const gang = JSON.parse(ns.read(gangFile));

    const goalRespect = gang.memberNextToAscend.earnedRespect * 0.01

    for (const member of gang.members) {
        if(member.def_asc_points > 0){
            continue;
        }

        if(member.earnedRespect > goalRespect || member.earnedRespect > 3_000){
            ns.gang.ascendMember(member.name)
        }
    }
}