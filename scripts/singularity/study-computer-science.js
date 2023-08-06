export async function main(ns) {
    const player = ns.getPlayer();
    const currentWork = ns.singularity.getCurrentWork();

    if (!currentWork && player.skills.hacking < 1000) {
        ns.singularity.universityCourse(ns.enums.LocationName.Sector12RothmanUniversity, ns.enums.UniversityClassType.computerScience, true);
    }
}