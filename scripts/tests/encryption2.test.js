// Vigenère cipher is a type of polyalphabetic substitution. It uses  the Vigenère square to encrypt and decrypt plaintext with a keyword.\n\n &nbsp;&nbsp;Vigenère square:\

//A B C D E F G H I J K L M N O P Q R S T U V W X Y Z \n 

// A | A B C D E F G H I J K L M N O P Q R S T U V W X Y Z 
// B | B C D E F G H I J K L M N O P Q R S T U V W X Y Z A 
// C | C D E F G H I J K L M N O P Q R S T U V W X Y Z A B
// D | D E F G H I J K L M N O P Q R S T U V W X Y Z A B C
// E | E F G H I J K L M N O P Q R S T U V W X Y Z A B C D
// Y | Y Z A B C D E F G H I J K L M N O P Q R S T U V W X
// Z | Z A B C D E F G H I J K L M N O P Q R S T U V W X Y

// For encryption each letter of the plaintext is paired with the corresponding letter of a repeating keyword. For example, the plaintext DASHBOARD is encrypted with the keyword LINUX:\n &nbsp;&nbsp; Plaintext: DASHBOARD\n &nbsp;&nbsp; Keyword:&nbsp;&nbsp;&nbsp;LINUXLINU\n So, the first letter D is paired with the first letter of the key L. Therefore, row D and column L of the  Vigenère square are used to get the first cipher letter O. This must be repeated for the whole ciphertext.\n\n You are given an array with two elements:\n &nbsp;&nbsp;[\"MOUSEMACROMODEMARRAYPRINT\", \"VERSION\"]\n The first element is the plaintext, the second element is the keyword.\n\n Return the ciphertext as uppercase string.

describe("caesar cipher", () => {
    it("should return LXFOPVEFRNHR when given ATTACKATDAWN and LEMON.", () => {
        const result = new Encryption2Handler().solve(['ATTACKATDAWN', 'LEMON']);
        expect(result).toBe('LXFOPVEFRNHR')
    });

    it("should return O when given D and LINUX.", () => {
        const result = new Encryption2Handler().solve(['D', 'LINUX']);
        expect(result).toBe('O')
    });

    it("should return DASHBOARD when given DASHBOARD and A.", () => {
        const result = new Encryption2Handler().solve(['DASHBOARD', 'A']);
        expect(result).toBe('DASHBOARD')
    });

    it("should return D A SHBOARD when given D A SHBOARD and A.", () => {
        const result = new Encryption2Handler().solve(['D A SHBOARD', 'A']);
        expect(result).toBe('D A SHBOARD')
    });

    it("should return '' when given '' and A.", () => {
        const result = new Encryption2Handler().solve(['', 'A']);
        expect(result).toBe('')
    });

    it("should return ' ' when given ' ' and A.", () => {
        const result = new Encryption2Handler().solve([' ', 'A']);
        expect(result).toBe(' ')
    });

    it("should work", () => {
        const result = new Encryption2Handler().solve(['E', 'W']);
        expect(result).not.toBe("[");
    });

    it("should return ' ' when given ' ' and A.", () => {
        const result = new Encryption2Handler().solve(['FRAMEMODEMQUEUETRASHCACHE', 'MALWARE']);
        expect(result).toBe('RRLIEDSPEXMUVYQTCWSYGMCSA')
    });
});


class Encryption2Handler {
    type = 'Encryption II: Vigenère Cipher';

    solve([plainText, key]) {

        let encryptedText = "";

        if(plainText){
            let keyIndex = 0;

            for (let i = 0; i < plainText.length; i++) {
                const plainTextCharacter = plainText[i];

                if(plainTextCharacter === " "){
                    encryptedText += " ";
                } else {
                    const keyCharCode = key[keyIndex].charCodeAt(0);
                    const shift = keyCharCode - 65;

                    const plainTextCode = plainTextCharacter.charCodeAt(0);
                    let encryptedCharacterCode = plainTextCode + shift;

                    if (encryptedCharacterCode > 90) {
                        const amountMoreThan91 = encryptedCharacterCode - 91;
                        encryptedCharacterCode = amountMoreThan91 + 65;
                    }

                    encryptedText += String.fromCharCode(encryptedCharacterCode);
                }

                
                keyIndex++;
                if(keyIndex >= key.length){
                    keyIndex = 0;
                }
            }
        }

        return encryptedText;
    }
}