export async function main(ns) {
    const loopEveryXSeconds = 2;
    const sleepTotalOfXMS = loopEveryXSeconds * 1000;

    let runClean = true;
    if (ns.args[0] === 'old') {
        runClean = false;
    }

    if (runClean) {
        ns.run('scripts/clean.js', 1, "new");
        await ns.sleep(1000);
    }

    ns.run('scripts/script-registry.js')

    await ns.sleep(200);

    ns.run('scripts/precalculate-important-data.js')

    await ns.sleep(200);

    const scriptsFile = 'data/scriptsToRun.txt';

    while (true) {

        let scriptsToRun = JSON.parse(ns.read(scriptsFile));

        let individualSleepAmount = sleepTotalOfXMS / scriptsToRun.length;

        for (const script of scriptsToRun) {
            ns.run(script);
            await ns.sleep(individualSleepAmount);
        }
    }
}

