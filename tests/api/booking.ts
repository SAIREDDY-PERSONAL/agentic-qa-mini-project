import { expect, type APIRequestContext } from "@playwright/test";

// Restful Booker's public demo credentials
const CREDENTIALS = { username: "admin", password: "password123" };

export type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
};

export const newBooking = (overrides: Partial<Booking> = {}): Booking => ({
  firstname: "Jim",
  lastname: "Brown",
  totalprice: 111,
  depositpaid: true,
  bookingdates: { checkin: "2026-01-01", checkout: "2026-01-05" },
  additionalneeds: "Breakfast",
  ...overrides,
});

export async function createBooking(request: APIRequestContext, booking = newBooking()) {
  const res = await request.post("/booking", { data: booking });
  expect(res.status()).toBe(200);
  const { bookingid } = await res.json();
  return bookingid as number;
}

// PUT, PATCH and DELETE need the token from POST /auth, sent as a cookie
export async function authHeaders(request: APIRequestContext) {
  const res = await request.post("/auth", { data: CREDENTIALS });
  expect(res.status()).toBe(200);
  const { token } = await res.json();
  return { Cookie: `token=${token}` };
}
