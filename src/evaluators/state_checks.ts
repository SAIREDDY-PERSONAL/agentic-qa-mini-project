// Checks what the HR system holds after the conversation: did the agent really do what it said?
// Returns a list of problems in plain words; an empty list means the state is as expected.

type TimeOff = { balanceDays: number; requests: Record<string, unknown>[] };

export type ExpectedState = {
  balanceDays?: number; // PTO balance left after the conversation
  requestCount?: number; // how many leave requests exist
  lastRequest?: Record<string, unknown>; // fields the newest request must have, e.g. { "days": 3 }
};

export function checkState(expected: ExpectedState, actual: TimeOff): string[] {
  const problems: string[] = [];

  // 1. The balance went down by the right amount (or didn't change)
  if (expected.balanceDays !== undefined && actual.balanceDays !== expected.balanceDays) {
    problems.push(`PTO balance is ${actual.balanceDays} days, expected ${expected.balanceDays}`);
  }

  // 2. The right number of leave requests was created (0 when the agent should have declined)
  if (expected.requestCount !== undefined && actual.requests.length !== expected.requestCount) {
    problems.push(`The HR system has ${actual.requests.length} leave request(s), expected ${expected.requestCount}`);
  }

  // 3. The newest request has the right details
  if (expected.lastRequest) {
    const last = actual.requests.at(-1);
    if (!last) {
      problems.push("No leave request was saved in the HR system");
    } else {
      for (const [key, value] of Object.entries(expected.lastRequest)) {
        if (JSON.stringify(last[key]) !== JSON.stringify(value)) {
          problems.push(`The saved leave request has ${key}=${JSON.stringify(last[key])}, expected ${JSON.stringify(value)}`);
        }
      }
    }
  }

  return problems;
}
