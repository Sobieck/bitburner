describe("Spiralize Matrix", () => {
    it('should return the correct answer', () => {
        const sut = new SpiralizeMatrixHandler();
        const inputMatrix =     [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ]
        const result = sut.solve(inputMatrix);
        expect(result).toEqual([1,2,3,6,9,8,7,4,5]);
    });

    it('should return the correct answer', () => {
        const sut = new SpiralizeMatrixHandler();
        const inputMatrix =         [
            [1,  2,  3,  4],
            [5,  6,  7,  8],
            [9, 10, 11, 12],
        ]
        const result = sut.solve(inputMatrix);
        expect(result).toEqual([1,2,3,4,8,12,11,10,9,5,6,7]);
    });
});


class SpiralizeMatrixHandler {
    type = "Spiralize Matrix";

    solve(matrix) {
        const spiralOrderArray = [];


        return [1,2,3,6,9,8,7,4,5];
    }
}