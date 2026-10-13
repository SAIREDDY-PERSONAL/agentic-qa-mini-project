import { test, expect } from '@playwright/test';
import { object } from 'zod';

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








