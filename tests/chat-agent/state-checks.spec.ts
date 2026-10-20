import { test, expect } from "@playwright/test";
import { checkState } from "../../src/evaluators/state_checks.js";

// Unit tests for the HR-data checks. No browser and no judge call, so no API key is needed.

const booked = { balanceDays: 12, requests: [{ requestId: "REQ-1", type: "vacation", days: 3, status: "pending" }] };
const untouched = { balanceDays: 15, requests: [] };

test("passes when the HR data matches", () => {
  const expected = { balanceDays: 12, requestCount: 1, lastRequest: { days: 3, status: "pending" } };
  expect(checkState(expected, booked)).toEqual([]);
});

test("reports a wrong balance", () => {
  expect(checkState({ balanceDays: 12 }, untouched)).toEqual(["PTO balance is 15 days, expected 12"]);
});

test("reports a missing or extra leave request", () => {
  expect(checkState({ requestCount: 1 }, untouched)).toEqual(["The HR system has 0 leave request(s), expected 1"]);
  expect(checkState({ requestCount: 0 }, booked)).toEqual(["The HR system has 1 leave request(s), expected 0"]);
});

test("reports wrong details on the saved request", () => {
  expect(checkState({ lastRequest: { days: 5 } }, booked)).toEqual(["The saved leave request has days=3, expected 5"]);
  expect(checkState({ lastRequest: { days: 3 } }, untouched)).toEqual(["No leave request was saved in the HR system"]);
});
