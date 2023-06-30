export async function main(ns) {
    const target = ns.args[0]

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const serverWithLineage = enviroment.find(x => x.name === target);

    for (const server of serverWithLineage.lineage) {
        await ns.singularity.connect(server);
    }

    await ns.singularity.connect(target);
}