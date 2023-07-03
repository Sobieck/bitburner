export async function main(ns) { 
    await doSingularityWork(ns, 'join-organziations');
    await doSingularityWork(ns, 'do-work');
    await doSingularityWork(ns, 'investments');
    await doSingularityWork(ns, 'finish-round');
    await doSingularityWork(ns, 'finish-bitnode');
    await doSingularityWork(ns, 'study-computer-science');
    await doSingularityWork(ns, 'create-early-programs');
    await doSingularityWork(ns, 'do-job');
    await doSingularityWork(ns, 'buy-rep');
    await doSingularityWork(ns, 'workout');
}

async function doSingularityWork(ns, script){
    ns.run(`scripts/singularity/${script}.js`);

    await ns.sleep(50)
}