# My Profile and Header Navigation Test Plan

## Application Overview

Test plan for the My profile page (/profile.html) and the header navigation of the Acme HR Portal. All scenarios start from the seed (signed in as Alex Morgan via signIn(page), on /dashboard.html); never type credentials. Profile data is stored in sessionStorage, so each scenario starts with fresh default values: Phone 555-010-1042, Home address "12 Main St, New York, NY 10001". The HR Assistant chat replies are out of scope.

## Test Scenarios

### 1. My Profile

**Seed:** `tests/seed.spec.ts`

#### 1.1. Read-only fields show the user's data and cannot be edited

**File:** `tests/e2e/profile/read-only-fields.spec.ts`

**Steps:**
  1. Navigate to /profile.html
    - expect: Page title is 'My Profile - Acme HR Portal'
    - expect: Heading 'My profile' (level 1) is visible
  2. Read the Full name, Employee ID and Work email textboxes
    - expect: Full name has value 'Alex Morgan'
    - expect: Employee ID has value '1042'
    - expect: Work email has value 'alex.morgan@acme-hr.example'
  3. Check that each of the three fields is not editable, and try to fill Full name with 'Someone Else' (expect it to be rejected)
    - expect: Each of the three textboxes is not editable (toBeEditable negated)
    - expect: Values are unchanged after the attempt
  4. Check the editable fields
    - expect: Phone and Home address are editable; 'Save changes' button is visible

#### 1.2. Default editable values are pre-filled

**File:** `tests/e2e/profile/default-values.spec.ts`

**Steps:**
  1. Navigate to /profile.html
    - expect: Phone textbox has value '555-010-1042' and placeholder 'e.g. 555-123-4567'
    - expect: Home address textbox has value '12 Main St, New York, NY 10001'
    - expect: No error or success message is shown

#### 1.3. Save valid changes and confirm they persist after reload

**File:** `tests/e2e/profile/save-valid-changes.spec.ts`

**Steps:**
  1. Navigate to /profile.html, fill Phone with '555-123-4567' and Home address with '99 Oak Ave, Austin, TX 78701'
    - expect: Fields show the new values
  2. Click 'Save changes'
    - expect: The text 'Profile updated successfully.' is visible
  3. Reload the page
    - expect: Phone has value '555-123-4567'
    - expect: Home address has value '99 Oak Ave, Austin, TX 78701'
    - expect: Read-only fields still show Alex Morgan, 1042 and alex.morgan@acme-hr.example

#### 1.4. Invalid phone format is rejected

**File:** `tests/e2e/profile/invalid-phone.spec.ts`

**Steps:**
  1. Navigate to /profile.html, fill Phone with '12345' and click 'Save changes'
    - expect: Error 'Enter the phone number in the format 555-123-4567.' is visible
    - expect: 'Profile updated successfully.' is not shown
  2. Repeat with other invalid values such as 'abcdefghij' and '5551234567' (optional variants)
    - expect: The same error is shown each time
  3. Reload the page
    - expect: Phone is back to the stored value '555-010-1042' (invalid value not persisted)

#### 1.5. Empty home address is rejected

**File:** `tests/e2e/profile/empty-address.spec.ts`

**Steps:**
  1. Navigate to /profile.html, clear Home address (leave Phone valid) and click 'Save changes'
    - expect: Error 'Home address is required.' is visible
    - expect: 'Profile updated successfully.' is not shown
  2. Reload the page
    - expect: Home address is back to '12 Main St, New York, NY 10001'

### 2. Header Navigation

**Seed:** `tests/seed.spec.ts`

#### 2.1. Header links navigate to each page and mark the current link

**File:** `tests/e2e/navigation/header-links.spec.ts`

**Steps:**
  1. On /dashboard.html, inspect the 'Main' navigation and header
    - expect: Links in order: Dashboard, Time Off, Documents, Directory, My Profile, HR Assistant
    - expect: 'Alex Morgan' is shown in the header with a 'Log out' button
    - expect: 'Dashboard' link has aria-current='page'; the others do not
  2. Click each link in turn and check URL, level-1 heading, current link and signed-in name. Dashboard: /dashboard.html, 'Welcome, Alex Morgan'. Time Off: /time-off.html, 'Time off'. Documents: /documents.html, 'Documents'. Directory: /directory.html, 'Employee directory'. My Profile: /profile.html, 'My profile'. HR Assistant: /chat.html, 'HR Assistant'
    - expect: URL matches the expected path after each click
    - expect: Heading matches exactly (note case: 'Time off', 'My profile')
    - expect: Only the clicked link has aria-current='page'
    - expect: 'Alex Morgan' remains visible in the header on every page
    - expect: Do not assert on chat replies
