# Employee Directory Test Plan

## Application Overview

Test plan for the Employee directory page (/directory.html) of the Acme HR Portal (http://localhost:8080). The page has a searchbox labelled "Search by name or department" that filters a 10-row table (columns: Name, Title, Department, Email, Location) as the user types, case-insensitively, matching name or department. A status line shows "Showing N of 10 employees"; with no matches a paragraph "No employees found." appears. All scenarios start from a fresh signed-in state (Alex Morgan, via signIn(page), never typing credentials) and navigate to /directory.html. Generated tests go in tests/e2e/directory/.

Reference data (full list on load, in order): Alex Morgan | Software Engineer | Engineering | alex.morgan@acme-hr.example | New York; Priya Sharma | HR Business Partner | Human Resources | priya.sharma@acme-hr.example | New York; Daniel Kim | Engineering Manager | Engineering | daniel.kim@acme-hr.example | Austin; Maria Lopez | Payroll Specialist | Finance | maria.lopez@acme-hr.example | Chicago; James Carter | Recruiter | Human Resources | james.carter@acme-hr.example | Remote; Aisha Bello | QA Engineer | Engineering | aisha.bello@acme-hr.example | Austin; Tom Nguyen | Financial Analyst | Finance | tom.nguyen@acme-hr.example | Chicago; Sofia Rossi | Product Designer | Design | sofia.rossi@acme-hr.example | Remote; Ravi Patel | Benefits Coordinator | Human Resources | ravi.patel@acme-hr.example | New York; Emma Wilson | Sales Manager | Sales | emma.wilson@acme-hr.example | Boston.

## Test Scenarios

### 1. Employee Directory

**Seed:** `tests/seed.spec.ts`

#### 1.1. Full employee list on load

**File:** `tests/e2e/directory/full-list-on-load.spec.ts`

**Steps:**
  1. Using the seed (signed in as Alex Morgan), navigate to /directory.html.
    - expect: Heading "Employee directory" is visible
    - expect: Searchbox "Search by name or department" is visible and empty
    - expect: Status shows "Showing 10 of 10 employees"
    - expect: "No employees found." is not visible
  2. Inspect the table headers and rows.
    - expect: Column headers are Name, Title, Department, Email, Location
    - expect: The table body has 10 rows
    - expect: Names in order: Alex Morgan, Priya Sharma, Daniel Kim, Maria Lopez, James Carter, Aisha Bello, Tom Nguyen, Sofia Rossi, Ravi Patel, Emma Wilson
    - expect: The Alex Morgan row shows Software Engineer, Engineering, alex.morgan@acme-hr.example, New York

#### 1.2. Search by name shows a single matching row

**File:** `tests/e2e/directory/search-by-name.spec.ts`

**Steps:**
  1. Navigate to /directory.html and type "Priya Sharma" into the "Search by name or department" searchbox.
    - expect: Status shows "Showing 1 of 10 employees"
    - expect: Exactly 1 table body row is visible
    - expect: The row contains cells: Priya Sharma, HR Business Partner, Human Resources, priya.sharma@acme-hr.example, New York
    - expect: Rows such as Alex Morgan and Emma Wilson are not present
    - expect: "No employees found." is not visible
  2. Replace the text with "Emma".
    - expect: Status shows "Showing 1 of 10 employees"
    - expect: The only row is Emma Wilson | Sales Manager | Sales | emma.wilson@acme-hr.example | Boston

#### 1.3. Search by department lists exactly the department members

**File:** `tests/e2e/directory/search-by-department.spec.ts`

**Steps:**
  1. Navigate to /directory.html and type "Engineering" into the searchbox.
    - expect: Status shows "Showing 3 of 10 employees"
    - expect: Exactly 3 rows: Alex Morgan, Daniel Kim, Aisha Bello (all Department Engineering)
    - expect: Priya Sharma and Maria Lopez are not shown
  2. Replace the text with "Human Resources".
    - expect: Status shows "Showing 3 of 10 employees"
    - expect: Exactly 3 rows: Priya Sharma, James Carter, Ravi Patel
  3. Replace the text with "Finance".
    - expect: Status shows "Showing 2 of 10 employees"
    - expect: Exactly 2 rows: Maria Lopez, Tom Nguyen

#### 1.4. Search is case-insensitive and matches partial text

**File:** `tests/e2e/directory/search-case-insensitive-partial.spec.ts`

**Steps:**
  1. Navigate to /directory.html and type "AISHA" (upper case).
    - expect: Status shows "Showing 1 of 10 employees"
    - expect: The only row is Aisha Bello | QA Engineer | Engineering | aisha.bello@acme-hr.example | Austin
  2. Replace the text with "fin" (partial, lower case department prefix).
    - expect: Status shows "Showing 2 of 10 employees"
    - expect: Rows are Maria Lopez and Tom Nguyen (Finance)
  3. Replace the text with "sALES" (mixed case).
    - expect: Status shows "Showing 1 of 10 employees"
    - expect: The only row is Emma Wilson (Sales)

#### 1.5. No results message and clearing the search restores all employees

**File:** `tests/e2e/directory/no-results-and-clear.spec.ts`

**Steps:**
  1. Navigate to /directory.html and type "zzz" into the searchbox.
    - expect: Status shows "Showing 0 of 10 employees"
    - expect: "No employees found." is visible
    - expect: The table body has 0 rows (headers still shown)
  2. Clear the searchbox (fill with empty text).
    - expect: Status shows "Showing 10 of 10 employees"
    - expect: "No employees found." is not visible
    - expect: The table body again has 10 rows, starting with Alex Morgan and ending with Emma Wilson
  3. Type "Design", then clear the searchbox.
    - expect: After typing: status "Showing 1 of 10 employees" with only Sofia Rossi
    - expect: After clearing: status "Showing 10 of 10 employees" and all 10 rows are visible
