# 🚀 PulseIQ v2.4.1

**PulseIQ** is an enterprise-ready engineering intelligence platform for teams and builders who want a single source of truth for delivery, learning, documentation, and Git activity.

It combines structured project tracking with AI-assisted workflows, GitHub analytics, and operational reporting so teams can move from raw activity to actionable decisions.

## 🎯 Core Idea

Most teams track work in fragments:
- tasks in one place
- code activity in another
- learning notes in docs
- reports in spreadsheets

PulseIQ unifies all of this into one product model:
- **Execution**: tasks, goals, reports, hours
- **Engineering Signals**: commits, PRs, reviews, language distribution
- **Knowledge**: learning entries and documentation
- **Intelligence**: AI assistant for analysis and guidance

## 💼 Who This Is For

- Engineering teams that want portfolio visibility
- Individual developers building serious products
- Tech leads who need measurable health signals
- Teams that need export-ready reporting for stakeholders

## ✨ Key Capabilities

- 📁 **Project Lifecycle Management**  
  Manage projects, progress, quality indicators, and goals from one dashboard.

- 🤖 **AI Assistant Integration**  
  OpenRouter-powered assistant to support analysis and developer workflows.

- 🔗 **GitHub Intelligence**  
  Pull repo-level metrics including commits, pull requests, merge activity, code reviews, commit trends, and language mix.

- 📊 **Language Distribution by Percentage**  
  GitHub language byte counts are normalized into percentages (total = 100%) for meaningful visualization.

- 🧾 **Enterprise Reporting + XLSX Export**  
  Convert project data into multi-sheet Excel workbooks and download instantly for audits, sharing, and stakeholder updates.

- 🌐 **Resilient App Behavior**  
  API-aware frontend with fallback behavior for offline/unavailable backend scenarios.

## 🧱 Architecture

- **Frontend**: React + TypeScript + Vite (`pulseiq-webapp/`)
- **Backend**: Node.js + Express (`pulseiq-api/`)
- **Database**: MySQL (`pulseiq-db/` + API schema/models)

```text
pulseiq_v2/
|-- pulseiq-api/       # REST API, services, controllers, models
|-- pulseiq-webapp/    # UI, API client, analytics views, export flow
`-- pulseiq-db/        # DB assets
```

## ⚙️ Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8+

### 1. API Setup

```bash
cd pulseiq-api
cp .env.example .env
npm install
npm run dev
```
   
### 2. Web App Setup

```bash
cd pulseiq-webapp
npm install
npm run dev
```

Default API base URL: `http://localhost:3001/api`

## 🔐 Environment Configuration

Create `pulseiq-api/.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=pulseiq
DB_PORT=3306

# AI (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# GitHub (recommended)
GITHUB_TOKEN=ghp_your_token_here
```

Notes:
- `OPENROUTER_API_KEY` is required for AI assistant features.
- `GITHUB_TOKEN` is optional, but strongly recommended for higher GitHub API limits.

## 🧠 AI Assistant (v2)

- Service: `pulseiq-api/src/services/aiService.js`
- Route family: `/api/ai/*`
- Provider: OpenRouter SDK
- Model override: `OPENROUTER_MODEL`

Reference: `pulseiq-api/docs/ai-chat.md`

## 🔍 GitHub Metrics (v2)

- Endpoint: `GET /api/projects/:id/git-metrics`
- Captures:
  - commits
  - pull requests
  - merged PRs
  - code reviews
  - commit messages
  - daily/period trends
  - language percentages

Reference: `pulseiq-api/docs/git-metrics.md`

## 📦 XLSX Convert & Download (v2)

- Library: `xlsx` (webapp)
- Conversion + download flow implemented in:
  - `pulseiq-webapp/src/App.tsx` (`downloadProjectExcel`)
- Output:
  - `<project-name>-export.xlsx`
- Includes multiple sheets (project summary + related datasets).

## 📚 Documentation Index

- Platform API reference: `pulseiq-webapp/API_DOCUMENTATION.md`
- API module guide: `pulseiq-api/README.md`
- AI integration doc: `pulseiq-api/docs/ai-chat.md`
- Git metrics doc: `pulseiq-api/docs/git-metrics.md`

## ✅ Roadmap Direction

- Authentication and role-based access
- Team/org workspaces
- Advanced analytics and forecasting
- Notification and automation workflows

## 📄 License

MIT

---

## 🏷️ Changelog

### v2.4.1 (Current)

#### Features
- **GitHub Issue Sync**: Issues created in PulseIQ now sync to GitHub. When you close/update an issue in PulseIQ, it reflects in GitHub.
- **Issue Time Tracking**: Added `timeSpent` field to manually track hours spent on issues. Users can input time when creating or updating issues. Time updates are synced to GitHub as comments.

#### Technical Changes
- Added `updateIssue()` method to GitHub service for syncing issue updates
- Added `githubNumber` field to store GitHub issue reference
- Added `timeSpent` field (DECIMAL) to issues table
- Updated API types and payloads to support new fields
- Added database migration script for new columns
- Added Time Spent input field to Add Issue modal

#### Database Migration
Run the migration to add new columns:
```bash
cd pulseiq-api && node src/scripts/add_github_number_to_issues.js
```
Or manually:
```sql
ALTER TABLE issues ADD COLUMN githubNumber INT NULL;
ALTER TABLE issues ADD COLUMN timeSpent DECIMAL(10,2) DEFAULT 0;
```

---

with love embit team ❤️
