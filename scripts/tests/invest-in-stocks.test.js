    // every 12 seconds check portfolio

    // close all positions all flag if sell.txt file exists on server. 
        // do not allow clean to run if invest-in-stocks.js is running on server. We need clean closes for this.  



    // check to see if positions are taking the wrong direction. Meaning they go below 55% on longs or above 45% on shorts. 
    //  sell phase when they go the wrong direction
    //  use getStockPosition(sym) to double check data.
    //  add to to gains documents. Basically just take the entry from buying, add sell date and price. Say way the bias was at sale. 

    // go into the purchase phase if we have more than 100b dollars. 
        // Pick only the best one to buy. And only pick it if it is above 60% or below 40%
        // check to see if we already own the max shares
        // if we do we move on to the next oppo

        // add to portfolio document. DateTime.local for when Purchased. Shares, price, total spent. Bias. Short or long. If we own max shares bool. Shares left to buy
    
   
    class MockNs {
        constructor(moneyAvailable) {
            this.moneyAvailable = moneyAvailable;
            this.hostOfGetServerMoneyAvailable = "";
        }
    
        getServerMoneyAvailable(host) {
            this.hostOfGetServerMoneyAvailable = host;
            return this.moneyAvailable;
        }
    }

    describe("Stock Trading", () => {
        let ns;
    
        beforeEach(() => {

        });

        describe("calculatingBias", () => {
            it("should return 0 when forecast is 0.5.", () => {
                const sut = new Stock("", .5);
                expect(sut.bias).toBe(0);
            });

            it("should return 0.1 when forecast is 0.6.", () => {
                const sut = new Stock("", .6);
                expect(sut.bias).toBeCloseTo(.1);
            });

            it("should return 0.1 when forecast is 0.4.", () => {
                const sut = new Stock("", .4);
                expect(sut.bias).toBeCloseTo(.1);
            });

            it("should return 0.5 when forecast is 1.", () => {
                const sut = new Stock("", 1);
                expect(sut.bias).toBe(.5);
            });

            it("should return 0.5 when forecast is 0.", () => {
                const sut = new Stock("", 0);
                expect(sut.bias).toBe(.5);
            });
        });
    });




    class Stock {
        constructor(symbol, forecast, bid, ask, price, maxShares, investedShares, averagePrice, sharesShort, avgShortPrice){
            this.symbol = symbol;
            this.forecast = forecast;
            this.bid = bid;
            this.ask = ask;
            this.price = price;
            this.maxShares = maxShares;
            this.investedShares = investedShares;
            this.averagePrice = averagePrice;
            this.sharesShort = sharesShort;
            this.averageShortPrice = avgShortPrice;

            this.bias = Math.abs(forecast - .5);

        }
    }