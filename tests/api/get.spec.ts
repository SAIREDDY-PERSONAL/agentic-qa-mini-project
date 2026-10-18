import { test, expect } from "@playwright/test";
import { createBooking, newBooking } from "./booking.js";

test.describe("GET /booking", { tag: "@api" }, () => {
  
  test ("AI+PI testing with UI", async({request, page})=>{

    const resp1 = await request.get ("https://api.demoblaze.com/entries")
    const jsonResp1= await resp1.json();
    //console.log (await resp1. json());
    console.log ( jsonResp1.Items[0].title)
    await page.goto("https://www.demoblaze.com/")
    
    await expect(page.getByRole('link', { name: 'Samsung galaxy s6' })).toHaveText(jsonResp1.Items[0].title);
    


  });
  
  
  test("lists booking ids", async ({ request }) => {
    const res = await request.get("/booking");

    expect(res.status()).toBe(200);
    const bookings = await res.json();
    expect(bookings.length).toBeGreaterThan(0);
    expect(bookings[0]).toEqual({ bookingid: expect.any(Number) });
  });

  test("returns a single booking by id", async ({ request }) => {
    const booking = newBooking({ firstname: "Get" });
    const id = await createBooking(request, booking);

    const res = await request.get(`/booking/${id}`);

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual(booking);
  });

  test("filters bookings by name", async ({ request }) => {
    const id = await createBooking(request, newBooking({ firstname: "Filter", lastname: `Test${Date.now()}` }));
    const created = await (await request.get(`/booking/${id}`)).json();

    const res = await request.get("/booking", {
      params: { firstname: created.firstname, lastname: created.lastname },
    });

    expect(res.status()).toBe(200);
    expect(await res.json()).toContainEqual({ bookingid: id });
  });

  test("returns 404 for an unknown booking", async ({ request }) => {
    const res = await request.get("/booking/999999999");

    expect(res.status()).toBe(404);
  });
});
