export async function main(ns) {
    const playerFile = 'data/player.txt';
    const player = JSON.parse(ns.read(playerFile));
    const actionName = "StudyComputerScience";

    const currentActionsPriority = player.priorities.find(x => x.actionName === actionName);

    const jobsWithHigherPriority = player
            .priorities
            .filter(x => x.priority < currentActionsPriority.priority);

    if (jobsWithHigherPriority.find(x => x.actionName === player.actionTaken)) {
        return;
    }

    if(player.skills.hacking < currentActionsPriority.goalSkill){
        if(!player.work ||
            player.work.type !== "CLASS" || 
            player.work.classType !== ns.enums.UniversityClassType.computerScience ||
            player.work.location !== ns.enums.LocationName.Sector12RothmanUniversity
        ){
            if(player.city !== ns.enums.CityName.Sector12){
                ns.singularity.travelToCity(ns.enums.CityName.Sector12);
            }
            
            ns.singularity.universityCourse(ns.enums.LocationName.Sector12RothmanUniversity, ns.enums.UniversityClassType.computerScience, true);
        } 

        player.actionTaken = actionName;
    }

    
    ns.rm(playerFile);
    ns.write(playerFile, JSON.stringify(player), "W");
}

