import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage.js";

export class DirectoryPage extends BasePage {
  readonly path = "/directory.html";
  readonly search: Locator;
  readonly resultCount: Locator;
  readonly noResults: Locator;
  readonly table: Locator;
  readonly columnHeaders: Locator;
  readonly employeeRows: Locator;

  constructor(page: Page) {
    super(page);
    this.search = page.getByRole("searchbox", { name: "Search by name or department" });
    this.resultCount = page.getByTestId("result-count");
    this.noResults = page.getByTestId("no-results");
    this.table = page.getByTestId("directory-table");
    this.columnHeaders = this.table.getByRole("columnheader");
    this.employeeRows = this.dataRows(this.table);
  }

  async searchFor(text: string) {
    await this.search.fill(text);
  }

  // Table cells whose full text is `text`, e.g. a name or a department
  cell(text: string) {
    return this.table.getByRole("cell", { name: text, exact: true });
  }
}
