import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage.js";

export class DashboardPage extends BasePage {
  readonly path = "/dashboard.html";
  readonly ptoCard: Locator;
  readonly pendingCard: Locator;
  readonly documentsCard: Locator;
  readonly documentCount: Locator;
  readonly viewRequestsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.ptoCard = this.card("PTO available");
    this.pendingCard = this.card("Pending requests");
    this.documentsCard = this.card("Documents on file");
    this.documentCount = this.documentsCard.getByRole("paragraph").first();
    this.viewRequestsLink = page.getByRole("link", { name: "View requests" });
  }

  // A summary card, found by its heading
  card(title: string) {
    return this.page.getByRole("region").filter({ has: this.page.getByRole("heading", { name: title }) });
  }
}
