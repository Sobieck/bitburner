export async function main(ns) {
    const player = ns.getPlayer();
    const currentWork = ns.singularity.getCurrentWork();

    if (!currentWork && player.skills.hacking < 1000) {
        ns.singularity.universityCourse("Rothman University", "Computer Science", true);
    }
}