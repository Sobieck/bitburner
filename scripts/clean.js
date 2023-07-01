//run scripts/clean.js 
export async function main(ns) {
    let newMachine = false;

    if (ns.args[0] === "new") {
        newMachine = true;
    }

    if (!newMachine && !ns.fileExists("stopInvesting.txt")) {
        ns.tprint("must add stopInvesting.txt to server.");
        return;
    }



    if (!newMachine) {
        ns.killall("home", true);

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
    ns.rm('stopInvesting.txt');
    ns.rm('data/stockHistory.txt');
    ns.rm('data/contractData.txt');
    ns.rm('data/serversUsedForBatching.txt');
    ns.rm('data/batchQueue.txt')
    ns.rm('buyOrUpgradeServerFlag.txt');
    ns.rm('data/organizations.txt');
    ns.rm('data/ramObservations.txt');
    ns.rm('data/typeOfServerPurchase.txt');
    ns.rm("data/factionToMax.txt");
    ns.rm('stopTrading.txt');
}