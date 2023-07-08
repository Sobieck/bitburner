const thisRoundsContractsFileName = "data/contracts.txt"; 
let savedContractsFileNameForHuman;

export async function main(ns) {

    let savedContracts;

    const contractsFromThisRound = JSON.parse(ns.read(thisRoundsContractsFileName));

    if(savedContractsFileNameForHuman){
        savedContracts = JSON.parse(ns.read(savedContractsFileNameForHuman));
    }

    if (!savedContracts || contractsFromThisRound.length === 0 && savedContracts.length > 0){
        const now = new Date();
        savedContractsFileNameForHuman = `contracts/${now.toISOString()}.txt`
    }

    ns.rm(savedContractsFileNameForHuman);
    ns.write(savedContractsFileNameForHuman, JSON.stringify(contractsFromThisRound), "W");
}