# Documents Page Test Plan

## Application Overview

Test plan for /documents.html of the Acme HR Portal (http://localhost:8080). The page has a "Document type" select (options: Select a type, Government ID, W-4 Tax Form, Certification), a "File" input (PDF, PNG, JPG; max 2 MB), an "Upload" button, a status message (test id upload-message) and a "My documents" table (columns File name, Type, Size, Uploaded) with empty state "No documents uploaded yet." (test id no-documents). Data lives in sessionStorage, so every test starts with no documents. Conventions: all scenarios start from the seed (signed in as Alex Morgan via signIn(page), never typing credentials). Import test/expect from "../../fixtures.js". Upload files MUST be created at runtime with setInputFiles({ name, mimeType, buffer }); no files checked into the repo. A successful upload is only proven by ALL of: the success message, a new row in "My documents" with the correct file name and type, and the empty-state text "No documents uploaded yet." no longer visible. A success message alone is not sufficient. Generated tests go in tests/e2e/documents/.

## Test Scenarios

### 1. Documents page

**Seed:** `tests/seed.spec.ts`

#### 1.1. Upload a PDF successfully

**File:** `tests/e2e/documents/upload-pdf.spec.ts`

**Steps:**
  1. Navigate to /documents.html. Verify heading 'Documents', and that 'No documents uploaded yet.' is visible and the table has no data rows.
    - expect: Empty state text 'No documents uploaded yet.' is visible
  2. Select 'Government ID' in the 'Document type' combobox.
    - expect: Combobox shows 'Government ID'
  3. Set the 'File' input via setInputFiles with { name: 'id-card.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048, 1) } (~2 KB).
    - expect: No error message shown
  4. Click the 'Upload' button.
    - expect: Status message reads 'Uploaded id-card.pdf successfully.'
    - expect: The 'My documents' table contains exactly one data row with cells 'id-card.pdf', 'Government ID', '2 KB' and today's date (YYYY-MM-DD)
    - expect: The text 'No documents uploaded yet.' is no longer visible (all three checks are required; the success message alone is not sufficient)

#### 1.2. Upload an image (PNG) successfully

**File:** `tests/e2e/documents/upload-image.spec.ts`

**Steps:**
  1. Navigate to /documents.html.
    - expect: Empty state 'No documents uploaded yet.' is visible
  2. Select 'W-4 Tax Form' in 'Document type'.
    - expect: Combobox shows 'W-4 Tax Form'
  3. Set the 'File' input via setInputFiles with { name: 'scan.png', mimeType: 'image/png', buffer: Buffer.alloc(1024, 1) } (~1 KB). Optionally repeat as a second run/variant with { name: 'scan.jpg', mimeType: 'image/jpeg' } and type 'Certification'.
    - expect: No error message shown
  4. Click 'Upload'.
    - expect: Status message reads 'Uploaded scan.png successfully.'
    - expect: The 'My documents' table has one data row with 'scan.png', 'W-4 Tax Form', '1 KB' and today's date
    - expect: 'No documents uploaded yet.' is no longer visible

#### 1.3. Validation: no document type selected

**File:** `tests/e2e/documents/validation-no-type.spec.ts`

**Steps:**
  1. Navigate to /documents.html and leave 'Document type' on 'Select a type'.
    - expect: Empty state visible
  2. Set the 'File' input with { name: 'id-card.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048, 1) } (~2 KB), then click 'Upload'. (Optionally also click Upload with no file and no type; the type error is shown first.)
    - expect: Message 'Select a document type.' is shown
    - expect: No success message appears
    - expect: No row is added: 'No documents uploaded yet.' is still visible and the table has no data rows

#### 1.4. Validation: no file chosen

**File:** `tests/e2e/documents/validation-no-file.spec.ts`

**Steps:**
  1. Navigate to /documents.html, select 'Government ID' in 'Document type', choose no file.
    - expect: Type selected, file input empty
  2. Click 'Upload'.
    - expect: Message 'Choose a file to upload.' is shown
    - expect: No success message appears
    - expect: No row is added: 'No documents uploaded yet.' is still visible

#### 1.5. Validation: unsupported file type

**File:** `tests/e2e/documents/validation-unsupported-type.spec.ts`

**Steps:**
  1. Navigate to /documents.html and select 'Certification' in 'Document type'.
    - expect: Type selected
  2. Set the 'File' input with { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') } (~5 bytes), then click 'Upload'.
    - expect: Message 'Unsupported file type. Upload a PDF, PNG, or JPG.' is shown
    - expect: No success message appears
    - expect: No row is added: 'No documents uploaded yet.' is still visible and the table has no data rows

#### 1.6. Validation: file over 2 MB

**File:** `tests/e2e/documents/validation-file-too-large.spec.ts`

**Steps:**
  1. Navigate to /documents.html and select 'Government ID' in 'Document type'.
    - expect: Type selected
  2. Set the 'File' input with { name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(3 * 1024 * 1024) } (~3 MB, a valid type but over the limit), then click 'Upload'.
    - expect: Message 'File is too large. Maximum size is 2 MB.' is shown
    - expect: No success message appears
    - expect: No row is added: 'No documents uploaded yet.' is still visible and the table has no data rows

#### 1.7. Dashboard 'Documents on file' count reflects an upload

**File:** `tests/e2e/documents/dashboard-count.spec.ts`

**Steps:**
  1. Navigate to /dashboard.html (seed state).
    - expect: In the 'Documents on file' region the count is '0'
  2. Click 'Documents' in the Main navigation, select 'Certification', set the 'File' input with { name: 'cert.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(4096, 1) } (~4 KB) and click 'Upload'.
    - expect: Status message 'Uploaded cert.pdf successfully.'
    - expect: The table has a row with 'cert.pdf' and 'Certification'; 'No documents uploaded yet.' is no longer visible
  3. Click 'Dashboard' in the Main navigation (stay in the same tab so sessionStorage persists).
    - expect: The 'Documents on file' region shows '1' (was '0')
