# Karibu Groceries LTD (Wholesale internal Cereal Management System)

## Project Overview

**Karibu Groceries LTD (KGL)** is a wholesale cereal distributor operating in two branches: **Maganjo** and **Matugga**.

The business previously relied on manual record-keeping using physical black books, resulting in:
- Frequent errors
- Poor visibility of stock and sales
- Difficulty tracking credit/deferred payments
- Limited oversight for directors

This full-stack application replaces the manual system with a digital solution that:
- Enforces business rules through role-based access
- Provides accurate real-time stock and sales tracking
- Improves accountability and reporting
- Supports both cash and credit sales workflows

## Key Features

- **Role-based access control** (Director, Manager, Sales Agent)
- Procurement recording (incoming produce from dealers/farms)
- Cash and credit/deferred sales management
- Stock level tracking (reduces automatically after sales)
- Aggregated reporting for directors
- Secure user authentication (JWT-based)
- Interactive frontend dashboard with filters, pagination & CSV export
- Comprehensive API documentation via **Swagger**

## User Roles & Permissions

| Role          | Can View Totals (All Branches) | Can Record Procurement | Can Set Prices | Can Record Sales | Can View Credit Balances |
|---------------|--------------------------------|------------------------|----------------|------------------|---------------------------|
| **Director**  | Yes                            | No                     | No             | No               | Yes                       |
| **Manager**   | Yes                            | Yes                    | Yes            | No              | Yes                       |
| **Sales Agent**| No                            | No                     | No             | Yes              | Limited                   |

## Technologies Used

### Frontend
- HTML5
- CSS3 (custom design system + Bootstrap 5)
- Vanilla JavaScript (no frameworks)
- Font Awesome icons

### Backend
- Node.js + Express.js
- MongoDB (via Mongoose)
- JWT for authentication
- Swagger (swagger-jsdoc + swagger-ui-express) for API documentation
- dotenv for environment variables
- helmet, cors, express-rate-limit (security)


## API Architecture – Three Distinct Routers

As required, the backend uses **three modular Express routers**:

1. **/api/procurement**  
   Handles recording of produce purchases from dealers/farms  
   Protected: Managers only

2. **/api/sales**  
   Handles both **cash sales** and **credit/deferred sales**  
   Protected: Managers + Sales Agents

3. **/api/users** (or /api/auth)  
   Handles user registration, login, role management  
   Login returns JWT token used for protected routes

API documentation is available at:  
→ **http://localhost:5000/api-docs** (after running the server)

## Business Rules Enforced

- Stock quantity decreases automatically after each sale
- Cannot sell more than available stock
- Credit sales require buyer National ID (NIN), location, contacts, due date
- Only Managers can record procurement entries and set selling prices
- Directors can only view summaries and totals (no write operations)
- All monetary values stored in Ugandan Shillings (UgX)

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Git


## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/karibu-groceries.git
cd karibu-groceries
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development

DATABASE_URI=mongodb://localhost:27017/karibu_groceries_db
# or Atlas: mongodb+srv://user:pass@cluster0.mongodb.net/karibu_groceries?retryWrites=true&w=majority

JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRES_IN=1d
```

**Never commit your real `.env` file!**

### 4. Start MongoDB

If using local MongoDB:

```bash
mongod
```

### 5. Run the server

```bash
npm start
# or for development with auto-restart:
npm run dev
```

Server runs on: **http://localhost:5000** (or your PORT)

API docs: **http://localhost:5000/api-docs**

## How to Use (Frontend)

1. Open `frontend/login.html` in a browser (or serve via Live Server / VS Code)
2. Log in with valid credentials (create users via API or seed script if needed)
3. System redirects to role-appropriate dashboard
4. Managers → procurement + sales
5. Sales Agents → sales only
6. Director → view-only summaries

## Security & Best Practices Implemented

- JWT Bearer token authentication
- Role-based authorization middleware
- Helmet for security headers
- CORS configured for frontend origins
- Rate limiting (global + auth endpoints)
- Input validation (Joi or Zod recommended)
- `.env` secrets not committed
- `.gitignore` includes node_modules, .env, logs, etc.

## Future Improvements (Possible)
- Vue frontend migration


## License

MIT License – feel free to use for learning purposes.

Made for Karibu Groceries LTD 