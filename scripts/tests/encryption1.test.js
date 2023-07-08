
// "Caesar cipher is one of the simplest encryption technique. It is a type of substitution cipher in which each letter in the plaintext  is replaced by a letter some fixed number of positions down the alphabet. 

//For example, with a left shift of 3, D would be replaced by A,  E would become B, and A would become X (because of rotation).
// You are given an array with two elements:\n &nbsp;&nbsp;[\"DEBUG MEDIA MOUSE CLOUD CACHE\", 4] 
// The first element is the plaintext, the second element is the left shift value.\n\n Return the ciphertext as uppercase string. Spaces remains the same."


describe("caesar cipher", () => {
    it("should return A when given 3 and D.", () => {
        const result = new Encryption1Handler().solve(['D', 3]);
        expect(result).toBe('A')
    });

    it("should return A when given 3 and D.", () => {
        const result = new Encryption1Handler().solve(['DE', 3]);
        expect(result).toBe('AB')
    });

    it("should return X when given 6 and D.", () => {
        const result = new Encryption1Handler().solve(['D', 6]);
        expect(result).toBe('X')
    });

    it("should return X Y Z when given 6 and D E F.", () => {
        const result = new Encryption1Handler().solve(['D E F G', 6]);
        expect(result).toBe('X Y Z A')
    });


    it("should return ' ' when given 4 and ' '.", () => {
        const result = new Encryption1Handler().solve(' ', 3);
        expect(result).toBe(' ');
    });


    it("should ", () => {
        const result = new Encryption1Handler().solve('', 0);
    });
});


class Encryption1Handler {
    type = 'Encryption I: Caesar Cipher';

    solve([string, shift]) {

        let returnString = "";

        if (string) {
            for (const character of string) {
                if (character === " ") {
                    returnString += " ";
                }
                else {
                    const charCode = character.charCodeAt(0);

                    if (charCode) {
                        let newCharCode = charCode - shift;

                        if (newCharCode < 65) {
                            const amountLessThan65 = 65 - newCharCode;
                            newCharCode = 91 - amountLessThan65;
                        }

                        returnString += String.fromCharCode(newCharCode);
                    }
                }
            }
        }

        return returnString;
    }
}