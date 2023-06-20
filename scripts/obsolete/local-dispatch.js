/** @param {NS} ns */
export async function main(ns) {
    const nameOfMostValuableServersFile = 'mostValuableServers.txt';
    const mostValuableServers = JSON.parse(ns.read(nameOfMostValuableServersFile));
    let forceMoneyMaking = false;

    if(ns.args[0]){
        forceMoneyMaking = true;
    }
    
    const memoryToSave = 32;
    const maxRam = ns.getServerMaxRam("home") - memoryToSave;

    let serversToAssistWith = mostValuableServers
        .filter(x => x.securityThreshholdTarget > 15);

    if (serversToAssistWith.length === 0 || forceMoneyMaking) {
        const scriptToUse = 'scripts/early-hack.js'
        const ramCost = ns.getScriptRam(scriptToUse);
        serversToAssistWith = mostValuableServers;
        const ramUsePerServer = maxRam / serversToAssistWith.length;
        const threadsPerServer = Math.floor(ramUsePerServer / ramCost)

        serversToAssistWith
            .map(target => {
                ns.run(scriptToUse, threadsPerServer, target.name, target.moneyThreshhold, target.securityThreshholdTarget)
            });

    } else {
        const scriptToUse = 'scripts/local-hack.js';
        const ramCost = ns.getScriptRam(scriptToUse);

        const iterations = 4;
        const totalThreadsOnRemoteServers = serversToAssistWith
            .reduce((sum, x) => sum + x.totalThreadsHacking, 0);
        const gbToUsedPerRound = maxRam / iterations;

        for (let index = 0; index < iterations; index++) {
            serversToAssistWith
                .map(target => {
                    const proportionOfRamToUse = target.totalThreadsHacking / totalThreadsOnRemoteServers;
                    const gbToUse = gbToUsedPerRound * proportionOfRamToUse;
                    const threadsToUse = Math.floor(gbToUse / ramCost)
                    ns.run(scriptToUse, threadsToUse, target.name, target.moneyThreshhold, target.securityThreshholdTarget)
                });

            await ns.sleep(900000) // 15 minutes
        }
    }
}