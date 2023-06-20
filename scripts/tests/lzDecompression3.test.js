// Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. In this variant of LZ, data is encoded in two types of chunk. Each chunk begins with a length L, encoded as a single ASCII digit from 1 to 9, followed by the chunk data, which is either:
// 1. Exactly L characters, which are to be copied directly into the uncompressed data.
// 2. A reference to an earlier part of the uncompressed data. To do this, the length is followed by a second ASCII digit X: each of the L output characters is a copy of the character X places before it in the uncompressed data.
//  For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. The two chunk types alternate, starting with type 1, and the final chunk may be of either type.
//You are given the following input string:
// 1MQcokNOHbHcj6j6j6is76jj6j6i5kRS6ehIem8Vf2em8Vf2m8Vf2m8Vfk2
//Encode it using Lempel-Ziv encoding with the minimum possible output length.

//Examples (some have other possible encodings of minimal length):
// abracadabra   -> 7abracad47
// mississippi   -> 4miss433ppi -
// aAAaAAaAaAA   -> 3aAA53035
// 2718281828   -> 627182844
// abcdefghijk   -> 9abcdefghi02jk
// aaaaaaaaaaaa  -> 3aaa91 -
// aaaaaaaaaaaaa  -> 1a91031
// aaaaaaaaaaaaaa -> 1a91041





describe("lzCompression", () => {
    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaaaaaaaa');
    //     expect(result).toBe('1a81');
    // });

    it('should return the compression correctly', () => {
        const result = lzCompression('aa');
        expect(result).toBe('2aa');
    });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aab');
    //     expect(result).toBe('3aab');
    // });

    it('should return the compression correctly', () => {
        const result = lzCompression('aaa');
        expect(result).toBe('3aaa');
    });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaaa');
    //     expect(result).toBe('4aaaa'); // 2aa21
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaaaa');
    //     expect(result).toBe('1a41');
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaaaaa');
    //     expect(result).toBe('1a51');
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaaaaaa');
    //     expect(result).toBe('1a61');
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaaaaaaa');
    //     expect(result).toBe('1a71');
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaaaaaaaa');
    //     expect(result).toBe('1a81');
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaaaaaaaaa');
    //     expect(result).toBe('1a91');
    // });
    

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaaaaaaaaaaa');
    //     expect(result).toBe('3aaa91');
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaabb');
    //     expect(result).toBe('5aaabb');
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('zDjVt');
    //     expect(result).toBe('5zDjVt');
    // });
    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaabbaaab');
    //     expect(result).toBe('5aaabb45');
    // });
    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaabbaaababababa');
    //     expect(result).toBe('5aaabb45072');
    // });
    // it('should return the compression correctly', () => {
    //     const result = lzCompression('aaabbaaababababaabb');
    //     expect(result).toBe('5aaabb450723abb');
    // });
    // it('should return the compression correctly', () => {
    //     const result = lzCompression('PTukRyMllll5I5lflflflflfyYLQL');
    //     expect(result).toBe('8PTukRyMl3155I5lf825yYLQL');
    // });
    // it('should return the compression correctly', () => {
    //     const result = lzCompression('PTukRyMllll5I5lflflflflfyYLQLLg8CFI2QLLg8CFI2Q7Kg8CcXXXXXXXLXXXXXLXXXlxh2XIl');
    //     expect(result).toBe('8PTukRyMl3155I5lf825yYLQL136g8CFI2998Q7Kg8CcX611L967lxh2XIl');
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('mississippi');
    //     expect(result).toBe('4miss433ppi');
    // });

    // it('should return the compression correctly', () => {
    //     const result = lzCompression('1MQcokNOH bHcj6 j6j6is76jj6j6i5kRS6ehIem8Vf2em8Vf2m8Vf2m8Vfk2');
    //     expect(result).toBe('91MQcokNOH05bHcj6 42 ');
    // });   
});

function lzCompression(stringToEncode) {
    // three chunks in the chunks possible. if something can compress to 3 letters it is able to move on to the next chunk.

    let compressedString = '';
    let compressionSection = false;

    let i = 0;

    while (i < stringToEncode.length) {
        if (compressionSection) {

        } else {
            const forwardBuffer = stringToEncode.slice(i + 1, 9);
            const firstLetter = stringToEncode[i]; 

            let sameValueCount = 1;
            for (let bufferIndex = 0; bufferIndex < forwardBuffer.length; bufferIndex++) {
                const element = forwardBuffer[bufferIndex];
                if(element === firstLetter){
                    sameValueCount++;
                }

                if (sameValueCount >= 3)
                break;
            }

            compressedString += `${sameValueCount}${firstLetter.repeat(sameValueCount)}`;
            i += sameValueCount;
        }


        i++
    }


    return compressedString;
}