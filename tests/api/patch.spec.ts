import { test, expect } from "@playwright/test";
import { authHeaders, createBooking, newBooking } from "./booking.js";

test.describe("PATCH /booking/:id", { tag: "@api" }, () => {
  test("updates only the fields sent", async ({ request }) => {
    const booking = newBooking({ firstname: "Patch" });
    const id = await createBooking(request, booking);

    const res = await request.patch(`/booking/${id}`, {
      data: { totalprice: 500, additionalneeds: "Lunch" },
      headers: await authHeaders(request),
    });

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ...booking, totalprice: 500, additionalneeds: "Lunch" });
  });

  test("is forbidden without a token", async ({ request }) => {
    const id = await createBooking(request);

    const res = await request.patch(`/booking/${id}`, { data: { totalprice: 1 } });

    expect(res.status()).toBe(403);
  });
});
