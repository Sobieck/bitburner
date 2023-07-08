// let savedContractsFileNameForHuman;

const thisRoundsContractsFileName = "data/contracts.txt"; 

export async function main(ns) {
    const allContracts = [];

    JSON
        .parse(ns.read('../../data/enviroment.txt'))
        .map(server => {
            const hostName = server.name;
            ns
                .ls(hostName)
                .filter(file => file.endsWith('.cct'))
                .map(contract => {
                    const cont = new Contract(
                        hostName,
                        contract,
                        ns.codingcontract.getContractType(contract, hostName),
                        ns.codingcontract.getNumTriesRemaining(contract, hostName)
                    );

                    allContracts.push(cont);
                });
        });
    

    ns.rm(thisRoundsContractsFileName);
    ns.write(thisRoundsContractsFileName, JSON.stringify(allContracts), "W");
}

class Contract {
    constructor(server, name, type, attemptsLeft, input, description) {
        this.server = server;
        this.name = name;
        this.type = type;
        this.attemptsLeft = attemptsLeft;
        this.input = input;
        this.description = description;
    }
}
