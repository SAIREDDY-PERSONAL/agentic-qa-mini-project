// Checks which tools the agent called, with which arguments and in which order.
// Returns a list of problems in plain words; an empty list means the tool calls are fine.

type ToolCall = { toolName: string; args: Record<string, unknown> };

export type ToolExpectations = {
  expectedTool: string; // a tool that must be called, or "none" when no tool may be called
  expectedArgs?: Record<string, unknown>; // arguments expectedTool must be called with
  toolOrder?: string[]; // tools that must be called in this order
  forbiddenTools?: string[]; // tools that must not be called
};

export function checkToolCalls(expected: ToolExpectations, calls: ToolCall[]): string[] {
  const problems: string[] = [];
  const names = calls.map((call) => call.toolName);

  // 1. The expected tool was called (or, for "none", no tool was called at all)
  if (expected.expectedTool === "none") {
    if (names.length > 0) problems.push(`No tool should be called, but the agent called ${names.join(", ")}`);
  } else if (!names.includes(expected.expectedTool)) {
    problems.push(`${expected.expectedTool} was not called`);
  }

  // 2. The expected tool got the right arguments
  if (expected.expectedArgs) {
    const call = calls.find((c) => c.toolName === expected.expectedTool);
    for (const [key, value] of Object.entries(expected.expectedArgs)) {
      const actual = call?.args[key];
      if (call && JSON.stringify(actual) !== JSON.stringify(value)) {
        problems.push(`${expected.expectedTool} was called with ${key}=${JSON.stringify(actual)}, expected ${JSON.stringify(value)}`);
      }
    }
  }

  // 3. The tools were called in the right order (other tools in between are fine)
  if (expected.toolOrder) {
    let searchFrom = 0;
    for (const tool of expected.toolOrder) {
      const index = names.indexOf(tool, searchFrom);
      if (index === -1) {
        problems.push(`Expected the tools in this order: ${expected.toolOrder.join(" > ")}, but got: ${names.join(" > ") || "none"}`);
        break;
      }
      searchFrom = index + 1;
    }
  }

  // 4. No forbidden tool was called
  for (const tool of expected.forbiddenTools ?? []) {
    if (names.includes(tool)) problems.push(`${tool} must not be called, but it was`);
  }

  return problems;
}
