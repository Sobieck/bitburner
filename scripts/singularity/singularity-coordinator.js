export async function main(ns) { 

    ns.run('scripts/singularity/join-organziations.js');

    await ns.sleep(20)

    ns.run('scripts/singularity/do-work.js');
}