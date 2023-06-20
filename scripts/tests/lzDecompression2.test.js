//Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. In this variant of LZ, data is encoded in two types of chunk. Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, which is either:

//  1. Exactly L characters, which are to be copied directly into the uncompressed data.
//  2. A reference to an earlier part of the uncompressed data. To do this, 
//the length is followed by a second ASCII digit X: each of the L output characters 
//is a copy of the character X places before it in the uncompressed data.

//  For both chunk types, a length of 0 instead means the chunk ends immediately, 
//and the next character is the start of a new chunk. The two chunk types alternate, 
//starting with type 1, and the final chunk may be of either type.

//  You are given the following LZ-encoded string:
//    5zDjVt8527r321u627lS111Ff487ljazpD1399KBtXEmVkC119sGs4Mm23r35
//  Decode it and output the original string.

//  Example: decoding '5aaabb450723abb' chunk-by-chunk
//  5aaabb -> aaabb
//  5aaabb45   -> aaabbaaab
//    5aaabb450    -> aaabbaaab
//    5aaabb45072   -> aaabbaaababababa
//    5aaabb450723abb -> aaabbaaababababaabb



describe("lzDecompression", () => {
    let sut;

    beforeEach(() => {
        sut = new LzDecompression2Handler();
    });


    it('should return basic chunk correctly', () => {
        const result = sut.solve('5aaabb');
        expect(result).toBe('aaabb');
    });

    it('should return basic chuck correctly', () => {
        const result = sut.solve('5zDjVt');
        expect(result).toBe('zDjVt');
    })

    it('should return a loopback chunk correctly', () => {
        const result = sut.solve('5aaabb45');
        expect(result).toBe('aaabbaaab');
    });

    it('should return a loopback chunk correctly', () => {
        const result = sut.solve('5aaabb450');
        expect(result).toBe('aaabbaaab');
    });

    it('should return a short loopback correctly', () => {
        const result = sut.solve('5aaabb45072');
        expect(result).toBe('aaabbaaababababa');
    });

    it('should return first chunk correctly', () => {
        const result = sut.solve('5aaabb450723abb');
        expect(result).toBe('aaabbaaababababaabb');
    });

    it('should do logic alternatingly', () => {
        const result = sut.solve('8PTukRyMl3155I5lf825yYLQL');
        expect(result).toBe('PTukRyMllll5I5lflflflflfyYLQL');
    })

    it('answer to contract-352596.cct on harakiri', () => { // worked
        const result = sut.solve('8PTukRyMl3155I5lf825yYLQL136g8CFI2998Q7Kg8CcX611L967lxh2XIl');
        expect(result).toBe('PTukRyMllll5I5lflflflflfyYLQLLg8CFI2QLLg8CFI2Q7Kg8CcXXXXXXXLXXXXXLXXXlxh2XIl');
    })

    it('problem froo contract-616130-ECorp.cct', () =>{
        const result = sut.solve('5zDjVt85');
        expect(result).toBe('zDjVtzDjVtzDj'); 
    })

    it('problem froo contract-616130-ECorp.cct', () =>{
        const result = sut.solve('5zDjVt8527r');
        expect(result).toBe('zDjVtzDjVtzDj7r'); 
    })

    it('problem froo contract-616130-ECorp.cct', () =>{
        const result = sut.solve('5zDjVt8527r32');
        expect(result).toBe('zDjVtzDjVtzDj7r7r7'); 
    })

    it('problem froo contract-616130-ECorp.cct', () =>{
        const result = sut.solve('5zDjVt8527r321u62');
        expect(result).toBe('zDjVtzDjVtzDj7r7r7u7u7u7u');
    })

    it('answer to contract-616130-ECorp.cct', () =>{
        const result = sut.solve('5zDjVt8527r321u627lS111Ff487ljazpD1399KBtXEmVkC119sGs4Mm23r35');
        expect(result).toBe('zDjVtzDjVtzDj7r7r7u7u7u7ulS111FfulS1ljazpD1S1lKBtXEmVkCCsGs4Mm23rMm2');
    })

    // it('should return first chunk correctly', () => {
    //     const result = sut.solve('4miss433ppi');
    //     expect(result).toBe('aaabbaaababababaabb');
    // });
});

class LzDecompression2Handler {
    type = 'Compression II: LZ Decompression';

    solve(stringToDecode) {
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