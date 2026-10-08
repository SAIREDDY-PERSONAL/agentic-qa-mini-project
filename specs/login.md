# Acme HR Portal - Sign-in and Sign-out Test Plan

## Application Overview

Covers sign-in and sign-out of the Acme HR Portal (http://localhost:8080, via baseURL). Every scenario starts from a fresh, signed-out browser context on /login.html (heading "Sign in to Acme HR", Username and Password textboxes, "Sign in" button). Valid credentials are the demo credentials (DEMO_USERNAME / DEMO_PASSWORD), read from the environment, never hard-coded. Generated tests go in tests/e2e/login/ and import from ../../fixtures.js.

## Test Scenarios

### 1. Sign-in and sign-out

**Seed:** `tests/seed-logged-out.spec.ts`

#### 1.1. Successful sign in lands on the dashboard

**File:** `tests/e2e/login/sign-in-success.spec.ts`

**Steps:**
  1. Starting from the seed (signed out, on /login.html), fill Username and Password with the demo credentials (DEMO_USERNAME / DEMO_PASSWORD).
    - expect: Both fields hold the entered values.
  2. Click the "Sign in" button.
    - expect: URL becomes /dashboard.html.
    - expect: Heading "Welcome, Alex Morgan" is visible, along with the "PTO available", "Pending requests" and "Documents on file" sections.
    - expect: The header shows a "Log out" button.
    - expect: No error alert is shown.

#### 1.2. Invalid credentials show an error and stay on login

**File:** `tests/e2e/login/sign-in-invalid.spec.ts`

**Steps:**
  1. Fill Username with "wronguser" and Password with "wrongpass", then click "Sign in".
    - expect: An alert with the text "Invalid username or password." is visible.
    - expect: URL remains /login.html.
    - expect: The "Sign in to Acme HR" heading is still visible.
  2. Fill Username with the valid demo username but an incorrect password, then click "Sign in".
    - expect: The alert "Invalid username or password." is shown and the user is not signed in.
  3. Navigate directly to /dashboard.html.
    - expect: User is redirected to /login.html?next=%2Fdashboard.html (still signed out).

#### 1.3. Empty fields show a validation error

**File:** `tests/e2e/login/sign-in-empty.spec.ts`

**Steps:**
  1. With both fields empty, click "Sign in".
    - expect: An alert with the text "Enter your username and password." is visible.
    - expect: URL remains /login.html.
  2. Fill only Username with the demo username (leave Password empty) and click "Sign in".
    - expect: The alert "Enter your username and password." is shown; user stays on /login.html.
  3. Clear Username, fill only Password with any value, and click "Sign in".
    - expect: The alert "Enter your username and password." is shown; user stays on /login.html.

#### 1.4. Protected page redirects to login, then returns to the requested page after sign in

**File:** `tests/e2e/login/redirect-next.spec.ts`

**Steps:**
  1. Navigate directly to /documents.html while signed out.
    - expect: URL becomes /login.html?next=%2Fdocuments.html.
    - expect: Heading "Sign in to Acme HR" is visible; the Documents page content is not shown.
  2. Sign in with the demo credentials (DEMO_USERNAME / DEMO_PASSWORD).
    - expect: URL becomes /documents.html (not /dashboard.html).
    - expect: The Documents page shows heading "Documents", "Upload a document" and "My documents".
  3. Negative check in a fresh signed-out context: open /login.html?next=https://example.com and sign in with the demo credentials.
    - expect: The external URL is ignored (same-site paths only); the browser ends on the portal at /dashboard.html, not on example.com.

#### 1.5. Protected pages are inaccessible when signed out

**File:** `tests/e2e/login/protected-redirect.spec.ts`

**Steps:**
  1. Navigate directly to /dashboard.html while signed out.
    - expect: URL becomes /login.html?next=%2Fdashboard.html.
    - expect: Heading "Sign in to Acme HR" is visible; no "Log out" button is shown.
  2. Navigate directly to /documents.html.
    - expect: URL becomes /login.html?next=%2Fdocuments.html.

#### 1.6. Log out returns to login with a confirmation and ends the session

**File:** `tests/e2e/login/log-out.spec.ts`

**Steps:**
  1. Sign in with the demo credentials (DEMO_USERNAME / DEMO_PASSWORD) and confirm /dashboard.html loads.
    - expect: Heading "Welcome, Alex Morgan" and the "Log out" button are visible.
  2. Click the "Log out" button in the header.
    - expect: URL becomes /login.html?loggedOut=1.
    - expect: The message "You have been logged out." is visible above the Username and Password fields.
    - expect: Heading "Sign in to Acme HR" is visible.
  3. Navigate directly to /dashboard.html.
    - expect: User is redirected to /login.html?next=%2Fdashboard.html; the dashboard is not shown.
  4. Navigate back (browser Back) to a protected page if reachable.
    - expect: No protected content is accessible; the user ends up on the login page.
