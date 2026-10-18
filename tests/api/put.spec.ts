import { test, expect } from "@playwright/test";
import { authHeaders, createBooking, newBooking } from "./booking.js";

test.describe("PUT /booking/:id", { tag: "@api" }, () => {
  test("replaces a whole booking", async ({ request }) => {
    const id = await createBooking(request);
    const updated = newBooking({ firstname: "Put", lastname: "Updated", totalprice: 999, depositpaid: false });

    const res = await request.put(`/booking/${id}`, { data: updated, headers: await authHeaders(request) });

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(await (await request.get(`/booking/${id}`)).json()).toEqual(updated);
  });

  test("is forbidden without a token", async ({ request }) => {
    const id = await createBooking(request);

    const res = await request.put(`/booking/${id}`, { data: newBooking() });

    expect(res.status()).toBe(403);
  });
});
