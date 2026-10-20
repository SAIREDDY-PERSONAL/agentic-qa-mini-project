import { test, expect } from "@playwright/test";
import { checkToolCalls } from "../../src/evaluators/tool_checks.js";

// Unit tests for the tool-call checks. No browser and no judge call, so no API key is needed.

const balance = { toolName: "check_leave_balance", args: { employeeId: "1042" } };
const submit = { toolName: "submit_time_off", args: { employeeId: "1042", type: "vacation", days: 3 } };

test("passes when the expected tool is called with the right arguments, in order", () => {
  const problems = checkToolCalls(
    {
      expectedTool: "submit_time_off",
      expectedArgs: { employeeId: "1042", days: 3 },
      toolOrder: ["check_leave_balance", "submit_time_off"],
    },
    [balance, submit],
  );
  expect(problems).toEqual([]);
});

test("reports a missing expected tool", () => {
  expect(checkToolCalls({ expectedTool: "submit_time_off" }, [balance])).toEqual(["submit_time_off was not called"]);
});

test("reports a wrong argument", () => {
  const problems = checkToolCalls({ expectedTool: "submit_time_off", expectedArgs: { days: 5 } }, [submit]);
  expect(problems).toEqual(["submit_time_off was called with days=3, expected 5"]);
});

test("reports tools called in the wrong order", () => {
  const problems = checkToolCalls(
    { expectedTool: "submit_time_off", toolOrder: ["check_leave_balance", "submit_time_off"] },
    [submit, balance],
  );
  expect(problems).toEqual([
    "Expected the tools in this order: check_leave_balance > submit_time_off, but got: submit_time_off > check_leave_balance",
  ]);
});

test("reports a forbidden tool", () => {
  const problems = checkToolCalls({ expectedTool: "check_leave_balance", forbiddenTools: ["submit_time_off"] }, [balance, submit]);
  expect(problems).toEqual(["submit_time_off must not be called, but it was"]);
});

test('"none" means no tool may be called', () => {
  expect(checkToolCalls({ expectedTool: "none" }, [])).toEqual([]);
  expect(checkToolCalls({ expectedTool: "none" }, [balance])).toEqual([
    "No tool should be called, but the agent called check_leave_balance",
  ]);
});
