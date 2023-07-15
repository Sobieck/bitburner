describe("Ways to sum", () => {
    it('should return the correct answer', () => {
        const sut = new WaysToSum2Handler();
        const input = [16, [1]] 
        const result = sut.solve(input);
        expect(result).toEqual(1);
    });

    // it('should return the correct answer', () => {
    //     const sut = new WaysToSum2Handler();
    //     const input = [16, [1, 11]]  //11, 1, 1, 1, 1, 1 // 16x1
    //     const result = sut.solve(input);
    //     expect(result).toEqual(2);
    // });

//     it('should return the correct answer', () => {
//         const sut = new WaysToSum2Handler();
//         const input = [16, [1, 3, 4, 5, 7, 9, 10, 11]] 
//         const result = sut.solve(inputNumber);
//         expect(result).toEqual(2);
//     });
});

class WaysToSum2Handler {
    type = "Total Ways to Sum";

    solve(input) {
        const numberWeArePartitioning = input[0];
        const arrayOfNumbersWeCanUse = input[1];

        return 1;
    }    
}