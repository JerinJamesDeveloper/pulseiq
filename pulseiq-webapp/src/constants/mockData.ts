import { type Project } from "../types";

export const DEFAULT_PROJECTS: Project[] = [
    {
        id: 1, name: "NeuralCart", category: "E-Commerce", color: "#00FFB2",
        totalTasks: 84, completedTasks: 61, features: 22, bugsFixed: 18, refactors: 9,
        totalHours: 312, activeDays: 47, lastActive: new Date(Date.now() - 1 * 86400000),
        commits: 198, techStack: ["Next.js", "PostgreSQL", "Redis"],
        weeklyHours: [4, 6, 3, 7, 5, 2, 4],
        monthlyHours: [24, 38, 42, 31, 28, 35, 41, 29, 33, 27, 38, 44, 30, 45, 32],
        learningPoints: 840,
        learningEntries: [
            { id: 1, concept: "Redis Pub/Sub", category: "Backend", difficulty: 4, type: "New concept", confidence: "Medium", dateLogged: "2025-01-20", timeSpent: 2.5, resources: ["Redis docs", "YouTube tutorial"] },
            { id: 2, concept: "ISR Caching Strategy", category: "Frontend", difficulty: 3, type: "Deepened knowledge", confidence: "High", dateLogged: "2025-01-19", timeSpent: 1.5, resources: ["Next.js guide"] },
            { id: 3, concept: "Race condition in checkout", category: "Backend", difficulty: 5, type: "Mistake learned", confidence: "High", dateLogged: "2025-01-18", timeSpent: 3 },
            { id: 4, concept: "Stripe webhook idempotency", category: "Backend", difficulty: 4, type: "New concept", confidence: "Medium", dateLogged: "2025-01-17", timeSpent: 2 },
        ],
        gitMetrics: {
            commitsByDay: [5, 3, 7, 4, 2, 6, 1], pullRequests: 12, mergedPRs: 10, codeReviews: 15,
            commitMessages: ["feat: add redis cache", "fix: race condition", "refactor: cleanup"],
            languages: { JavaScript: 45, TypeScript: 30, SQL: 15, CSS: 10 },
            commitTrend: [2, 4, 6, 5, 7, 6, 8, 4, 5, 7, 6, 5, 8, 9, 7],
        },
        documentation: [
            { id: 1, date: "2025-01-20", title: "Redis Pub/Sub Implementation", content: "Implemented message queue system using Redis pub/sub for real-time updates across the checkout pipeline.", status: "complete", sections: 5, wordCount: 1250 },
        ],
        dailyReports: [
            { id: 1, date: "2025-01-20", hoursWorked: 4, tasksDone: 3, notes: "Fixed checkout race condition, improved cache strategy", mood: "productive", focusScore: 8 },
            { id: 2, date: "2025-01-19", hoursWorked: 6, tasksDone: 2, notes: "Integrated Stripe webhooks", mood: "focused", focusScore: 9 },
        ],
        createdDate: new Date(Date.now() - 90 * 86400000),
        goals: [
            { id: 1, title: "Master Redis patterns", target: 100, current: 75, category: "Learning" },
            { id: 2, title: "Reduce bug count", target: 5, current: 8, category: "Quality" },
        ],
        issues: [],
        tasks: [],
    },
    {
        id: 2, name: "DevPulse", category: "SaaS Tool", color: "#FF6B35",
        totalTasks: 56, completedTasks: 29, features: 14, bugsFixed: 11, refactors: 4,
        totalHours: 187, activeDays: 28, lastActive: new Date(Date.now() - 5 * 86400000),
        commits: 94, techStack: ["React", "FastAPI", "MongoDB"],
        weeklyHours: [2, 1, 3, 0, 4, 3, 2],
        monthlyHours: [10, 14, 18, 12, 9, 16, 20, 13, 11, 15, 18, 14, 10, 22, 15],
        learningPoints: 520,
        learningEntries: [
            { id: 5, concept: "FastAPI dependency injection", category: "Backend", difficulty: 3, type: "New concept", confidence: "High", dateLogged: "2025-01-15", timeSpent: 1.5 },
            { id: 6, concept: "MongoDB aggregation pipelines", category: "Backend", difficulty: 4, type: "Deepened knowledge", confidence: "Medium", dateLogged: "2025-01-14", timeSpent: 2.5 },
        ],
        gitMetrics: {
            commitsByDay: [2, 1, 3, 0, 4, 3, 2], pullRequests: 8, mergedPRs: 7, codeReviews: 9,
            commitMessages: ["feat: dashboard layout", "fix: auth flow", "chore: deps update"],
            languages: { Python: 50, JavaScript: 40, SQL: 10 },
            commitTrend: [1, 2, 3, 2, 3, 2, 1, 2, 1, 2, 3, 2, 1, 2, 1],
        },
        documentation: [],
        dailyReports: [
            { id: 3, date: "2025-01-15", hoursWorked: 3, tasksDone: 2, notes: "Worked on aggregation pipeline", mood: "focused", focusScore: 7 },
        ],
        createdDate: new Date(Date.now() - 60 * 86400000),
        goals: [{ id: 3, title: "Complete MVP", target: 56, current: 29, category: "Delivery" }],
        issues: [],
        tasks: [],
    },
    {
        id: 3, name: "CloudForge", category: "DevOps", color: "#A78BFA",
        totalTasks: 42, completedTasks: 38, features: 10, bugsFixed: 8, refactors: 12,
        totalHours: 245, activeDays: 35, lastActive: new Date(Date.now() - 2 * 86400000),
        commits: 156, techStack: ["Terraform", "Docker", "Go"],
        weeklyHours: [5, 4, 6, 3, 5, 1, 2],
        monthlyHours: [20, 28, 32, 25, 22, 30, 35, 20, 28, 25, 30, 28, 22, 35, 30],
        learningPoints: 680,
        learningEntries: [
            { id: 7, concept: "Terraform state management", category: "DevOps", difficulty: 4, type: "Deepened knowledge", confidence: "High", dateLogged: "2025-01-18", timeSpent: 3, resources: ["Terraform docs", "HashiCorp Learn"] },
            { id: 8, concept: "Docker multi-stage builds", category: "DevOps", difficulty: 3, type: "Optimization", confidence: "High", dateLogged: "2025-01-16", timeSpent: 1.5 },
            { id: 9, concept: "Go concurrency patterns", category: "Backend", difficulty: 5, type: "New concept", confidence: "Medium", dateLogged: "2025-01-14", timeSpent: 4, resources: ["Go by Example", "Concurrency in Go book"] },
        ],
        gitMetrics: {
            commitsByDay: [4, 3, 5, 2, 4, 1, 1], pullRequests: 15, mergedPRs: 14, codeReviews: 20,
            commitMessages: ["feat: terraform modules", "fix: docker networking", "refactor: pipeline stages"],
            languages: { Go: 40, HCL: 35, YAML: 15, Shell: 10 },
            commitTrend: [3, 4, 5, 4, 6, 5, 7, 3, 4, 6, 5, 4, 7, 8, 6],
        },
        documentation: [
            { id: 2, date: "2025-01-18", title: "Infrastructure as Code Guidelines", content: "Established IaC best practices for the team.", status: "complete", sections: 8, wordCount: 2100 },
            { id: 3, date: "2025-01-15", title: "Docker Optimization Guide", content: "Multi-stage build patterns for reducing image sizes.", status: "in-progress", sections: 4, wordCount: 850 },
        ],
        dailyReports: [
            { id: 4, date: "2025-01-18", hoursWorked: 5, tasksDone: 4, notes: "Completed terraform module refactoring", mood: "productive", focusScore: 9 },
            { id: 5, date: "2025-01-17", hoursWorked: 6, tasksDone: 3, notes: "Docker optimization, reduced build times", mood: "focused", focusScore: 8 },
        ],
        createdDate: new Date(Date.now() - 75 * 86400000),
        goals: [
            { id: 4, title: "100% IaC coverage", target: 100, current: 90, category: "DevOps" },
            { id: 5, title: "Sub-5min deployments", target: 5, current: 7, category: "Performance" },
        ],
        issues: [],
        tasks: [],
    },
];
