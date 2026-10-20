import { test, expect } from '@playwright/test';

test('Find duplicate values in String', async () => {

    function findDuplicateCharInString(input: string): Map<string, number> {
        const charCount = new Map<string, number>();

        for (const ch of input) {

            charCount.set(ch, (charCount.get(ch) ?? 0) + 1);
        }

        const duplicates = new Map<string, number>();

        for (const [ch, count] of charCount) {
            if (count > 1) duplicates.set(ch, count);
        }

        return duplicates;
    }


    const results = findDuplicateCharInString("programming");
    results.forEach((count, ch) => console.log(`'${ch}' appears '${count}' times`));
    expect(Object.fromEntries(results)).toEqual({ r: 2, g: 2, m: 2 });
});




test ('Find Dup', async()=>{

function findDup1 (input : string): Map<string, number> {

    const count1 = new Map<string, number>();

    for ( const ch of input ){
        count1.set (ch, (count1.get(ch)??0)+1);
    }
    const dupli = new Map <string,number>();

    for ( const [ch, count] of count1){
        if ( count >1) dupli. set (ch, count );
    }
    return dupli;
}
const results= findDup1("programming");
results.forEach ((count, ch)=> console.log ( `'${ch}' appears '${count}'. times`));
expect(Object.fromEntries(results)).toEqual({ r:2, g:2, m:2})

});

test('Find repeated characters in "SaireddyKasthuri"', async () => {

    function findRepeatedChars(input: string): Map<string, number> {
        const charCount = new Map<string, number>();

        for (const ch of input) {
            charCount.set(ch, (charCount.get(ch) ?? 0) + 1);
        }

        const repeated = new Map<string, number>();

        for (const [ch, count] of charCount) {
            if (count > 1) repeated.set(ch, count);
        }

        return repeated;
    }

    const results = findRepeatedChars("SaireddyKasthuri");
    results.forEach((count, ch) => console.log(`'${ch}' appears '${count}' times`));
    expect(Object.fromEntries(results)).toEqual({ a: 2, i: 2, r: 2, d: 2 });
});
