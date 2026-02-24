# 🚀 PulseIQ - Elevate Your Project Tracking

**PulseIQ** is a comprehensive, data-driven project tracking system designed to streamline workflows, capture knowledge, and provide actionable insights into your development process. Built with precision and a focus on productivity, PulseIQ empowers teams and individual developers to stay organized and informed.

---

## ✨ Key Features

- 📁 **Project Management**: Effortlessly manage and track multiple projects from a single dashboard.
- 🎯 **Goal Setting**: Define, monitor, and achieve milestones for every initiative.
- 📝 **Daily Reports**: Systematic progress tracking through structured daily reporting.
- 📚 **Learning Log**: A dedicated space to capture, curate, and share knowledge gained during development.
- 📑 **Documentation Hub**: Centralized repository for all your project-related documents.
- 📊 **Advanced Analytics**: Unlock deeper insights into your productivity with interactive data visualizations.

---

## 🛠 Tech Stack

PulseIQ leverages a modern and robust technology stack for performance and scalability:

- **Frontend**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Database**: [MySQL](https://www.mysql.com/)

---

## 📂 Project Structure

```text
pulseiq/              # Root Directory
├── pulseiq-api/      # Backend REST API (Node.js/Express)
├── pulseiq-webapp/   # Frontend Dashboard (React/TS/Vite)
└── pulseiq-db/       # Database Schema and Scripts
```

---

## 🚀 Getting Started

Follow these steps to set up PulseIQ locally.

### Prerequisites
- **Node.js**: v18.x or higher
- **MySQL**: v8.0 or higher

### 1. Database Setup
1. Create a new MySQL database named `pulseiq_db`.
2. Import the schema found in `pulseiq-api/database_schema.sql` (if available) or follow the migration instructions in the API directory.

### 2. API Setup
```bash
cd pulseiq-api
npm install
# Configure your .env file with database credentials
npm run dev
```

### 3. Webapp Setup
```bash
cd pulseiq-webapp
npm install
npm run dev
```

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests or open issues to improve PulseIQ.

---

## 🛡 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**with love embit team** ❤️
