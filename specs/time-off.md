# Time off page test plan

## Application Overview

Test plan for /time-off.html of the Acme HR Portal. The page shows the available PTO balance (15 days at start), a request form (Leave type: Vacation/Sick/Personal; Start date; End date; optional Reason; "Submit request") and a "My requests" table (columns Type, Start, End, Days, Status). Days are weekdays between the dates, inclusive. Every scenario starts from the seed (signed in as Alex Morgan, on /dashboard.html) and then navigates to /time-off.html. State is in sessionStorage, so each test starts with 15 days and no requests ("You have no time-off requests."). Dates use ISO format (YYYY-MM-DD). 2027-03-01 is a Monday. Generated tests go in tests/e2e/time-off/. Use getByRole/getByLabel locators and web-first assertions; never type credentials.

## Test Scenarios

### 1. Time off requests

**Seed:** `tests/seed.spec.ts`

#### 1.1. Submit a valid vacation request

**File:** `tests/e2e/time-off/submit-valid-request.spec.ts`

**Steps:**
  1. Navigate to /time-off.html.
    - expect: Heading 'Time off' is visible.
    - expect: 'Available balance:' shows '15 days'.
    - expect: 'My requests' shows 'You have no time-off requests.'
  2. Select Leave type 'Vacation', fill Start date '2027-03-02' (Tuesday), End date '2027-03-04' (Thursday), Reason 'Family trip', then click 'Submit request'.
    - expect: Message 'Time-off request submitted for 3 days. Status: Pending approval.' is visible.
    - expect: Available balance now shows '12 days'.
    - expect: 'You have no time-off requests.' is gone.
    - expect: The My requests table has exactly one data row with cells: Vacation, 2027-03-02, 2027-03-04, 3, Pending.

#### 1.2. Reject submission with missing required fields

**File:** `tests/e2e/time-off/missing-fields.spec.ts`

**Steps:**
  1. Navigate to /time-off.html and click 'Submit request' without filling anything.
    - expect: Message 'Select a leave type, start date, and end date.' is visible.
    - expect: Available balance still shows '15 days'.
    - expect: 'You have no time-off requests.' is still shown.
  2. Select Leave type 'Sick' and fill only Start date '2027-03-02' (leave End date empty), then click 'Submit request'.
    - expect: Message 'Select a leave type, start date, and end date.' is still visible.
    - expect: No row is added to the table; balance remains '15 days'.

#### 1.3. Reject end date before start date

**File:** `tests/e2e/time-off/end-before-start.spec.ts`

**Steps:**
  1. Navigate to /time-off.html. Select Leave type 'Vacation', Start date '2027-03-04', End date '2027-03-02', click 'Submit request'.
    - expect: Message 'End date must be on or after the start date.' is visible.
    - expect: Available balance still shows '15 days'.
    - expect: 'You have no time-off requests.' is still shown.

#### 1.4. Reject a weekend-only date range

**File:** `tests/e2e/time-off/weekend-only.spec.ts`

**Steps:**
  1. Navigate to /time-off.html. Select Leave type 'Personal', Start date '2027-03-06' (Saturday), End date '2027-03-07' (Sunday), click 'Submit request'.
    - expect: Message 'The selected dates fall on a weekend. Choose at least one weekday.' is visible.
    - expect: Available balance still shows '15 days'.
    - expect: No request row is added.

#### 1.5. Reject a request exceeding the available balance

**File:** `tests/e2e/time-off/insufficient-balance.spec.ts`

**Steps:**
  1. Navigate to /time-off.html. Select Leave type 'Vacation', Start date '2027-03-01' (Monday), End date '2027-03-26' (Friday; 4 full weeks = 20 weekdays), click 'Submit request'.
    - expect: Message 'Insufficient PTO balance: you requested 20 days but only 15 are available.' is visible.
    - expect: Available balance still shows '15 days'.
    - expect: No request row is added; 'You have no time-off requests.' is shown.

#### 1.6. Weekend days are excluded from the day count

**File:** `tests/e2e/time-off/weekday-count.spec.ts`

**Steps:**
  1. Navigate to /time-off.html. Select Leave type 'Sick', Start date '2027-03-05' (Friday), End date '2027-03-09' (Tuesday), click 'Submit request'. Range spans Fri, Sat, Sun, Mon, Tue = 3 weekdays.
    - expect: Message 'Time-off request submitted for 3 days. Status: Pending approval.' is visible.
    - expect: Available balance shows '12 days'.
    - expect: Table row shows Sick, 2027-03-05, 2027-03-09, 3, Pending.

#### 1.7. Dashboard reflects a submitted request

**File:** `tests/e2e/time-off/dashboard-reflects-request.spec.ts`

**Steps:**
  1. Navigate to /time-off.html, submit Vacation from '2027-03-02' to '2027-03-04' and wait for 'Time-off request submitted for 3 days. Status: Pending approval.'.
    - expect: Available balance shows '12 days'.
  2. Click the 'Dashboard' link in the main navigation.
    - expect: Heading 'Welcome, Alex Morgan' is visible.
    - expect: 'PTO available' region shows '12 days' and '3 days requested of 15'.
    - expect: 'Pending requests' region shows '1'.
  3. Click the 'View requests' link.
    - expect: URL is /time-off.html, the balance shows '12 days' and the My requests table still has the Vacation 2027-03-02 to 2027-03-04, 3, Pending row.
