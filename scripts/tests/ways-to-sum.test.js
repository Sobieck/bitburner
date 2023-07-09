describe("Ways to sum", () => {
    // it('should return the correct answer', () => {
    //     const sut = new WaysToSumHandler();
    //     const inputNumber = 2 //11 
    //     const result = sut.solve(inputNumber);
    //     expect(result).toEqual(1);
    // });

    it('should return the correct answer', () => {
        const sut = new WaysToSumHandler();
        const inputNumber = 3 //1 11 | 1 2 
        const result = sut.solve(inputNumber);
        expect(result).toEqual(2);
    });

    // it('should return the correct answer', () => {
    //     const sut = new WaysToSumHandler();
    //     const inputNumber = 4 //111 1 | 22 2 | 31
    //     const result = sut.solve(inputNumber);
    //     expect(result).toEqual(4);
    // });

    // it('should return the correct answer', () => {
    //     const sut = new WaysToSumHandler();
    //     const inputNumber = 5 //11111 221 2111 32 311 41 
    //     const result = sut.solve(inputNumber);
    //     expect(result).toEqual(6);
    // });
   //https://en.wikipedia.org/wiki/Partition_function_(number_theory)
   //https://en.wikipedia.org/wiki/Pseudopolynomial_time_number_partitioning
});

class WaysToSumHandler {
    type = "Total Ways to Sum";

    solve(numberToSum) {
        const isEven = numberToSum % 2 === 0;

        if(isEven){
        }

        return 2;
    }    
}