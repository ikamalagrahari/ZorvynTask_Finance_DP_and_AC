# Finance Tracker API

A production-ready Node.js built for financial record tracking and dashboard aggregations, demonstrating clean architecture, comprehensive Role-Based Access Control (RBAC), and complex MongoDB aggregation pipelines.

## 🚀 Built With
- **Node.js & Express** - Fast, unopinionated routing
- **MongoDB & Mongoose** - Schema-based NoSQL database models
- **JWT (JSON Web Tokens)** - Secure stateless authentication
- **Joi** - Payload validation
- **Bcryptjs** - Password hashing

## 📂 Project Structure
```text
src
 ├── config          # Database connection
 ├── controllers     # Route logic
 ├── middleware      # Auth & Role checks
 ├── models          # Mongoose schemas
 ├── routes          # Express routes
 └── server.js       # Main entry point
```

## 🛠️ Quick Start & Setup Instructions

A massive advantage of this architecture is that it is built completely "Plug-and-Play". It spins up an ephemeral **In-Memory MongoDB**, hosts the SPA Frontend natively, and actively **seeds** the database behind the scenes on startup!

1. **Install Dependencies**:
   First, make sure all backend packages and the Memory-Server are downloaded:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   A `.env` file is required in the root directory. Feel free to copy these defaults:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/finance_db
   JWT_SECRET=supersecretjwtkey_12345
   ```

3. **Start the Application**:
   Run the backend. It will simultaneously bootstrap the MongoDB Memory Server, launch the API, and statically host the UI dashboard:
   ```bash
   node src/server.js
   ```

4. **Access the Application UI**:
   Open a browser and navigate to:
   👉 **http://localhost:5000**

### 🧪 Dummy Data & Test Accounts
Because the server utilizes an in-memory database, it automatically generates users and 35 financial records upon every startup so you aren't staring at empty dashboards!

You can log in to the frontend utilizing these automatically created Dummy Accounts (Password is `password123` for all):
- **Admin**: `admin@test.com` (Has full access to everything, including User Role Management)
- **Analyst**: `analyst@test.com` (Can access Dashboard stats and view Records)
- **Viewer**: `viewer@test.com` (Only allowed to View Records without any modification permissions)


## 🔐 Role-Based Access Control (RBAC)

This API relies on a tiered role system:
- **`viewer`**: Can view records but cannot modify them or access dashboards.
- **`analyst`**: Can view records and has full access to dashboard aggregate APIs.
- **`admin`**: Has full CRUD capability on records and can manage users.

*Assumption:* Only admins can create financial records for simplicity to maintain clear audit trails of data entry.

## 📡 Core API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user (returns JWT)
- `POST /api/auth/login`: Authenticate existing user (returns JWT)

### Users (Admin Only)
- `GET /api/users`: List all users
- `PATCH /api/users/:id`: Modify user roles or active status
- `DELETE /api/users/:id`: Delete a user account

### Financial Records
- `POST /api/records`: **[Admin]** Create new record
- `GET /api/records`: **[All Roles]** List records with pagination (`?page=1&limit=10`) and filtering (`?type=income&category=salary`)
- `GET /api/records/:id`: **[All Roles]** Get specific record
- `PATCH /api/records/:id`: **[Admin]** Update an existing record
- `DELETE /api/records/:id`: **[Admin]** Soft delete a record

### Dashboards (Admin / Analyst Only)
*All dashboard endpoints utilize MongoDB aggregation pipelines for performant real-time dataset synthesis.*
- `GET /api/dashboard/summary`: Get totals for income, expense, and net balance
- `GET /api/dashboard/category`: Returns grouped balances per category
- `GET /api/dashboard/trends`: Organizes sums chronologically (by month/year)
- `GET /api/dashboard/recent`: Fetches 5 most recent activities

## 💡 Key Features Implemented

1. **Clean RBAC**: Middlewares are segregated (`auth.js` verifies identity, `role.js` verifies permissions).
2. **Advanced Filtering & Pagination**: Optimized `GET /records` uses `skip`/`limit` logic preventing massive unpaginated queries to the DB.
3. **Soft Delete**: Deleting a record sets `isDeleted: true` instead of dropping it entirely from MongoDB. This safeguards aggregations and records against accidental destructive actions.
4. **Mongoose Aggregations**: The dashboard controller features `$match`, `$group`, `$sum`, and chronological `$sort` mapping.
