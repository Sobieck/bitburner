export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));

    
    for (const lastRoundSleeve of sleevesData.sleeves) {
        const currentSleeve = ns.sleeve.getSleeve(lastRoundSleeve.name);

        if(currentSleeve.task && lastRoundSleeve.tast && currentSleeve.task.type === lastRoundSleeve.task.type){
            if(currentSleeve.task.type === "CRIME"){
                if(currentSleeve.task.cyclesWorked === lastRoundSleeve.task.cyclesWorked){
                    ns.sleeve.setToIdle(currentSleeve.name);
                }
            }
        }
    }
    

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}