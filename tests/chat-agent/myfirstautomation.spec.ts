import { test, expect } from '@playwright/test';


test( 'Code test',{tag : '@smoke'}, async({page})=> {

    await page.goto('https://example.com')
    console.log('Title is:', await page.title());
    expect(await page.title()).toBe('Example Domain')
});



