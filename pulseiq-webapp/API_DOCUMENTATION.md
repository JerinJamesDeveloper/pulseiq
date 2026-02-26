# PulseIQ – REST API Documentation

## Overview

PulseIQ communicates with a backend REST API over HTTP/JSON.  
When the API server is unreachable the app falls back to **offline mode** with local mock data. All CRUD operations are still functional locally and will sync when the API becomes available.

**Default base URL:** `http://localhost:3001/api`  
Configurable via the `VITE_API_BASE_URL` environment variable or the in-app ⚙️ API Settings dialog.

---

## Table of Contents

1. [General Conventions](#general-conventions)
2. [Health Check](#health-check)
3. [Projects](#projects)
4. [Learning Entries](#learning-entries)
5. [Daily Reports](#daily-reports)
6. [Documentation](#documentation)
7. [Goals](#goals)
8. [Analytics](#analytics)
9. [Data Models](#data-models)
10. [Error Handling](#error-handling)

---

## General Conventions

| Aspect | Convention |
|---|---|
| Content-Type | `application/json` |
| Date format | ISO 8601 strings (`"2025-01-20"` or `"2025-01-20T14:30:00.000Z"`) |
| IDs | Integer, server-generated |
| Pagination | Not required (small datasets), but the list responses include `total` |
| Auth | Not implemented yet – add `Authorization: Bearer <token>` header as needed |

### Standard Response Wrapper

**Single item:**
```json
{
  "data": { ... },
  "message": "Success",
  "timestamp": "2025-01-20T14:30:00.000Z"
}
```

**List:**
```json
{
  "data": [ ... ],
  "total": 3,
  "message": "Success",
  "timestamp": "2025-01-20T14:30:00.000Z"
}
```

---

## Health Check

### `GET /api/health`

Returns server health status. Used by the frontend to detect online/offline state.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2025-01-20T14:30:00.000Z"
}
```

---

## Projects

### `GET /api/projects`

List all projects.

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "NeuralCart",
      "category": "E-Commerce",
      "color": "#00FFB2",
      "totalTasks": 84,
      "completedTasks": 61,
      "features": 22,
      "bugsFixed": 18,
      "refactors": 9,
      "totalHours": 312,
      "activeDays": 47,
      "lastActive": "2025-01-19T00:00:00.000Z",
      "commits": 198,
      "techStack": ["Next.js", "PostgreSQL", "Redis"],
      "weeklyHours": [4, 6, 3, 7, 5, 2, 4],
      "monthlyHours": [24, 38, 42, 31, 28, 35, 41, 29, 33, 27, 38, 44, 30, 45, 32],
      "learningPoints": 840,
      "learningEntries": [ ... ],
      "gitMetrics": { ... },
      "documentation": [ ... ],
      "dailyReports": [ ... ],
      "createdDate": "2024-10-22T00:00:00.000Z",
      "goals": [ ... ]
    }
  ],
  "total": 1
}
```

---

### `GET /api/projects/:id`

Get a single project by ID.

**URL Parameters:**
| Param | Type | Description |
|---|---|---|
| `id` | integer | Project ID |

**Response `200 OK`:**
```json
{
  "data": { "id": 1, "name": "NeuralCart", ... }
}
```

**Response `404 Not Found`:**
```json
{
  "error": "Not Found",
  "message": "Project with id 999 not found",
  "statusCode": 404
}
```

---

### `POST /api/projects`

Create a new project.

**Request Body:**
```json
{
  "name": "NeuralCart",
  "category": "E-Commerce",
  "color": "#00FFB2",
  "techStack": ["Next.js", "PostgreSQL", "Redis"],
  "totalTasks": 84
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Project name (1-100 chars) |
| `category` | string | ✅ | One of: `E-Commerce`, `SaaS Tool`, `DevOps`, `Mobile App`, `API Service`, `Data Pipeline`, `ML/AI`, `Open Source`, `LIMS development` |
| `color` | string | ✅ | Hex color code (e.g., `#00FFB2`) |
| `techStack` | string[] | ✅ | Array of technology names |
| `totalTasks` | integer | ✅ | Estimated total task count (≥ 0) |

**Response `201 Created`:**
```json
{
  "data": {
    "id": 4,
    "name": "NeuralCart",
    "category": "E-Commerce",
    "color": "#00FFB2",
    "totalTasks": 84,
    "completedTasks": 0,
    "features": 0,
    "bugsFixed": 0,
    "refactors": 0,
    "totalHours": 0,
    "activeDays": 0,
    "lastActive": "2025-01-20T14:30:00.000Z",
    "commits": 0,
    "techStack": ["Next.js", "PostgreSQL", "Redis"],
    "weeklyHours": [0, 0, 0, 0, 0, 0, 0],
    "monthlyHours": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "learningPoints": 0,
    "learningEntries": [],
    "gitMetrics": {
      "commitsByDay": [0, 0, 0, 0, 0, 0, 0],
      "pullRequests": 0,
      "mergedPRs": 0,
      "codeReviews": 0,
      "commitMessages": [],
      "languages": {},
      "commitTrend": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    "documentation": [],
    "dailyReports": [],
    "createdDate": "2025-01-20T14:30:00.000Z",
    "goals": []
  },
  "message": "Project created successfully"
}
```

---

### `PUT /api/projects/:id`

Full update of a project.

**Request Body:**
```json
{
  "name": "NeuralCart v2",
  "category": "E-Commerce",
  "color": "#00FFB2",
  "totalTasks": 100,
  "completedTasks": 65,
  "features": 24,
  "bugsFixed": 20,
  "refactors": 10,
  "totalHours": 340,
  "activeDays": 50,
  "lastActive": "2025-01-20T14:30:00.000Z",
  "commits": 210,
  "techStack": ["Next.js", "PostgreSQL", "Redis", "Docker"],
  "weeklyHours": [4, 6, 3, 7, 5, 2, 4],
  "monthlyHours": [24, 38, 42, 31, 28, 35, 41, 29, 33, 27, 38, 44, 30, 45, 32],
  "learningPoints": 900
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ❌ | Project name |
| `category` | string | ❌ | Project category |
| `color` | string | ❌ | Hex color code |
| `totalTasks` | integer | ❌ | Total task count |
| `completedTasks` | integer | ❌ | Completed task count |
| `features` | integer | ❌ | Features built |
| `bugsFixed` | integer | ❌ | Bugs fixed |
| `refactors` | integer | ❌ | Refactoring tasks done |
| `totalHours` | number | ❌ | Total hours invested |
| `activeDays` | integer | ❌ | Number of active days |
| `lastActive` | string | ❌ | ISO date of last activity |
| `commits` | integer | ❌ | Total commits |
| `techStack` | string[] | ❌ | Technology list |
| `weeklyHours` | number[] | ❌ | Array of 7 numbers (Mon–Sun) |
| `monthlyHours` | number[] | ❌ | Array of 15 recent daily totals |
| `learningPoints` | integer | ❌ | Accumulated learning points |

**Response `200 OK`:**
```json
{
  "data": { "id": 1, ... },
  "message": "Project updated successfully"
}
```

---

### `PATCH /api/projects/:id`

Partial update – send only the fields you want to change.

Same fields as PUT, all optional.

---

### `DELETE /api/projects/:id`

Delete a project and all its sub-resources.

**Response `204 No Content`** (empty body)

---

## Learning Entries

### `GET /api/projects/:projectId/learning`

List all learning entries for a project.

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "concept": "Redis Pub/Sub",
      "category": "Backend",
      "difficulty": 4,
      "type": "New concept",
      "confidence": "Medium",
      "dateLogged": "2025-01-20",
      "timeSpent": 2.5,
      "resources": ["Redis docs", "YouTube tutorial"]
    }
  ],
  "total": 1
}
```

---

### `GET /api/projects/:projectId/learning/:id`

Get a single learning entry.

---

### `POST /api/projects/:projectId/learning`

Create a learning entry.

**Request Body:**
```json
{
  "concept": "Redis Pub/Sub",
  "category": "Backend",
  "difficulty": 4,
  "type": "New concept",
  "confidence": "Medium",
  "dateLogged": "2025-01-20",
  "timeSpent": 2.5,
  "resources": ["Redis docs", "YouTube tutorial"]
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `concept` | string | ✅ | 1-200 chars, the topic learned |
| `category` | string | ✅ | One of: `Backend`, `Frontend`, `DevOps`, `Architecture`, `Business` |
| `difficulty` | integer | ✅ | 1-5 (1 = easy, 5 = very hard) |
| `type` | string | ✅ | One of: `New concept`, `Mistake learned`, `Deepened knowledge`, `Optimization` |
| `confidence` | string | ✅ | One of: `Low`, `Medium`, `High` |
| `dateLogged` | string | ✅ | Date in `YYYY-MM-DD` format |
| `timeSpent` | number | ✅ | Hours spent (≥ 0, step 0.5) |
| `resources` | string[] | ❌ | Optional list of resource names |

**Response `201 Created`:**
```json
{
  "data": {
    "id": 5,
    "concept": "Redis Pub/Sub",
    ...
  },
  "message": "Learning entry created"
}
```

---

### `PUT /api/projects/:projectId/learning/:id`

Update a learning entry. Same fields as POST, all optional.

---

### `DELETE /api/projects/:projectId/learning/:id`

Delete a learning entry.

**Response `204 No Content`**

---

## Daily Reports

### `GET /api/projects/:projectId/reports`

List all daily reports for a project.

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-01-20",
      "hoursWorked": 4,
      "tasksDone": 3,
      "notes": "Fixed checkout race condition",
      "mood": "productive",
      "focusScore": 8
    }
  ],
  "total": 1
}
```

---

### `GET /api/projects/:projectId/reports/:id`

Get a single daily report.

---

### `POST /api/projects/:projectId/reports`

Create a daily report.

**Request Body:**
```json
{
  "date": "2025-01-20",
  "hoursWorked": 4,
  "tasksDone": 3,
  "notes": "Fixed checkout race condition, improved cache strategy",
  "mood": "productive",
  "focusScore": 8
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `date` | string | ✅ | Date in `YYYY-MM-DD` format |
| `hoursWorked` | number | ✅ | 0-24 (step 0.5) |
| `tasksDone` | integer | ✅ | ≥ 0 |
| `notes` | string | ❌ | Free text, accomplishments & notes |
| `mood` | string | ✅ | One of: `productive`, `focused`, `tired`, `distracted`, `stressed` |
| `focusScore` | integer | ✅ | 1-10 |

**Response `201 Created`:**
```json
{
  "data": { "id": 3, "date": "2025-01-20", ... },
  "message": "Daily report created"
}
```

---

### `PUT /api/projects/:projectId/reports/:id`

Update a daily report. Same fields as POST, all optional.

---

### `DELETE /api/projects/:projectId/reports/:id`

Delete a daily report.

**Response `204 No Content`**

---

## Documentation

### `GET /api/projects/:projectId/docs`

List all documentation entries for a project.

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-01-20",
      "title": "Redis Pub/Sub Implementation",
      "content": "Implemented message queue system...",
      "status": "complete",
      "sections": 5,
      "wordCount": 1250
    }
  ],
  "total": 1
}
```

---

### `GET /api/projects/:projectId/docs/:id`

Get a single documentation entry.

---

### `POST /api/projects/:projectId/docs`

Create a documentation entry.

**Request Body:**
```json
{
  "title": "Redis Pub/Sub Implementation",
  "content": "Implemented message queue system using Redis pub/sub for real-time updates...",
  "status": "complete",
  "date": "2025-01-20"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string | ✅ | 1-200 chars |
| `content` | string | ✅ | Documentation body text |
| `status` | string | ✅ | One of: `draft`, `in-progress`, `complete` |
| `date` | string | ✅ | Date in `YYYY-MM-DD` format |

> **Note:** The server should calculate `wordCount` and `sections` from the content, or the frontend sends them. The frontend calculates:
> - `wordCount` = `content.trim().split(/\s+/).length`
> - `sections` = `Math.max(1, content.split("\n\n").filter(s => s.trim()).length)`

**Response `201 Created`:**
```json
{
  "data": {
    "id": 2,
    "title": "Redis Pub/Sub Implementation",
    "content": "...",
    "status": "complete",
    "date": "2025-01-20",
    "sections": 5,
    "wordCount": 1250
  },
  "message": "Document created"
}
```

---

### `PUT /api/projects/:projectId/docs/:id`

Update a documentation entry.

**Request Body (all optional):**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "in-progress",
  "date": "2025-01-21"
}
```

---

### `DELETE /api/projects/:projectId/docs/:id`

Delete a documentation entry.

**Response `204 No Content`**

---

## Goals

### `GET /api/projects/:projectId/goals`

List all goals for a project.

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Master Redis patterns",
      "target": 100,
      "current": 75,
      "category": "Learning"
    }
  ],
  "total": 1
}
```

---

### `GET /api/projects/:projectId/goals/:id`

Get a single goal.

---

### `POST /api/projects/:projectId/goals`

Create a goal.

**Request Body:**
```json
{
  "title": "Master Redis patterns",
  "target": 100,
  "current": 0,
  "category": "Learning"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string | ✅ | 1-200 chars |
| `target` | number | ✅ | > 0 |
| `current` | number | ✅ | ≥ 0 |
| `category` | string | ✅ | One of: `Learning`, `Quality`, `Delivery`, `Performance`, `DevOps` |

**Response `201 Created`:**
```json
{
  "data": { "id": 3, "title": "Master Redis patterns", ... },
  "message": "Goal created"
}
```

---

### `PUT /api/projects/:projectId/goals/:id`

Update a goal (e.g., update `current` progress).

**Request Body (all optional):**
```json
{
  "current": 85
}
```

---

### `DELETE /api/projects/:projectId/goals/:id`

Delete a goal.

**Response `204 No Content`**

---

## Analytics

### `GET /api/analytics/overview`

Get aggregated analytics across all projects.

**Response `200 OK`:**
```json
{
  "data": {
    "totalProjects": 3,
    "totalHours": 744,
    "totalCommits": 448,
    "totalLearningPoints": 2040,
    "totalPullRequests": 35,
    "totalDailyReports": 5,
    "totalDocuments": 3,
    "overallProductivity": 72,
    "skillDistribution": {
      "Backend": 120,
      "Frontend": 30,
      "DevOps": 70,
      "Architecture": 0,
      "Business": 0
    }
  }
}
```

---

## Data Models

### ProjectDTO (Full)

```typescript
interface ProjectDTO {
  id: number;                        // Server-generated
  name: string;                      // 1-100 chars
  category: string;                  // Enum: E-Commerce | SaaS Tool | DevOps | Mobile App | API Service | Data Pipeline | ML/AI | Open Source | LIMS development
  color: string;                     // Hex color: #RRGGBB
  totalTasks: number;                // >= 0
  completedTasks: number;            // >= 0
  features: number;                  // >= 0
  bugsFixed: number;                 // >= 0
  refactors: number;                 // >= 0
  totalHours: number;                // >= 0
  activeDays: number;                // >= 0
  lastActive: string;                // ISO 8601 datetime
  commits: number;                   // >= 0
  techStack: string[];               // e.g., ["React", "Node.js"]
  weeklyHours: number[];             // Array of 7 (Mon-Sun)
  monthlyHours: number[];            // Array of 15 (recent days)
  learningPoints: number;            // >= 0
  learningEntries: LearningEntryDTO[];
  gitMetrics: GitMetricsDTO;
  documentation: DocumentationDTO[];
  dailyReports: DailyReportDTO[];
  createdDate: string;               // ISO 8601 datetime
  goals: GoalDTO[];
}
```

### GitMetricsDTO

```typescript
interface GitMetricsDTO {
  commitsByDay: number[];            // Array of 7 (Mon-Sun)
  pullRequests: number;              // >= 0
  mergedPRs: number;                 // >= 0
  codeReviews: number;               // >= 0
  commitMessages?: string[];         // Recent commit messages
  languages: Record<string, number>; // e.g., { JavaScript: 45, TypeScript: 30 } (percentages)
  commitTrend: number[];             // Array of 15 (recent daily commit counts)
}
```

### LearningEntryDTO

```typescript
interface LearningEntryDTO {
  id: number;
  concept: string;
  category: string;       // Backend | Frontend | DevOps | Architecture | Business
  difficulty: number;      // 1-5
  type: string;            // New concept | Mistake learned | Deepened knowledge | Optimization
  confidence: string;      // Low | Medium | High
  dateLogged: string;      // YYYY-MM-DD
  timeSpent: number;       // Hours
  resources?: string[];    // Optional resource names
}
```

### DailyReportDTO

```typescript
interface DailyReportDTO {
  id: number;
  date: string;            // YYYY-MM-DD
  hoursWorked: number;     // 0-24
  tasksDone: number;       // >= 0
  notes: string;
  mood: string;            // productive | focused | tired | distracted | stressed
  focusScore: number;      // 1-10
}
```

### DocumentationDTO

```typescript
interface DocumentationDTO {
  id: number;
  date: string;            // YYYY-MM-DD
  title: string;
  content: string;
  status: string;          // draft | in-progress | complete
  sections: number;        // >= 1
  wordCount: number;       // >= 0
}
```

### GoalDTO

```typescript
interface GoalDTO {
  id: number;
  title: string;
  target: number;          // > 0
  current: number;         // >= 0
  category: string;        // Learning | Quality | Delivery | Performance | DevOps
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error description",
  "statusCode": 400,
  "details": {
    "name": ["Name is required", "Name must be at least 1 character"]
  }
}
```

### HTTP Status Codes

| Code | Meaning | When |
|---|---|---|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Invalid payload / validation error |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource |
| `422` | Unprocessable Entity | Semantically invalid data |
| `500` | Internal Server Error | Server failure |

---

## API Endpoint Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/projects` | List all projects |
| `GET` | `/api/projects/:id` | Get project by ID |
| `POST` | `/api/projects` | Create project |
| `PUT` | `/api/projects/:id` | Full update project |
| `PATCH` | `/api/projects/:id` | Partial update project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `GET` | `/api/projects/:projectId/learning` | List learning entries |
| `GET` | `/api/projects/:projectId/learning/:id` | Get learning entry |
| `POST` | `/api/projects/:projectId/learning` | Create learning entry |
| `PUT` | `/api/projects/:projectId/learning/:id` | Update learning entry |
| `DELETE` | `/api/projects/:projectId/learning/:id` | Delete learning entry |
| `GET` | `/api/projects/:projectId/reports` | List daily reports |
| `GET` | `/api/projects/:projectId/reports/:id` | Get daily report |
| `POST` | `/api/projects/:projectId/reports` | Create daily report |
| `PUT` | `/api/projects/:projectId/reports/:id` | Update daily report |
| `DELETE` | `/api/projects/:projectId/reports/:id` | Delete daily report |
| `GET` | `/api/projects/:projectId/docs` | List documentation |
| `GET` | `/api/projects/:projectId/docs/:id` | Get document |
| `POST` | `/api/projects/:projectId/docs` | Create document |
| `PUT` | `/api/projects/:projectId/docs/:id` | Update document |
| `DELETE` | `/api/projects/:projectId/docs/:id` | Delete document |
| `GET` | `/api/projects/:projectId/goals` | List goals |
| `GET` | `/api/projects/:projectId/goals/:id` | Get goal |
| `POST` | `/api/projects/:projectId/goals` | Create goal |
| `PUT` | `/api/projects/:projectId/goals/:id` | Update goal |
| `DELETE` | `/api/projects/:projectId/goals/:id` | Delete goal |
| `GET` | `/api/analytics/overview` | Get analytics overview |

**Total: 28 endpoints**

---

## Frontend API Architecture

The frontend API layer is organized as follows:

```
src/api/
├── types.ts      # All TypeScript interfaces (DTOs, payloads, responses)
├── client.ts     # HTTP client (fetch wrapper with timeout, error handling)
├── services.ts   # CRUD service functions mapped to endpoints
└── index.ts      # Barrel export
```

### Key Features:
- **Offline fallback**: All mutations work locally when API is unreachable
- **Sync status**: Visual indicator (synced / syncing / offline / error)
- **Toast notifications**: Success/error feedback for every operation
- **Configurable base URL**: Change via UI or environment variable
- **Type safety**: Full TypeScript coverage on all API boundaries
