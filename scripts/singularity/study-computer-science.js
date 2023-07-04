export async function main(ns) {
    const player = ns.getPlayer();
    const currentWork = ns.singularity.getCurrentWork();

    if (player.factions.length === 0 && !currentWork) {
        ns.singularity.universityCourse("Rothman University", "Computer Science", true);
        return;
    }
}