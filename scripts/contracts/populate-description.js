export async function main(ns) {

    const contracts = JSON.parse(ns.read(thisRoundsContractsFileName))

    for (const contract of contracts) {
        const hostName = contract.server;
        const contractName = contract.name;
        contract.description = ns.codingcontract.getDescription(contractName, hostName);
    }

    ns.rm(thisRoundsContractsFileName);
    ns.write(thisRoundsContractsFileName, JSON.stringify(contracts), "W");
}

const thisRoundsContractsFileName = "data/contracts.txt"; 