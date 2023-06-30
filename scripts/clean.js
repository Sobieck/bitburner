//run scripts/clean.js 
export async function main(ns) {
    let newMachine = false;

    if (ns.args[0] === "new") {
        newMachine = true;
    }

    if (!newMachine && !ns.fileExists("stopTrading.txt")) {
        ns.tprint("must add stopTrading.txt to server.");
        return;
    }

    ns.killall("home", true);

    if (!newMachine) {
        const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
        enviroment
            .filter(x => x.server.hasAdminRights)
            .map(target => {
                ns.killall(target.name);
            })
    }


    ns.rm('data/enviroment.txt');
    ns.rm('data/dataOnWhatHappensEachRound.txt');
    ns.rm('data/recordOfWhoIsBeingHacked.txt');
    ns.rm('data/salesLedger.txt');
    ns.rm('stopTrading.txt');
    ns.rm('data/stockHistory.txt');
    ns.rm('data/contractData.txt');
    ns.rm('data/serversUsedForBatching.txt');
    ns.rm('data/batchQueue.txt')
    ns.rm('buyOrUpgradeServerFlag.txt');
}