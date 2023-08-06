export async function main(ns) {

    const currentWork = ns.singularity.getCurrentWork();
    const ownedAugmentations = JSON.parse(ns.read("data/ownedAugs.txt"));

    if (currentWork 
        && currentWork.type === "CLASS" 
        && currentWork.location === "Rothman University"
        && currentWork.classType === "Leadership") {

        if(!ownedAugmentations.includes("SmartJaw") && currentWork.type !== "GRAFTING"){
            ns.singularity.travelToCity("New Tokyo")
            ns.grafting.graftAugmentation("SmartJaw", true);
        }
    }
}
