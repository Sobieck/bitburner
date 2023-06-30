export async function main(ns) { 
   
    ns.run('scripts/singularity/join-organziations.js');

    await ns.sleep(200)

    ns.run('scripts/singularity/do-work.js');

    await ns.sleep(200);

    ns.run('scripts/singularity/investments.js');

    await ns.sleep(200);

    ns.run('scripts/singularity/finish-round.js');
}