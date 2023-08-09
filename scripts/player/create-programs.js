export async function main(ns) {
    const playerFile = 'data/player.txt';
    const player = JSON.parse(ns.read(playerFile));
    const actionName = "CreateEarlyPrograms";

    const currentActionsPriority = player.priorities.find(x => x.actionName === actionName);

    const jobsWithHigherPriority = player
        .priorities
        .filter(x => x.priority < currentActionsPriority.priority);

    if (jobsWithHigherPriority.find(x => x.actionName === player.actionTaken)) {
        return;
    }

    let creatingProgram = false;
    if (player.work && player.work.type === 'CREATE_PROGRAM') {
        creatingProgram = true;
    }

    if (!creatingProgram && !ns.fileExists("BruteSSH.exe")) {
        creatingProgram = ns.singularity.createProgram("BruteSSH.exe", true);
    }

    if (!creatingProgram && !ns.fileExists("FTPCrack.exe")) {
        creatingProgram = ns.singularity.createProgram("FTPCrack.exe", true);
    }

    if (creatingProgram) {
        player.actionTaken = actionName;
    }


    ns.rm(playerFile);
    ns.write(playerFile, JSON.stringify(player), "W");
}

