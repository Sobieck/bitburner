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
        expect(result).toBe(102);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([3, [1, 3, 2, 5, 2, 100]]);
        expect(result).toBe(103);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([3000, [1, 3, 2, 5, 2, 100]]);
        expect(result).toBe(103);
    });

    it('should return the highest profit correctly', () => {
        const result = sut.solve([3, [1, 3, 2, 5, 4, 6, 3, 100]]);
        expect(result).toBe(103);
    });

    it('should return the highest profit correctly for an afterRedpill exc', () => {
        const result = sut.solve([10000, [139, 161, 23, 42, 103, 76, 5, 13, 90, 84]]);
        expect(result).toBe(187);
    });

    it('should work for rothman but didnt', () => {
        const arrayToUse = [131, 143, 64, 87, 52, 35, 148, 92, 6, 16, 147, 122, 163, 38, 90, 86, 84, 47, 133, 50, 106, 12, 14, 24, 109, 166, 188, 191, 10, 135, 197, 128, 35, 140, 148, 90, 22, 26, 187, 40, 194, 10, 108, 92, 155, 5];
        const result = sut.solve([arrayToUse.length, arrayToUse]);
        expect(result).toBe(1483);
    });

    it('Algorithmic Stock Trader III, avmnite-02h, contract-107923.cct', () => {
        const arrayToUse = [32, 26, 76, 50, 172, 192, 197, 167, 4, 173, 70, 140, 64, 59, 85, 193, 199, 135, 64, 168, 190, 110, 47, 190, 55, 32, 34, 12, 2, 134, 133, 8, 159, 38, 16, 78, 93, 62, 128, 155, 4, 32];
        const result = sut.solve([2, arrayToUse]);
        expect(result).toBe(366);
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
