# Karibu Groceries LTD - Frontend System

## Project Overview
Karibu Groceries LTD (KGL) is a wholesale cereal distributor operating two branches.
The business previously relied on manual black book records, which led to inefficiencies,
errors, and limited visibility.

This frontend system is part of a digital solution designed to:
- Improve record keeping
- Enforce business rules
- Support role-based operations
- Increase accuracy and accountability

The system is developed using:
HTML, CSS, JavaScript, Node.js, and MongoDB.


## Technologies Used
- HTML5 - Page structure
- CSS3 - Styling and layout
- Vanilla JavaScript - Frontend logic
- Node.js (backend integration)
- MongoDB (data storage)


## User Roles and Access Control

### 1. Director (Mr. Orban)
- Views aggregated totals across all branches
- Cannot record sales or add produce

### 2. Manager
- Records produce procurement
- Sets selling prices
- Can record sales
- Monitors stock levels

### 3. Sales Agent
- Records cash sales
- Records credit sales for trusted buyers
- Cannot add produce or modify prices

Enforced Role-based access at the frontend level.


## frontend/ Folder Structure Explanation

- index.html for Login page
- pages/ Role-based dashboards
- css/ Styling files
- js/ JavaScript logic
- auth.js for Authentication & routing
- api.js for Backend communication
- utils.js forInput validation
- manager/ Manager logic
- sales/ Sales agent logic
- director/ Director logic
- assets/ Images and static files

---

## Business Rules Implemented
- Only available stock can be sold
- Stock quantity reduces after every sale
- Out-of-stock items trigger manager notification
- Prices are pre-set by the manager
- Credit sales are recorded separately
- Director can only view totals and summaries

---

## How to Run the Frontend
1. Open `index.html` in a browser
2. Log in using the appropriate role
3. The system redirects to the correct dashboard

---

# Debugging-js

# Procurement Form Debugging  Assignment Task

Debug the **Karibu Groceries procurement form** by:

1. Fixing **syntax errors** (minimum 3)
2. Correcting **logical errors** (minimum 2)
3. Adding **runtime error handling**
4. Testing with **valid and invalid data**
5. Documenting all fixes

---

## Fixes Implemented

### 1️ Syntax Errors ( minimum 3)

1. **Prevented form auto-reload** using:

```js
e.preventDefault();
```

2. **Removed references to non-existent DOM element** (`cost`) that caused runtime errors.
3. **Fixed duplicate HTML `<!DOCTYPE html>`** in original code.
4. **Corrected input attributes** to match JS validations (`min` values, placeholders).

---

### 2️ Logical Errors ( minimum 2)

1. **Role-based access control**

```js
if (!user || user.role !== "manager") {
  alert("Access denied. Managers only.");
  window.location.href = "../index.html";
}
```

2. **Stock merge logic**

- If the same produce exists in the same branch, increase `tonnage` instead of creating a duplicate:

```js
if (existingStock) {
  existingStock.tonnage += tonnage;
}
```

3. **Tonnage validation fixed** - HTML `min` and JS numeric validation aligned (≥1000 KG).

---

### 3️ Runtime Error Handling

1. **Form existence check**

```js
if (!form) {
  alert("System error: Procurement form failed to load.");
  throw new Error("Procurement form missing");
}
```

2. **Safe localStorage access**

```js
try {
  user = JSON.parse(localStorage.getItem("kglUser"));
} catch (err) {
  console.warn("localStorage unavailable or corrupted.");
}
```

3. **Global try/catch on submission**

```js
try {
  // form logic
} catch (error) {
  alert("An unexpected system error occurred. Please try again.");
}
```

---

## Testing

### Valid Data (Expected: Success)

| Field          | Example    |
| -------------- | ---------- |
| Produce Name   | Beans      |
| Produce Type   | Red        |
| Tonnage        | 1500       |
| Dealer Contact | 0701234567 |
| Selling Price  | 3000       |

- Record saved successfully
- Existing stock merged if present

---

### Invalid Data (Expected: Alerts)

| Test Case          | Result                           |
| ------------------ | -------------------------------- |
| Empty produce name | Alert: Must be alphanumeric      |
| Tonnage < 1000     | Alert: Must be ≥1000 KG          |
| Invalid phone      | Alert: Enter valid Ugandan phone |
| Selling price ≤ 0  | Alert: Must be valid numeric     |
| Non-manager user   | Alert: Access denied             |

---

## Files

```
/procurement.html
/procurement.js
/README.md
```

---

## Pre-Commit Hooks

This project uses Husky to enforce code quality before commits.
Before every commit, ESLint and Prettier are executed automatically
to prevent linting and formatting issues from entering the repository.

### Code Quality Tools

This project uses ESLint and Prettier to enforce consistent code style,
catch common bugs, and improve maintainability. All files were linted
and formatted successfully.

Note: ESLint v9+ uses `eslint.config.mjs` instead of `.eslintrc.json`.
