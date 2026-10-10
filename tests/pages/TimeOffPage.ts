import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage.js";

export type LeaveType = "Vacation" | "Sick" | "Personal";

export type TimeOffRequest = {
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  reason?: string;
};

export class TimeOffPage extends BasePage {
  readonly path = "/time-off.html";
  readonly balance: Locator;
  readonly leaveType: Locator;
  readonly startDate: Locator;
  readonly endDate: Locator;
  readonly reason: Locator;
  readonly submitButton: Locator;
  readonly message: Locator;
  readonly noRequests: Locator;
  readonly requestsTable: Locator;
  readonly requestRows: Locator;

  constructor(page: Page) {
    super(page);
    this.balance = page.getByText("Available balance:");
    this.leaveType = page.getByLabel("Leave type");
    this.startDate = page.getByLabel("Start date");
    this.endDate = page.getByLabel("End date");
    this.reason = page.getByLabel("Reason (optional)");
    this.submitButton = page.getByRole("button", { name: "Submit request" });
    this.message = page.getByTestId("time-off-message");
    this.noRequests = page.getByText("You have no time-off requests.");
    this.requestsTable = page.getByTestId("requests-table");
    this.requestRows = this.dataRows(this.requestsTable);
  }

  // Fills only the given fields, then submits, so tests can leave fields empty on purpose
  async submitRequest({ leaveType, startDate, endDate, reason }: TimeOffRequest) {
    if (leaveType) await this.leaveType.selectOption(leaveType);
    if (startDate) await this.startDate.fill(startDate);
    if (endDate) await this.endDate.fill(endDate);
    if (reason) await this.reason.fill(reason);
    await this.submitButton.click();
  }
}
