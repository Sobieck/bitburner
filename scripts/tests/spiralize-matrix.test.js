describe("Spiralize Matrix", () => {
    it('should return the correct answer', () => {
        const sut = new SpiralizeMatrixHandler();
        const inputMatrix = [
            [1, 2],
            [4, 5],
        ]
        const result = sut.solve(inputMatrix);
        expect(result).toEqual([1, 2, 5, 4]);
    });

    it('should return the correct answer', () => {
        const sut = new SpiralizeMatrixHandler();
        const inputMatrix = [
            [1, 2],
            [4, 5],
            [7, 8],
        ]
        const result = sut.solve(inputMatrix);
        expect(result).toEqual([1, 2, 5, 8, 7, 4]);
    });

    it('should return the correct answer', () => {
        const sut = new SpiralizeMatrixHandler();
        const inputMatrix = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ]
        const result = sut.solve(inputMatrix);
        expect(result).toEqual([1, 2, 3, 6, 9, 8, 7, 4, 5]);
    });

    it('should return the correct answer', () => {
        const sut = new SpiralizeMatrixHandler();
        const inputMatrix = [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
        ]
        const result = sut.solve(inputMatrix);
        expect(result).toEqual([1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]);
    });

    it('should return the correct answer', () => {
        const sut = new SpiralizeMatrixHandler();
        const inputMatrix = [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16],
        ]
        const result = sut.solve(inputMatrix);
        expect(result).toEqual([1, 2, 3, 4, 8, 12, 16, 15, 14, 13, 9, 5, 6, 7, 11, 10]);
    });
});


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