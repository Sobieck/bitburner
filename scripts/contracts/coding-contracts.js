//run scripts/coding-contracts.js
export async function main(ns) {
    const solverRegistry = [
        new LzDecompression2Handler()
    ]

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
                        ns.codingcontract.getNumTriesRemaining(contract, hostName),
                        ns.codingcontract.getData(contract, hostName),
                        ns.codingcontract.getDescription(contract, hostName),
                    );

                    allContracts.push(cont);
                });
        });

    allContracts
        .forEach(contract => {
            if (contract.attemptsLeft === 10 || contract.attemptsLeft === 5) {
                const solver = solverRegistry.find(x => x.type === contract.type);

                if (solver) {
                    const result = solver.solve(contract.input);
                    const success = ns.codingcontract.attempt(result, contract.name, contract.server);
                    if (success === "") {
                        ns.alert(`${contract.name} on ${contract.server} had a problem solving. You need to figure this out.`);
                    } else {
                        ns.toast(`Contract completed: ${success}`, "success", null);
                    }
                }
            }
        });

    ns.rm("../../data/contractData.txt");
    ns.write("../../data/contractData.txt", JSON.stringify(allContracts), "W");
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

class LzDecompression2Handler {
    type = 'Compression II: LZ Decompression';

    solve(input) {
        return this.lzDecompression(input);
    }

    /// all need to be worked on in tests. These are just copies.
    lzDecompression(stringToDecode) {
        let decompressedString = '';
        let startOfNextChunk = 0
        let nextSectionCompressed = false;


        while (startOfNextChunk < stringToDecode.length) {
            const chunkLength = Number(stringToDecode[startOfNextChunk]);


            if (chunkLength === 0) {
                startOfNextChunk++;
                nextSectionCompressed = !nextSectionCompressed;
                continue;
            }

            if (nextSectionCompressed) {
                const nextCharacterInEncoded = parseInt(stringToDecode[startOfNextChunk + 1]);

                const placesBack = nextCharacterInEncoded;
                const startText = decompressedString.length - placesBack;
                const endOfText = startText + chunkLength;

                if (chunkLength <= nextCharacterInEncoded) {
                    decompressedString += decompressedString.slice(startText, endOfText);
                } else {
                    let nextChunk = "";
                    const partialChunk = decompressedString.slice(startText, endOfText);

                    while (nextChunk.length < chunkLength) {
                        if (nextChunk.length + partialChunk.length > chunkLength) {
                            const howMuchLeftInChunk = chunkLength - nextChunk.length;
                            nextChunk += partialChunk.slice(0, howMuchLeftInChunk)
                        } else {
                            nextChunk += partialChunk;
                        }
                    }

                    decompressedString += nextChunk;
                }

                startOfNextChunk += 2;
                nextSectionCompressed = false;
            } else {
                const startText = startOfNextChunk + 1;
                const endOfText = startText + chunkLength;
                decompressedString += stringToDecode.slice(startText, endOfText);
                startOfNextChunk = endOfText;
                nextSectionCompressed = true;
            }
        }


        return decompressedString;
    }
}