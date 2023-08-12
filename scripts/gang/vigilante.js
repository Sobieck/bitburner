export async function main(ns) {
    if(!ns.gang.inGang()){
        return;
    }
    
    const gangFile = 'data/gang.txt';
    const gang = JSON.parse(ns.read(gangFile));
    const actionName = "Vigilante Justice";

    const memberToVigilante = gang.members.find(x => x.name === gang.memberNextToAscend.name);

    if(memberToVigilante){
        if(gang.members.length > 3 && memberToVigilante && memberToVigilante.task !== actionName){
            ns.gang.setMemberTask(memberToVigilante.name, actionName);
        }

        memberToVigilante.actionTaken = actionName;
    }

    ns.rm(gangFile);
    ns.write(gangFile, JSON.stringify(gang), "W");
}