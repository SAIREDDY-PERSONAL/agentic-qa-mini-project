import { test, expect } from "@playwright/test";
import { authHeaders, createBooking } from "./booking.js";

test.describe("DELETE /booking/:id", { tag: "@api" }, () => {
  test("deletes a booking", async ({ request }) => {
    const id = await createBooking(request);
    console.log("Booking id created:", id);

    const res = await request.delete(`/booking/${id}`, { headers: await authHeaders(request) });

    // Restful Booker answers a successful delete with 201 Created
    expect(res.status()).toBe(201);
    expect((await request.get(`/booking/${id}`)).status()).toBe(404);
  
  });

  test("is forbidden without a token", async ({ request }) => {
    const id = await createBooking(request);
    console.log("Booking id created:", id);

    const res = await request.delete(`/booking/${id}`);

    expect(res.status()).toBe(403);
    expect((await request.get(`/booking/${id}`)).status()).toBe(200);
    console.log("Booking id created:", id);
  });
});
