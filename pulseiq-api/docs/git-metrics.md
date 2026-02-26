# Git Metrics In Project API

This document explains how to send and fetch Git-related metrics in the existing project endpoints.

## Endpoints

1. `GET /api/projects`
2. `GET /api/projects/:id`
3. `POST /api/projects`
4. `PUT /api/projects/:id`
5. `PATCH /api/projects/:id`
6. `GET /api/projects/:id/git-metrics`

## GitHub Integration

Git metrics can be refreshed live from GitHub for a specific project.

Requirements:

1. `projects.git_repo` must be set (GitHub URL or `owner/repo`).
2. Optional but recommended: `GITHUB_TOKEN` in `.env` for higher rate limits.

If your DB was created before this feature, add the column:

```sql
ALTER TABLE projects ADD COLUMN git_repo VARCHAR(255) NULL;
```

If your local machine uses HTTPS inspection (for example antivirus/corporate SSL proxy), Node may fail with TLS errors.
For local debugging only, you can set:

```env
DEV_INSECURE_TLS=true
```

Do not use this in production.

Example:

```env
GITHUB_TOKEN=ghp_xxxxx
```

## What Is Returned

Each project response includes:

```json
"gitMetrics": {
  "pullRequests": 0,
  "mergedPRs": 0,
  "codeReviews": 0,
  "commitMessages": [],
  "languages": {},
  "commitsByDay": [0, 0, 0, 0, 0, 0, 0],
  "commitTrend": []
}
```

## Write Git Metrics (Create/Update)

Send `gitMetrics` inside project payload.

### Example: Create Project With Git Data

```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pulse API",
    "category": "API Service",
    "color": "#1F7AE0",
    "git_repo": "https://github.com/octocat/Hello-World",
    "techStack": ["Node.js", "MySQL"],
    "gitMetrics": {
      "pullRequests": 14,
      "mergedPRs": 11,
      "codeReviews": 9,
      "commitMessages": [
        "Add auth middleware",
        "Fix report pagination",
        "Refactor project model"
      ],
      "languages": {
        "JavaScript": 85,
        "SQL": 15
      },
      "commitsByDay": [3, 2, 4, 1, 5, 0, 0],
      "commitTrend": [1, 2, 3, 1, 4, 5, 2]
    }
  }'
```

### Example: Patch Only Git Data

```bash
curl -X PATCH http://localhost:3001/api/projects/1 \
  -H "Content-Type: application/json" \
  -d '{
    "gitMetrics": {
      "pullRequests": 20,
      "mergedPRs": 16,
      "codeReviews": 12,
      "commitMessages": ["Improve sync retries", "Add AI endpoint docs"],
      "languages": {"JavaScript": 70, "SQL": 20, "Shell": 10},
      "commitsByDay": [1, 2, 2, 3, 4, 0, 1],
      "commitTrend": [
        {"date": "2026-02-20", "commitCount": 2},
        {"date": "2026-02-21", "commitCount": 1},
        {"date": "2026-02-22", "commitCount": 3}
      ]
    }
  }'
```

## Behavior Notes

1. `gitMetrics` is optional.
2. If omitted on create, Git metrics are initialized with empty/default values.
3. On update/patch with `gitMetrics`, Git snapshot tables are replaced with the provided values:
   - `git_metrics` upserted
   - `commit_messages` replaced
   - `commits_by_day` replaced
   - `commit_trend` replaced
4. Numeric values are normalized to non-negative numbers.
5. `commitMessages` accepts up to 50 non-empty strings.
6. `commitTrend` accepts up to 15 points:
   - either numbers (auto-dated),
   - or objects like `{ "date": "YYYY-MM-DD", "commitCount": 3 }`.

## Read Back Data

After create/update:

```bash
curl http://localhost:3001/api/projects/1
```

The response `data.gitMetrics` will contain the persisted Git snapshot.

## Refresh Metrics From GitHub

### Dedicated endpoint

```bash
curl http://localhost:3001/api/projects/1/git-metrics
```

Options:

1. `refresh=true` (default): fetch from GitHub and persist.
2. `refresh=false`: return DB snapshot only.

```bash
curl "http://localhost:3001/api/projects/1/git-metrics?refresh=false"
```

### Via normal project get

You can also refresh during project fetch:

```bash
curl "http://localhost:3001/api/projects/1?refreshGit=true"
```
