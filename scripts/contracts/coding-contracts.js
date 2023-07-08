let contractsFileName;

export async function main(ns) {
    const solverRegistry = [
        new LzDecompression2Handler(),
        new AlgorithmicStockTrading4Handler(),
        new AlgorithmicStockTrading3Handler(),
        new AlgorithmicStockTrading1Handler(),
        new AlgorithmicStockTrading2Handler(),
        new SpiralizeMatrixHandler(),
        new Encryption1Handler(),
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
                        const failuresContractsFileName = `contracts/failure/${contract.server}-${contract.name}-${contract.type.replaceAll(" ", "")}.txt`;

                        const saveThis = {contract, result};
                        
                        ns.rm(failuresContractsFileName);
                        ns.write(failuresContractsFileName, JSON.stringify(saveThis), "W");


                        ns.alert(`${contract.name} on ${contract.server} had a problem solving. You need to figure this out.`);
                    } else {
                        ns.toast(`Contract completed: ${success}`, "success", null);
                    }
                }
            }
        });

    const savedContracts = JSON.parse(ns.read(contractsFileName));
    if (allContracts.length === 0 && savedContracts.length > 0){
        const now = new Date();
        contractsFileName = `contracts/${now.toISOString().split('T')[0]}-${String(now.getHours()).padStart(2, 0)}-${String(now.getMinutes()).padStart(2, 0)}.txt`
    }

    ns.rm(contractsFileName);
    ns.write(contractsFileName, JSON.stringify(allContracts), "W");
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

class AlgorithmicStockTrading1Handler {
    type = 'Algorithmic Stock Trader I';
    solve(input) {
        let maxNumberOfTrades = 1;
        const stockPricesByDay = input;

        if (stockPricesByDay.length < maxNumberOfTrades) {
            maxNumberOfTrades = stockPricesByDay.length;
        }

        return new AlgorithmicStockTrading4Handler().tradeStock(maxNumberOfTrades, stockPricesByDay);;
    }
}

class AlgorithmicStockTrading2Handler {
    type = 'Algorithmic Stock Trader II';
    solve(input) {
        let maxNumberOfTrades = input.length;
        const stockPricesByDay = input;

        if (stockPricesByDay.length < maxNumberOfTrades) {
            maxNumberOfTrades = stockPricesByDay.length;
        }

        return new AlgorithmicStockTrading4Handler().tradeStock(maxNumberOfTrades, stockPricesByDay);;
    }
}

class AlgorithmicStockTrading3Handler {
    type = 'Algorithmic Stock Trader III';
    solve(input) {
        let maxNumberOfTrades = 2;
        const stockPricesByDay = input;

        if (stockPricesByDay.length < maxNumberOfTrades) {
            maxNumberOfTrades = stockPricesByDay.length;
        }

        return new AlgorithmicStockTrading4Handler().tradeStock(maxNumberOfTrades, stockPricesByDay);;
    }
}

class AlgorithmicStockTrading4Handler {
    type = 'Algorithmic Stock Trader IV';

    solve(input) {
        let maxNumberOfTrades = input[0];
        const stockPricesByDay = input[1];

        if (stockPricesByDay.length < maxNumberOfTrades) {
            maxNumberOfTrades = stockPricesByDay.length;
        }

        return this.tradeStock(maxNumberOfTrades, stockPricesByDay);;
    }

    tradeStock(maxNumberOfTrades, stockPricesByDay) {
        if (maxNumberOfTrades === 0) {
            return 0;
        }

        let profitsPerTransaction = []

        for (let i = stockPricesByDay.length - 1; i >= 1; i--) {
            const priceToSeeIfHasNoVolitility = stockPricesByDay[i];

            const yesterdaysPrice = stockPricesByDay[i - 1]
            const tomorrowsPrice = stockPricesByDay[i + 1]

            if (
                (yesterdaysPrice <= priceToSeeIfHasNoVolitility && priceToSeeIfHasNoVolitility <= tomorrowsPrice) || // rising prices filter
                (!tomorrowsPrice && yesterdaysPrice >= priceToSeeIfHasNoVolitility) || // end price
                (yesterdaysPrice >= priceToSeeIfHasNoVolitility && priceToSeeIfHasNoVolitility >= tomorrowsPrice)) { // falling price filter
                stockPricesByDay.splice(i, 1);
            }
        }

        for (let i = 0; i < stockPricesByDay.length; i++) {
            const price = stockPricesByDay[i];
            const potentialBuyPrice = stockPricesByDay[i - 1];
            let potentialProfit = 0;

            if (potentialBuyPrice) {
                potentialProfit = price - potentialBuyPrice;
            }

            if (potentialProfit < 0) {
                potentialProfit = 0;
            }


            profitsPerTransaction.push({ price, potentialProfit });
        }

        if (maxNumberOfTrades >= profitsPerTransaction.filter(x => x.potentialProfit > 0).length) {
            return profitsPerTransaction
                .reduce((acc, x) => acc + x.potentialProfit, 0);
        }

        const minProfit = Math.min(...profitsPerTransaction.filter(x => x.potentialProfit !== 0).map(x => x.potentialProfit));
        const countOfMinProfits = profitsPerTransaction.filter(x => x.potentialProfit === minProfit).length;
        const maxPrice = Math.max(...stockPricesByDay);
        const arraysToWorkWith = [];

        for (let i = 0; i < profitsPerTransaction.length; i++) {
            const profitPerTranaction = profitsPerTransaction[i];

            if (profitPerTranaction.potentialProfit === minProfit) {

                const copyOfProfitsPerTransaction = profitsPerTransaction.map(x => x)
                if (profitPerTranaction.price === maxPrice) {
                    copyOfProfitsPerTransaction.splice(i - 1, 1);
                } else {
                    copyOfProfitsPerTransaction.splice(i, 1); // if there is a bigger price in the future, splice sell price. 
                }

                arraysToWorkWith.push(copyOfProfitsPerTransaction.map(x => x.price));
            }

            if (arraysToWorkWith.length === countOfMinProfits) {
                break;
            }
        }

        const potentialProfitsForAllTrades = []
        for (const newArrayOfPrices of arraysToWorkWith) {
            potentialProfitsForAllTrades.push(this.tradeStock(maxNumberOfTrades, newArrayOfPrices))
        }

        return Math.max(...potentialProfitsForAllTrades);

    }
}


class SpiralizeMatrixHandler {
    type = "Spiralize Matrix";

    solve(matrix) {
        return this.solveRecursively(matrix);
    }

    solveRecursively(matrix, spiralOrderResult = []){

        if(matrix.length === 0){
            return spiralOrderResult;
        }

        for (let i = 0; i < matrix.length; i++) {
            if (i === 0 || i === matrix.length - 1) {
                let rowToEmpty = matrix[i];

                if(i === matrix.length - 1 && i !== 0){
                    rowToEmpty.reverse()
                }

                for (let x = 0; x < rowToEmpty.length; x++) {
                    const number = rowToEmpty[x];
                    spiralOrderResult.push(number);
                }

                rowToEmpty.length = 0
            } else {
                let rowBeingUsed = matrix[i];

                spiralOrderResult.push(rowBeingUsed.pop());
            }
        }      

        
        for (let i = matrix.length - 1; i > -1; i--) {
            if(matrix[i].length === 0){
                matrix.splice(i, 1);
            }
        }

        for (let i = matrix.length - 1; i > -1; i--) {
            const row = matrix[i];
            row.reverse();
            spiralOrderResult.push(row.pop());
            row.reverse();            
        }

        return this.solveRecursively(matrix, spiralOrderResult)
    }
}

class Encryption1Handler {
    type = 'Encryption I: Caesar Cipher';

    solve([string, shift]) {

        let returnString = "";

        if (string) {
            for (const character of string) {
                if (character === " ") {
                    returnString += " ";
                }
                else {
                    const charCode = character.charCodeAt(0);

                    if (charCode) {
                        let newCharCode = charCode - shift;

                        if (newCharCode < 65) {
                            const amountLessThan65 = 65 - newCharCode;
                            newCharCode = 91 - amountLessThan65;
                        }

                        returnString += String.fromCharCode(newCharCode);
                    }
                }
            }
        }

        return returnString;
    }
}
