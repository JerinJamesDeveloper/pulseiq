# PulseIQ API

PulseIQ REST API built with Node.js, Express, and MySQL. This API manages projects, learning materials, reports, documents, goals, and analytics for the PulseIQ platform.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (using `mysql2`)
- **Security:** Helmet, CORS
- **Validation:** Express Validator
- **Logging:** Morgan
- **Development:** Nodemon, Dotenv

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- MySQL Server

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pulseiq-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory based on the following template:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=pulseiq
   DB_PORT=3306
   DB_CONNECTION_LIMIT=10

   # API Configuration
   API_BASE_URL=http://localhost:3001/api
   CORS_ORIGIN=http://localhost:5173
   ```

4. Database Setup:
   Import the database schema:
   ```bash
   npm run db:migrate
   ```

### Running the Project

- **Development Mode:**
  ```bash
  npm run dev
  ```

- **Production Mode:**
  ```bash
  npm start
  ```

## 📚 API Endpoints Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | GET | Health check and server status |
| `/api/projects` | GET/POST | Manage projects |
| `/api/projects/:projectId/learning` | GET/POST | Manage learning materials for a project |
| `/api/projects/:projectId/reports` | GET/POST | Manage project reports |
| `/api/projects/:projectId/docs` | GET/POST | Manage project documentation |
| `/api/projects/:projectId/goals` | GET/POST | Manage project goals |
| `/api/analytics` | GET | Fetch platform analytics |

## 📂 Project Structure

```text
pulseiq-api/
├── src/
│   ├── config/      # Database and application configuration
│   ├── controllers/ # Request handlers
│   ├── middleware/  # Custom Express middleware (error handling, auth, etc.)
│   ├── models/      # Database models and queries
│   ├── routes/      # API route definitions
│   ├── services/    # Business logic and external integrations
│   ├── utils/       # Utility functions and helpers
│   ├── scripts/     # Database seeding and maintenance scripts
│   └── app.js       # Express application setup
├── server.js        # Server entry point
└── .env             # Environment variables (private)
```

## 📜 Available Scripts

- `npm run dev`: Starts the server with `nodemon` for development.
- `npm start`: Starts the server in production mode.
- `npm run db:migrate`: Migrates the database schema (requires `database_schema.sql`).
- `npm run db:seed`: Seeds the database with initial data.
- `npm run sync:process`: Processes the synchronization queue.
- `npm run sync:clean`: Cleans old synchronization records.
