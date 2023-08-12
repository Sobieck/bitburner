export async function main(ns) {

    const playerFile = 'data/player.txt';
    const player = ns.getPlayer();
    player.inGang = ns.gang.inGang();
    player.work = ns.singularity.getCurrentWork();

    player.priorities = [
        { actionName: "StudyComputerScience", what: ns.enums.UniversityClassType.computerScience, goalSkill: 25, priority: 0, script: 'study' },
        { actionName: "CreateEarlyPrograms", priority: 1, script: 'create-programs' },
        { actionName: "DoCrime", priority: 10, script: 'crime' },
        // workout 
        // graft?
    ]


    // install augs when. We need to figure out that when we have gangs. 

    player.updated = new Date().toLocaleString();

    ns.rm(playerFile);
    ns.write(playerFile, JSON.stringify(player), "W");
}