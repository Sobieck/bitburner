export async function main(ns) {

    const player = ns.getPlayer();
    const currentWork = ns.singularity.getCurrentWork();


    if (!currentWork || currentWork.type !== "FACTION" || currentWork.type !== "CREATE_PROGRAM") {

        const workTarget = "ECorp";

        ns.singularity.applyToCompany(workTarget, "software");

        if (player.jobs.ECorp) {

            if (!currentWork || !currentWork.type === "COMPANY") {
                await ns.singularity.workForCompany(workTarget, player.jobs.ECorp);
            }
        }
    }
}