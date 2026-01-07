# Karibu Groceries LTD

## Project Overview
Karibu Groceries LTD (KGL) is a wholesale cereal distributor operating two branches.
The business previously relied on manual black book records, which led to inefficiencies,
errors, and limited visibility.

This system is a digital solution designed to:
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

## Business Rules Implemented
- Only available stock can be sold
- Stock quantity reduces after every sale
- Out-of-stock items trigger manager notification
- Prices are pre-set by the manager
- Credit sales are recorded separately
- Director can only view totals and summaries

---

1. Open `index.html` in a browser
2. Log in using the appropriate role
3. The system redirects to the correct dashboard
