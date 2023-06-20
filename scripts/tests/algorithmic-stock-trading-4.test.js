describe("AlgorithmicStockTrading4Handler", () => {
    let sut;
    beforeEach(() => {
        sut = new AlgorithmicStockTrading4Handler();
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([200, [1]]);
        expect(result).toBe(0);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([0, [1, 100]]);
        expect(result).toBe(0);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([1, [1, 100, 99, 98, 97, 95, 35, 25, 15, 10]]);
        expect(result).toBe(99);
    });


    it('should return the highest profit correctly', () => {
        const result = sut.solve([12, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]);
        expect(result).toBe(0);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([1, [149, 150, 1, 100, 3, 98, 2, 99]]);
        expect(result).toBe(99);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([1, [1, 100, 3, 98, 2, 99]]);
        expect(result).toBe(99);
    });


    it('should return the highest profit correctly', () => {
        const result = sut.solve([1, [1, 100]]);
        expect(result).toBe(99);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([1, [1, 10_000, 2, 100]]);
        expect(result).toBe(9_999);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([1, [1_001, 1_000, 10_000, 2, 100]]);
        expect(result).toBe(9_000);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([1, [1_001, 1_000, 2, 100, 10_000]]);
        expect(result).toBe(9_998);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([100, [11_000, 10_000, 100, 10, 0]]);
        expect(result).toBe(0);
    });


    it('should return the highest profit correctly', () => {
        const result = sut.solve([2, [1, 10_000, 2, 100]]);
        expect(result).toBe(10_097);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([2, [1, 2, 10_000, 100, 3]]);
        expect(result).toBe(9_999);
    });

    it('should return the highest profit correctly', () => { //87
        const result = sut.solve([1, [70, 150, 54, 153, 180, 61, 181, 53, 80, 18, 50, 105, 77]]);
        expect(result).toBe(127);
    });

    it('should return the highest profit correctly', () => { //87
        const result = sut.solve([2, [70, 150, 54, 153, 180, 61, 181, 53, 80, 18, 105, 77]]);
        expect(result).toBe(246);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([3, [70, 150, 54, 153, 180, 61, 181, 53, 80, 18, 105, 77]]);
        expect(result).toBe(333);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([4, [70, 150, 54, 153, 180, 61, 181, 53, 80, 18, 105, 77]]);
        expect(result).toBe(413);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([5, [70, 150, 54, 153, 180, 61, 181, 53, 80, 18, 105, 77]]);
        expect(result).toBe(440); //
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([6, [70, 150, 54, 153, 180, 61, 181, 53, 80, 18, 105, 77]]);
        expect(result).toBe(440); //
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([200000, [70, 150, 54, 153, 180, 61, 181, 53, 80, 18, 105, 77]]);
        expect(result).toBe(440); //
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([1, [122, 150, 60, 64, 67, 181, 53, 80, 54, 105, 77]]);
        expect(result).toBe(121);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([2, [122, 150, 60, 64, 67, 181, 53, 80, 54, 105, 77]]);
        expect(result).toBe(173);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([3, [122, 150, 60, 64, 67, 181, 53, 80, 54, 105, 77]]);
        expect(result).toBe(201);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([4, [122, 150, 60, 64, 67, 181, 53, 80, 54, 105, 77]]);
        expect(result).toBe(227);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([5, [122, 150, 60, 64, 67, 181, 53, 80, 54, 105, 77]]);
        expect(result).toBe(227);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([6, [122, 150, 60, 64, 67, 181, 53, 80, 54, 105, 77]]);
        expect(result).toBe(227);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([1, [1, 3, 2, 5, 2, 100]]);
        expect(result).toBe(99);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([2, [1, 3, 2, 5, 2, 100]]); 
        expect(result).toBe(101);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([3, [1, 3, 2, 5, 2, 100]]);
        expect(result).toBe(102);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([3000, [1, 3, 2, 5, 2, 100]]);
        expect(result).toBe(102);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([3, [1, 3, 2, 5, 4, 6, 3, 100]]);
        expect(result).toBe(103);
    });

    it('should return the highest profit correctly for an afterRedpill exc', () => {
        const result = sut.solve([10000, [139, 161, 23, 42, 103, 76, 5, 13, 90, 84]]);
        expect(result).toBe(187);
    });

    it('should work for rothman but didnt',() => {
        const arrayToUse = [131, 143, 64, 87, 52, 35, 148, 92, 6, 16, 147, 122, 163, 38, 90, 86, 84, 47, 133, 50, 106, 12, 14, 24, 109, 166, 188, 191, 10, 135, 197, 128, 35, 140, 148, 90, 22, 26, 187, 40, 194, 10, 108, 92, 155, 5];
        const result = sut.solve([10000, arrayToUse]);
        expect(result).toBe(187);
    });


    
});

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

        for (let i = stockPricesByDay.length - 2; i >= 1; i--) {
            const priceToSeeIfHasNoVolitility = stockPricesByDay[i];

            const yesterdaysPrice = stockPricesByDay[i - 1]
            const tomorrowsPrice = stockPricesByDay[i + 1]

            if(yesterdaysPrice <= priceToSeeIfHasNoVolitility && priceToSeeIfHasNoVolitility <= tomorrowsPrice){
                stockPricesByDay.splice(i, 1);
            }        
        }

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

                // salesSoFar = salesSoFar.filter(x => x.buyDay !== nextBestSale.buyDay);
            }

            salesSoFar.push(new BuyDayForSale(nextBestSale.buyDay, nextBestSale.sellDay, nextMostPotentialQuote))

            maxProfit += nextBestSale.profit;

        }

        return maxProfit;
    }

    tradeStockFirstTry(maxNumberOfTrades, stockTimeSeries, potentialProfitsForEachNumberOfTrades = [0, 0]) {
        if (maxNumberOfTrades === 0) {
            return Math.max(...potentialProfitsForEachNumberOfTrades);
        }

        const timeSeriesLength = stockTimeSeries.length;

        let salePrice = stockTimeSeries[timeSeriesLength - 1];
        let salePriceIndex = timeSeriesLength - 1

        // find sale Price
        for (let i = timeSeriesLength - 1; i > -1; i--) {
            const price = stockTimeSeries[i];
            if (salePrice < price) {
                salePrice = price;
                salePriceIndex = i;
            }

            if (price < salePrice) {
                break;
            }
        }

        let buyPrice = salePrice;
        let buyPriceIndex = salePriceIndex;

        if (salePriceIndex === 0) {
            return 0;
        }


        for (let i = salePriceIndex - 1; i > -1; i--) {
            const price = stockTimeSeries[i];

            if (price <= buyPrice) {
                buyPrice = price;
                buyPriceIndex = i;
            }

            if (price > buyPrice || i === 0) {
                let profit = salePrice - buyPrice;
                const earlierDaysPrices = stockTimeSeries.slice(0, i + 1);

                let bestProfitFromOtherDays = this.tradeStockFirstTry(maxNumberOfTrades, earlierDaysPrices)

                if (bestProfitFromOtherDays > profit) {
                    if (maxNumberOfTrades === 1) {
                        profit = bestProfitFromOtherDays;
                    }
                    else {
                        bestProfitFromOtherDays = this.tradeStockFirstTry(maxNumberOfTrades - 1, earlierDaysPrices)
                        profit += bestProfitFromOtherDays;
                    }
                }

                potentialProfitsForEachNumberOfTrades.push(profit);
            }
        }

        return this.tradeStockFirstTry(maxNumberOfTrades - 1, stockTimeSeries, potentialProfitsForEachNumberOfTrades)
    }
}

class BuyDayForSale {
    constructor(buyDay, sellDay, quote) {
        this.buyDay = buyDay;
        this.sellDay = sellDay;
        this.quote = quote;
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

