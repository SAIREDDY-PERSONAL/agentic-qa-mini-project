import { test, expect } from "@playwright/test";
import { newBooking } from "./booking.js";

test.describe("POST /booking", { tag: "@api" }, () => {
  test("creates a booking", async ({ request }) => {
    const booking = newBooking({ firstname: "Post" });

    const res = await request.post("/booking", { data: booking });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ bookingid: expect.any(Number), booking });

    // The new booking can be read back
    const saved = await request.get(`/booking/${body.bookingid}`);
    expect(await saved.json()).toEqual(booking);
  });

  test("rejects a booking with missing fields", async ({ request }) => {
    const res = await request.post("/booking", { data: { firstname: "Incomplete" } });

    expect(res.status()).toBe(500);
  });
});
