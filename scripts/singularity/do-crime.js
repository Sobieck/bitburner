export async function main(ns) {

    const player = ns.getPlayer();
    const inGang = true;//ns.gang.inGang();
    const mainPlayerWork = ns.singularity.getCurrentWork();

    if (player.skills.hacking > 25 && !inGang){
        if (!mainPlayerWork || mainPlayerWork.type !== "CRIME") {
            
            ns.singularity.commitCrime(ns.enums.CrimeType.homicide);
            
        }
    } 

    if(inGang && mainPlayerWork.type === "CRIME"){
        ns.singularity.stopAction();
    }
}