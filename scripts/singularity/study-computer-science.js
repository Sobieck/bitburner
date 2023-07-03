export async function main(ns) {
    const player = ns.getPlayer();
    const currentWork = ns.singularity.getCurrentWork();

    if (!player.factions && !currentWork) {
        ns.singularity.universityCourse("Rothman University", "Computer Science", true);
        return;
    }
}