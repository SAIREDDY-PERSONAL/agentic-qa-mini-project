import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage.js";

export type DocumentType = "Government ID" | "W-4 Tax Form" | "Certification";

export type UploadFile = { name: string; mimeType: string; buffer: Buffer };

export class DocumentsPage extends BasePage {
  readonly path = "/documents.html";
  readonly documentType: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly message: Locator;
  readonly noDocuments: Locator;
  readonly documentsTable: Locator;
  readonly documentRows: Locator;

  constructor(page: Page) {
    super(page);
    this.documentType = page.getByLabel("Document type");
    this.fileInput = page.getByLabel("File", { exact: true });
    this.uploadButton = page.getByRole("button", { name: "Upload" });
    this.message = page.getByTestId("upload-message");
    this.noDocuments = page.getByTestId("no-documents");
    this.documentsTable = page.getByTestId("documents-table");
    this.documentRows = this.dataRows(this.documentsTable);
  }

  async selectType(type: DocumentType) {
    await this.documentType.selectOption(type);
  }

  async chooseFile(file: UploadFile) {
    await this.fileInput.setInputFiles(file);
  }

  // Sets only what is given, then clicks Upload, so tests can skip the type or file on purpose
  async upload({ type, file }: { type?: DocumentType; file?: UploadFile }) {
    if (type) await this.selectType(type);
    if (file) await this.chooseFile(file);
    await this.uploadButton.click();
  }
}
