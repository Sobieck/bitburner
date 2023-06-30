export async function main(ns) { 
   
    ns.run('scripts/singularity/join-organziations.js');

    await ns.sleep(200)

    ns.run('scripts/singularity/do-work.js');

    // ns.run('scripts/investments/purchase-server.js')
    // await ns.sleep(individualSleepAmount);

    await ns.sleep(200);

    ns.run('scripts/singularity/investments.js')

}