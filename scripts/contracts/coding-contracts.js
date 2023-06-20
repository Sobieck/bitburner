//run scripts/coding-contracts.js
export async function main(ns) {
    const solverRegistry = [
        new LzDecompression2Handler(),
        new AlgorithmicStockTrading4Handler(),
        new AlgorithmicStockTrading3Handler(),
        new AlgorithmicStockTrading1Handler(),
        new AlgorithmicStockTrading2Handler()
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

class AlgorithmicStockTrading1Handler {
    type = 'Algorithmic Stock Trader I';
    solve(input) {
        let maxNumberOfTrades = 1;
        const stockPricesByDay = input;

        if (stockPricesByDay.length < maxNumberOfTrades) {
            maxNumberOfTrades = stockPricesByDay.length;
        }

        return new AlgorithmicStockTrading4Handler().tradeStockWithMoreStucture(maxNumberOfTrades, stockPricesByDay);;
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

        return new AlgorithmicStockTrading4Handler().tradeStockWithMoreStucture(maxNumberOfTrades, stockPricesByDay);;
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

        return new AlgorithmicStockTrading4Handler().tradeStockWithMoreStucture(maxNumberOfTrades, stockPricesByDay);;
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

        return this.tradeStockWithMoreStucture(maxNumberOfTrades, stockPricesByDay);;
    }

    tradeStockWithMoreStucture(maxNumberOfTrades, stockPricesByDay) {
        let potentialSales = []

        for (let i = stockPricesByDay.length - 1; i >= 1; i--) {
            const priceToSeeIfHasNoVolitility = stockPricesByDay[i];

            const yesterdaysPrice = stockPricesByDay[i - 1]
            const tomorrowsPrice = stockPricesByDay[i + 1]

            if(
                (yesterdaysPrice <= priceToSeeIfHasNoVolitility && priceToSeeIfHasNoVolitility <= tomorrowsPrice) || // rising prices filter
                (!tomorrowsPrice && yesterdaysPrice >= priceToSeeIfHasNoVolitility) || // end price
                (yesterdaysPrice >= priceToSeeIfHasNoVolitility && priceToSeeIfHasNoVolitility >= tomorrowsPrice)) { // falling price filter
                stockPricesByDay.splice(i, 1);
            }        
        }

        console.log(stockPricesByDay)

        for (let i = 0; i < stockPricesByDay.length; i++) {
            const price = stockPricesByDay[i];
            potentialSales.push(new Quote(i, price));
        }

        const numberOfDays = potentialSales.length;

        for (let sellDay = numberOfDays - 1; sellDay > -1; sellDay--) {
            const sellQuote = potentialSales[sellDay];

            for (let buyDay = 0; buyDay < sellDay; buyDay++) {
                const buyQuote = potentialSales[buyDay];

                if (buyQuote.price < sellQuote.price) {
                    sellQuote.potentialTransations.push(new Sale(buyDay, sellDay, buyQuote.price, sellQuote.price));
                }
            }
        }

        // clean and rank transactions
        potentialSales = potentialSales
            .filter(x => x.potentialTransations.length !== 0);

        for (let i = 0; i < potentialSales.length; i++) {
            const salesDay = potentialSales[i];

            function sortByProfitThenDaysHeld(a,b){
                if(b.profit > a.profit){
                    return 1;
                } else if(b.profit < a.profit) {
                    return -1;
                }

                if(b.daysHeld < a.daysHeld){
                    return 1;
                } else if(b.daysHeld > a.daysHeld) {
                    return -1;
                }
            }

            salesDay.potentialTransations = salesDay.potentialTransations.sort(sortByProfitThenDaysHeld);

            let moreProfitableHoldingPeriod = salesDay.potentialTransations[0].daysHeld;

            function filterPotentialTransactionsByDaysHeld(potentialTransaction) {
                if (potentialTransaction.daysHeld <= moreProfitableHoldingPeriod) {
                    moreProfitableHoldingPeriod = potentialTransaction.daysHeld;
                    return true;
                } else {
                    return false;
                }
            }

            salesDay.potentialTransations = salesDay.potentialTransations.filter(filterPotentialTransactionsByDaysHeld);
        }
      

        if(potentialSales.length > 0){
            const allPotentialTransactions = potentialSales.map(x => x.potentialTransations).reduce((acc, x) => acc.concat(x));

            for (const potentialSale of potentialSales) {
                for (let i = potentialSale.potentialTransations.length - 1; i >= 0; i--) {
                    const itemToSeeIfWeShouldDeleteBecauseItIsUseless = potentialSale.potentialTransations[i];
                    const isThereABetterTransaction = allPotentialTransactions
                        .find(x => x.profit > itemToSeeIfWeShouldDeleteBecauseItIsUseless.profit && 
                            x.sellDay > itemToSeeIfWeShouldDeleteBecauseItIsUseless.buyDay &&
                            x.sellDay < itemToSeeIfWeShouldDeleteBecauseItIsUseless.sellDay);
    
                    if (isThereABetterTransaction) {
                        potentialSale.potentialTransations.splice(i, 1);
                    }
                }
    
                if (potentialSale.potentialTransations.length > 1) {
                    let previousTransacationProfit = potentialSale.potentialTransations[0].profit
                    for (let i = 1; i < potentialSale.potentialTransations.length; i++) {
                        const transaction = potentialSale.potentialTransations[i];
                        transaction.differnceBetweenThisProfitAndABetterAlbeitLongerTermProfit = transaction.profit - previousTransacationProfit;
                    }
                }
    
            }
        }

        potentialSales = potentialSales.filter(x => x.potentialTransations.length !== 0).sort((a, b) => b.profitOfMostValuableTransation() - a.profitOfMostValuableTransation());




        let salesSoFar = []
        let maxProfit = 0

        if (potentialSales.length < maxNumberOfTrades) {
            maxNumberOfTrades = potentialSales.length;
        }

        for (let trade = 0; trade < maxNumberOfTrades; trade++) {
            const nextMostPotentialQuote = potentialSales[trade];
            const nextBestSale = nextMostPotentialQuote.potentialTransations[0];

            const oldSale = salesSoFar.find(x => x.buyDay === nextBestSale.buyDay); // this needs expanding on
            //the only conflicts should be buy days. with a smaller peak and trough between an even higher sale price. So the first potential sale will have the conflict. 
            if (oldSale) {
                //new transaction before so we need to account for that from the old profit
                const sellDayOfNewTransaction = nextBestSale.sellDay;

                const transactionToAccountFor = oldSale.quote.potentialTransations.find(x => x.buyDay >= sellDayOfNewTransaction)

                maxProfit += transactionToAccountFor.differnceBetweenThisProfitAndABetterAlbeitLongerTermProfit;

                salesSoFar = salesSoFar.filter(x => x.uniqueId !== oldSale.uniqueId);
            }

            salesSoFar.push(new BuyDayForSale(nextBestSale.buyDay, nextBestSale.sellDay, nextMostPotentialQuote))

            maxProfit += nextBestSale.profit;

        }

        return maxProfit;
    }
}

class BuyDayForSale {
    constructor(buyDay, sellDay, quote) {
        this.buyDay = buyDay;
        this.sellDay = sellDay;
        this.quote = quote;
        this.uniqueId = Math.random();
    }
}

class Quote {
    constructor(sellDay, price) {
        this.sellDay = sellDay;
        this.price = price;
        this.potentialTransations = [];
    }

    profitOfMostValuableTransation() {
        return this.potentialTransations[0].profit;
    }

    buyDays() {
        return this.potentialTransations.map(x => x.buyDay);
    }
}

class Sale {
    constructor(buyDay, sellDay, buyPrice, sellPrice) {
        this.buyDay = buyDay;
        this.sellDay = sellDay;
        this.sellPrice = sellPrice;
        this.buyPrice = buyPrice;
        this.profit = this.sellPrice - this.buyPrice;
        this.daysHeld = this.sellDay - this.buyDay;
        this.differnceBetweenThisProfitAndABetterAlbeitLongerTermProfit = 0;        
    }
}

