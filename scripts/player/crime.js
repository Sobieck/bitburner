export async function main(ns) {
    const playerFile = 'data/player.txt';
    const player = JSON.parse(ns.read(playerFile));
    const actionName = "DoCrime";

    const currentActionsPriority = player.priorities.find(x => x.actionName === actionName);

    const jobsWithHigherPriority = player
            .priorities
            .filter(x => x.priority < currentActionsPriority.priority);

    if (jobsWithHigherPriority.find(x => x.actionName === player.actionTaken)) {
        return;
    }


    if (currentActionsPriority.do){
        if (!player.work || player.work.type !== "CRIME") {
            
            ns.singularity.commitCrime(ns.enums.CrimeType.homicide);
            
        }

        player.actionTaken = actionName;
    } 
}