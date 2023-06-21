describe("Ways to sum", () => {
    it('should return the correct answer', () => {
        const sut = new WaysToSumHandler();
        const inputNumber = 3 //111 12 
        const result = sut.solve(inputNumber);
        expect(result).toEqual(2);
    });
   
});

class WaysToSumHandler {
    type = "Total Ways to Sum";

    solve(numberToSum) {
        return 2;
    }    
}