/** @param {NS} ns */
export async function main(ns) {

    const targetName = ns.args[0];

    const batchQueuesFileName = "data/batchQueue.txt"

    let batchQueueForDifferentTargets = new Map();
    if (ns.fileExists(batchQueuesFileName)) {
        batchQueueForDifferentTargets = new Map(JSON.parse(ns.read(batchQueuesFileName)));
    }

    const target = batchQueueForDifferentTargets.get(targetName);

    for (const batch of target.batchesQueue) {
        batch.jobs.map(x => {
            if (x.pid) {
                ns.kill(x.pid);
            }
        });
    };

    batchQueueForDifferentTargets.delete(targetName);

    ns.rm(batchQueuesFileName);
    ns.write(batchQueuesFileName, JSON.stringify(Array.from(batchQueueForDifferentTargets.entries()), "W"));

}
