import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  projectsApi,
  learningApi,
  reportsApi,
  docsApi,
  goalsApi,
  checkApiHealth,
  configureApi,
  NetworkError,
  type ProjectDTO,
  type LearningEntryDTO,
  type DailyReportDTO,
  type DocumentationDTO,
  type GoalDTO,
  type CreateProjectPayload,
  type CreateLearningEntryPayload,
  type CreateDailyReportPayload,
  type CreateDocumentPayload,
  type CreateGoalPayload,
  type UpdateProjectPayload,
} from "./api";

// ─── LOCAL TYPES ──────────────────────────────────────────────────────────────

interface Project {
  id: number;
  name: string;
  category: string;
  color: string;
  totalTasks: number;
  completedTasks: number;
  features: number;
  bugsFixed: number;
  refactors: number;
  totalHours: number;
  activeDays: number;
  lastActive: Date;
  commits: number;
  techStack: string[];
  weeklyHours: number[];
  monthlyHours: number[];
  learningPoints: number;
  learningEntries: LearningEntryDTO[];
  gitMetrics: {
    commitsByDay: number[];
    pullRequests: number;
    mergedPRs: number;
    codeReviews: number;
    commitMessages?: string[];
    languages: Record<string, number>;
    commitTrend: number[];
  };
  documentation: DocumentationDTO[];
  dailyReports: DailyReportDTO[];
  createdDate: Date;
  goals: GoalDTO[];
  repoUrl?: string;
}

type SyncStatus = "synced" | "syncing" | "offline" | "error";

// ─── DTO CONVERSION ───────────────────────────────────────────────────────────

function dtoToProject(dto: ProjectDTO): Project {
  if (!dto) {
    // Return a dummy object if dto is null/undefined to prevent downstream crashes
    return {
      id: 0, name: "Unknown", category: "", color: "#555",
      totalTasks: 0, completedTasks: 0, features: 0, bugsFixed: 0, refactors: 0,
      totalHours: 0, activeDays: 0, lastActive: new Date(), commits: 0,
      techStack: [], weeklyHours: [0, 0, 0, 0, 0, 0, 0], monthlyHours: [],
      learningPoints: 0, learningEntries: [],
      gitMetrics: { commitsByDay: [0, 0, 0, 0, 0, 0, 0], pullRequests: 0, mergedPRs: 0, codeReviews: 0, commitMessages: [], languages: {}, commitTrend: [] },
      documentation: [], dailyReports: [], createdDate: new Date(), goals: [],
      repoUrl: "",
    };
  }

  return {
    ...dto,
    lastActive: dto.lastActive ? new Date(dto.lastActive) : new Date(),
    createdDate: dto.createdDate ? new Date(dto.createdDate) : new Date(),
    techStack: Array.isArray(dto.techStack) ? dto.techStack : [],
    weeklyHours: Array.isArray(dto.weeklyHours) ? dto.weeklyHours : [0, 0, 0, 0, 0, 0, 0],
    monthlyHours: Array.isArray(dto.monthlyHours) ? dto.monthlyHours : [],
    learningEntries: Array.isArray(dto.learningEntries) ? dto.learningEntries : [],
    documentation: Array.isArray(dto.documentation) ? dto.documentation : [],
    dailyReports: Array.isArray(dto.dailyReports) ? dto.dailyReports : [],
    goals: Array.isArray(dto.goals) ? dto.goals : [],
    gitMetrics: {
      commitsByDay: Array.isArray(dto.gitMetrics?.commitsByDay) ? dto.gitMetrics.commitsByDay : [0, 0, 0, 0, 0, 0, 0],
      pullRequests: dto.gitMetrics?.pullRequests || 0,
      mergedPRs: dto.gitMetrics?.mergedPRs || 0,
      codeReviews: dto.gitMetrics?.codeReviews || 0,
      commitMessages: Array.isArray(dto.gitMetrics?.commitMessages) ? dto.gitMetrics.commitMessages : [],
      languages: dto.gitMetrics?.languages || {},
      commitTrend: Array.isArray(dto.gitMetrics?.commitTrend) ? dto.gitMetrics.commitTrend : [],
    },
    repoUrl: dto.repoUrl || "",
  };
}

function projectToDto(p: Project): ProjectDTO {
  return {
    ...p,
    lastActive: p.lastActive.toISOString(),
    createdDate: p.createdDate.toISOString(),
    repoUrl: p.repoUrl || undefined,
  };
}

// ─── MOCK / FALLBACK DATA ─────────────────────────────────────────────────────
const DEFAULT_PROJECTS: Project[] = [
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
  },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = ["E-Commerce", "SaaS Tool", "DevOps", "Mobile App", "API Service", "Data Pipeline", "ML/AI", "Open Source"];
const COLORS = ["#00FFB2", "#FF6B35", "#A78BFA", "#38BDF8", "#FFD700", "#FF4444", "#00D9FF", "#FF00FF"];
const WEEKLY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SKILL_CATS = ["Backend", "Frontend", "DevOps", "Architecture", "Business"];
const LEARNING_TYPES = ["New concept", "Mistake learned", "Deepened knowledge", "Optimization"];
const MOODS = ["productive", "focused", "tired", "distracted", "stressed"];
const DOC_STATUSES = ["draft", "in-progress", "complete"];

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function calcHealth(project: Project): "green" | "yellow" | "red" {
  const daysSince = (Date.now() - project.lastActive.getTime()) / 86400000;
  if (daysSince >= 7) return "red";
  if (daysSince >= 3) return "yellow";
  return "green";
}
function calcCompletion(p: Project): number {
  return p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
}
// Fix calcProductivityScore:
function calcProductivityScore(p: Project): number {
  if (!p) return 0;
  const comp = calcCompletion(p);
  const commits = p.commits || 0;
  const totalHours = p.totalHours || 0;
  const bugsFixed = p.bugsFixed || 0;
  const refactors = p.refactors || 0;

  return Math.round(
    comp * 0.25 +
    Math.min(commits / 200, 1) * 25 +
    Math.min(totalHours / 400, 1) * 25 +
    Math.min(bugsFixed / 20, 1) * 15 +
    Math.min(refactors / 15, 1) * 10
  );
}
// Also fix the calcLearningIntensity function:
function calcLearningIntensity(p: Project): number {
  // Safely handle potential undefined values
  const totalHours = p.totalHours || 0;
  const learningPoints = p.learningPoints || 0;
  const pph = totalHours > 0 ? learningPoints / totalHours : 0;

  const categories = p.learningEntries ? new Set(p.learningEntries.map(e => e.category)) : new Set();
  const div = categories.size;

  const avg = p.learningEntries && p.learningEntries.length > 0
    ? p.learningEntries.reduce((a, e) => a + (e.difficulty || 0), 0) / p.learningEntries.length
    : 0;

  return Math.min(100, Math.round(pph * 20 + div * 8 + avg * 5));
}
// Fix calcMomentum:
function calcMomentum(p: Project): number {
  if (!p) return 0;
  const weeklyHours = p.weeklyHours || [0, 0, 0, 0, 0, 0, 0];
  const recent = weeklyHours.reduce((a, b) => a + (b || 0), 0);
  const lastActive = p.lastActive ? new Date(p.lastActive) : new Date();
  const recency = Math.max(0, 1 - (Date.now() - lastActive.getTime()) / 86400000 / 14);
  const commits = p.commits || 0;
  return Math.min(100, Math.round((recent / 35) * 60 * recency + (commits / 200) * 40));
}
function getSkillDistribution(projects: Project[]): Record<string, number> {
  const d: Record<string, number> = {};
  SKILL_CATS.forEach(c => d[c] = 0);

  if (Array.isArray(projects)) {
    projects.forEach(p => {
      if (p && Array.isArray(p.learningEntries)) {
        p.learningEntries.forEach(e => {
          if (e && e.category && d[e.category] !== undefined) {
            d[e.category] += (e.difficulty || 0) * 10;
          }
        });
      }
    });
  }

  return d;
}
function getBurnoutRisk(p: Project): string {
  if (!p || !p.weeklyHours) return "Low";
  const h = p.weeklyHours.reduce((a, b) => a + (b || 0), 0);
  return h > 50 ? "High" : h > 35 ? "Medium" : "Low";
}
// Fix calcGitMetrics:
function calcGitMetrics(p: Project) {
  if (!p) return { commitsPerDay: 0, avgCommits: "0.0", prMergeRate: "0" };
  const commitsByDay = Array.isArray(p.gitMetrics?.commitsByDay) ? p.gitMetrics.commitsByDay : [0, 0, 0, 0, 0, 0, 0];
  const cpd = commitsByDay.reduce((a, b) => a + (b || 0), 0);
  const pullRequests = p.gitMetrics?.pullRequests || 0;
  const mergedPRs = p.gitMetrics?.mergedPRs || 0;

  return {
    commitsPerDay: cpd,
    avgCommits: (cpd / 7).toFixed(1),
    prMergeRate: pullRequests > 0 ? ((mergedPRs / pullRequests) * 100).toFixed(0) : "0"
  };
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────

function HealthDot({ health }: { health: string }) {
  const c: Record<string, string> = { green: "#00FFB2", yellow: "#FFD700", red: "#FF4444" };
  return <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: c[health], boxShadow: `0 0 8px ${c[health]}`, flexShrink: 0 }} />;
}

// Fix MiniBar:
function MiniBar({ value, max, color, height = 24 }: { value: number; max: number; color: string; height?: number }) {
  const safeValue = value || 0;
  const safeMax = max || 1;
  const pct = safeMax > 0 ? Math.min(100, (safeValue / safeMax) * 100) : 0;
  return (
    <div style={{ background: "#1a1a2e", borderRadius: 4, overflow: "hidden", height, flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 1s ease", borderRadius: 4 }} />
    </div>
  );
}

// Fix CircleProgress to handle invalid values:
function CircleProgress({ value, size = 80, stroke = 7, color = "#00FFB2", label }: { value: number; size?: number; stroke?: number; color?: string; label?: string }) {
  const safeValue = Math.min(100, Math.max(0, value || 0));
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (safeValue / 100) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a2e" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size > 70 ? 16 : 12, fontWeight: 700, color: "#fff", fontFamily: "'Courier New', monospace" }}>{safeValue}%</span>
        {label && <span style={{ fontSize: 9, color: "#666", marginTop: 1 }}>{label}</span>}
      </div>
    </div>
  );
}

// Fix WeeklyChart to handle empty data:
function WeeklyChart({ data, color }: { data: number[]; color: string }) {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safeData.map(v => v || 0), 1);
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 60 }}>
      {safeData.map((val, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-end" }}>
            <div style={{
              width: "100%",
              height: `${((val || 0) / max) * 100}%`,
              minHeight: (val || 0) > 0 ? 3 : 0,
              background: color,
              borderRadius: "3px 3px 0 0",
              opacity: 0.85,
              transition: "height 0.8s ease"
            }} />
          </div>
          <span style={{ fontSize: 8, color: "#555", fontFamily: "monospace" }}>{WEEKLY_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, accent = "#00FFB2" }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "monospace" }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 800, color: accent, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "#444" }}>{sub}</span>}
    </div>
  );
}

function SkillRadar({ projects }: { projects: Project[] }) {
  const dist = getSkillDistribution(projects);
  const maxVal = Math.max(...Object.values(dist), 1);
  const cx = 90, cy = 90, r = 70, cats = Object.keys(dist), n = cats.length;
  const pts = cats.map((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; const v = dist[cats[i]] / maxVal; return { x: cx + r * v * Math.cos(a), y: cy + r * v * Math.sin(a) }; });
  const lbl = cats.map((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return { x: cx + (r + 18) * Math.cos(a), y: cy + (r + 18) * Math.sin(a), label: cats[i] }; });
  const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map(s => cats.map((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return `${cx + r * s * Math.cos(a)},${cy + r * s * Math.sin(a)}`; }).join(" "));
  return (
    <svg width={180} height={180} style={{ display: "block", margin: "0 auto" }}>
      {grid.map((g, gi) => <polygon key={gi} points={g} fill="none" stroke="#1e1e3a" strokeWidth={1} />)}
      {cats.map((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#1e1e3a" strokeWidth={1} />; })}
      <polygon points={poly} fill="#00FFB222" stroke="#00FFB2" strokeWidth={1.5} />
      {lbl.map((p, i) => <text key={i} x={p.x} y={p.y} fill="#666" fontSize={8} textAnchor="middle" dominantBaseline="middle">{p.label}</text>)}
    </svg>
  );
}

// ─── SYNC STATUS BADGE ────────────────────────────────────────────────────────

function SyncBadge({ status, onRetry }: { status: SyncStatus; onRetry: () => void }) {
  const config: Record<SyncStatus, { color: string; bg: string; label: string; icon: string }> = {
    synced: { color: "#00FFB2", bg: "#00FFB215", label: "API Connected", icon: "●" },
    syncing: { color: "#38BDF8", bg: "#38BDF815", label: "Syncing...", icon: "◌" },
    offline: { color: "#FFD700", bg: "#FFD70015", label: "Offline Mode", icon: "○" },
    error: { color: "#FF4444", bg: "#FF444415", label: "Sync Error", icon: "✕" },
  };
  const c = config[status];
  return (
    <div
      onClick={status === "offline" || status === "error" ? onRetry : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
        background: c.bg, border: `1px solid ${c.color}44`, borderRadius: 6,
        cursor: status === "offline" || status === "error" ? "pointer" : "default",
        fontSize: 10, fontFamily: "monospace", color: c.color, transition: "all 0.2s"
      }}
      title={status === "offline" ? "Click to retry connection" : status === "error" ? "Click to retry" : ""}
    >
      <span style={{ fontSize: 8, animation: status === "syncing" ? "spin 1s linear infinite" : "none" }}>{c.icon}</span>
      {c.label}
    </div>
  );
}

// ─── TOAST NOTIFICATION ───────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: "success" | "error" | "info" }

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  const colors = { success: "#00FFB2", error: "#FF4444", info: "#38BDF8" };
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => onDismiss(t.id)} style={{
          background: "#0d0d1a", border: `1px solid ${colors[t.type]}66`, borderRadius: 10,
          padding: "10px 16px", color: colors[t.type], fontSize: 12, fontFamily: "monospace",
          cursor: "pointer", boxShadow: `0 4px 20px ${colors[t.type]}22`, minWidth: 250,
          animation: "slideIn 0.3s ease"
        }}>
          {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"} {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── LOADING SPINNER ──────────────────────────────────────────────────────────

function Spinner({ size = 32, color = "#00FFB2" }: { size?: number; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div style={{
        width: size, height: size, border: `3px solid #1a1a2e`,
        borderTop: `3px solid ${color}`, borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
    </div>
  );
}

// ─── PROJECT CARD ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick, onDelete }: { project: Project; onClick: (p: Project) => void; onDelete: (id: number) => void }) {
  const health = calcHealth(project);
  const completion = calcCompletion(project);
  const productivity = calcProductivityScore(project);
  const learning = calcLearningIntensity(project);
  const momentum = calcMomentum(project);
  const burnout = getBurnoutRisk(project);
  const burnoutColors: Record<string, string> = { Low: "#00FFB2", Medium: "#FFD700", High: "#FF4444" };
  const daysSince = Math.floor((Date.now() - project.lastActive.getTime()) / 86400000);

  return (
    <div style={{ background: "#080810", border: "1px solid #111122", borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.2s ease", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${project.color}15 0%, transparent 70%)`, borderRadius: "0 16px 0 80px" }} />

      <div onClick={() => onClick(project)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <HealthDot health={health} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0" }}>{project.name}</span>
            </div>
            <span style={{ fontSize: 10, color: "#444", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>
              {project.category} · {daysSince === 0 ? "Today" : `${daysSince}d ago`}
            </span>
          </div>
          <CircleProgress value={completion} size={56} stroke={5} color={project.color} label="done" />
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { icon: "⚡", label: "Productivity", val: productivity },
            { icon: "🧠", label: "Learning", val: learning },
            { icon: "🚀", label: "Momentum", val: momentum }
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ flex: 1, minWidth: 70 }}>
              <div style={{ fontSize: 9, color: "#444", marginBottom: 3, fontFamily: "monospace" }}>{icon} {label}</div>
              <MiniBar value={val} max={100} color={project.color} height={5} />
              <div style={{ fontSize: 10, color: "#666", marginTop: 2, fontFamily: "monospace" }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Hours", value: project.totalHours },
            { label: "Commits", value: project.commits },
            { label: "Bugs", value: project.bugsFixed },
            { label: "Features", value: project.features },
            { label: "PRs", value: project.gitMetrics.pullRequests }
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#ccc", fontFamily: "monospace" }}>{value}</div>
              <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        <WeeklyChart data={project.weeklyHours} color={project.color} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {project.techStack.map(t => (
            <span key={t} style={{ fontSize: 9, padding: "2px 6px", background: "#111122", borderRadius: 4, color: "#555", fontFamily: "monospace", border: "1px solid #1a1a2e" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: burnoutColors[burnout], fontFamily: "monospace" }}>🔥 {burnout}</span>
          <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${project.name}"?`)) onDelete(project.id); }}
            style={{ background: "transparent", border: "1px solid #FF444444", color: "#FF4444", padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontSize: 9, fontFamily: "monospace" }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, background: "#000000cc", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>{children}</div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", background: "#080810", border: "1px solid #1a1a2e", borderRadius: 8, color: "#ccc", padding: "8px 12px", fontSize: 13, boxSizing: "border-box", fontFamily: "monospace", outline: "none" };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
const labelStyle: React.CSSProperties = { fontSize: 10, color: "#555", display: "block", marginBottom: 4, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 };

function AddProjectModal({ onClose, onSave, saving }: { onClose: () => void; onSave: (p: CreateProjectPayload & { techStack: string[] }) => void; saving: boolean }) {
  const [form, setForm] = useState({ name: "", category: CATEGORIES[0], color: COLORS[0], techStack: "", totalTasks: 0, repoUrl: "" });
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 16, padding: 28, width: 520, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 20px", color: "#e0e0e0", fontFamily: "monospace", fontSize: 16 }}>🚀 New Project</h3>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Project Name *</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., NeuralCart" style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={selectStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Color Theme</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm({ ...form, color: c })} style={{
                  width: 28, height: 28, borderRadius: 6, background: c, cursor: "pointer",
                  border: form.color === c ? "2px solid #fff" : "2px solid transparent"
                }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Tech Stack (comma-separated)</label>
          <input value={form.techStack} onChange={e => setForm({ ...form, techStack: e.target.value })} placeholder="e.g., React, Node.js" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Git Repository URL</label>
          <input value={form.repoUrl} onChange={e => setForm({ ...form, repoUrl: e.target.value })} placeholder="e.g., https://github.com/user/repo" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Estimated Total Tasks</label>
          <input type="number" min={0} value={form.totalTasks} onChange={e => setForm({ ...form, totalTasks: +e.target.value })} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#111122", border: "1px solid #1a1a2e", color: "#666", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "monospace" }}>Cancel</button>
          <button disabled={saving || !form.name.trim()} onClick={() => {
            if (form.name.trim()) onSave({
              name: form.name.trim(),
              category: form.category,
              color: form.color,
              techStack: form.techStack.split(",").map((s: string) => s.trim()).filter(s => s),
              totalTasks: form.totalTasks,
              repoUrl: form.repoUrl
            });
          }} style={{ background: saving ? "#555" : form.color, border: "none", color: "#000", padding: "8px 18px", borderRadius: 8, cursor: saving ? "wait" : "pointer", fontWeight: 700, fontFamily: "monospace", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AddLearningModal({ project, onClose, onSave, saving }: { project: Project; onClose: () => void; onSave: (entry: CreateLearningEntryPayload) => void; saving: boolean }) {
  const [form, setForm] = useState({ concept: "", category: "Backend", difficulty: 3, type: "New concept", confidence: "Medium", dateLogged: new Date().toISOString().split("T")[0], timeSpent: 1, resources: "" });
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 16, padding: 28, width: 520, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 20px", color: "#e0e0e0", fontFamily: "monospace", fontSize: 16 }}>🧠 Log Learning Entry</h3>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Concept / Topic *</label>
          <input value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} placeholder="e.g., Redis Pub/Sub" style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><label style={labelStyle}>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={selectStyle}>{SKILL_CATS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label style={labelStyle}>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={selectStyle}>{LEARNING_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><label style={labelStyle}>Difficulty (1-5)</label><input type="number" min={1} max={5} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: Math.min(5, Math.max(1, +e.target.value)) })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Confidence</label><select value={form.confidence} onChange={e => setForm({ ...form, confidence: e.target.value })} style={selectStyle}>{["Low", "Medium", "High"].map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label style={labelStyle}>Time Spent (hrs)</label><input type="number" step={0.5} min={0} value={form.timeSpent} onChange={e => setForm({ ...form, timeSpent: +e.target.value })} style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Date</label><input type="date" value={form.dateLogged} onChange={e => setForm({ ...form, dateLogged: e.target.value })} style={inputStyle} /></div>
        <div style={{ marginBottom: 20 }}><label style={labelStyle}>Resources (comma-separated)</label><input value={form.resources} onChange={e => setForm({ ...form, resources: e.target.value })} placeholder="Docs, YouTube" style={inputStyle} /></div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#111122", border: "1px solid #1a1a2e", color: "#666", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "monospace" }}>Cancel</button>
          <button disabled={saving || !form.concept.trim()} onClick={() => {
            if (form.concept.trim()) onSave({
              concept: form.concept.trim(),
              category: form.category,
              difficulty: form.difficulty,
              type: form.type,
              confidence: form.confidence,
              dateLogged: form.dateLogged,
              timeSpent: form.timeSpent,
              resources: form.resources.split(",").map(r => r.trim()).filter(r => r)
            });
          }} style={{ background: saving ? "#555" : project.color, border: "none", color: "#000", padding: "8px 18px", borderRadius: 8, cursor: saving ? "wait" : "pointer", fontWeight: 700, fontFamily: "monospace", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AddDailyReportModal({ project, onClose, onSave, saving }: { project: Project; onClose: () => void; onSave: (r: CreateDailyReportPayload) => void; saving: boolean }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], hoursWorked: 0, tasksDone: 0, notes: "", mood: "productive", focusScore: 7 });
  const moodEmoji: Record<string, string> = { productive: "💪", focused: "🎯", tired: "😴", distracted: "🌀", stressed: "😰" };
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 16, padding: 28, width: 520, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 20px", color: "#e0e0e0", fontFamily: "monospace", fontSize: 16 }}>📅 Daily Report</h3>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><label style={labelStyle}>Hours Worked</label><input type="number" step={0.5} min={0} max={24} value={form.hoursWorked} onChange={e => setForm({ ...form, hoursWorked: +e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Tasks Completed</label><input type="number" min={0} value={form.tasksDone} onChange={e => setForm({ ...form, tasksDone: +e.target.value })} style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Mood</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MOODS.map(m => (
              <button key={m} onClick={() => setForm({ ...form, mood: m })} style={{
                background: form.mood === m ? project.color + "33" : "#080810",
                border: `1px solid ${form.mood === m ? project.color : "#1a1a2e"}`,
                color: form.mood === m ? project.color : "#666", padding: "6px 12px", borderRadius: 8,
                cursor: "pointer", fontSize: 12, fontFamily: "monospace"
              }}>{moodEmoji[m]} {m}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Focus Score (1-10): {form.focusScore}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "#555" }}>1</span>
            <input type="range" min={1} max={10} value={form.focusScore} onChange={e => setForm({ ...form, focusScore: +e.target.value })} style={{ flex: 1, accentColor: project.color }} />
            <span style={{ fontSize: 10, color: "#555" }}>10</span>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="What did you accomplish?" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#111122", border: "1px solid #1a1a2e", color: "#666", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "monospace" }}>Cancel</button>
          <button disabled={saving} onClick={() => onSave(form)} style={{ background: saving ? "#555" : project.color, border: "none", color: "#000", padding: "8px 18px", borderRadius: 8, cursor: saving ? "wait" : "pointer", fontWeight: 700, fontFamily: "monospace", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Report"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AddDocumentModal({ project, onClose, onSave, saving }: { project: Project; onClose: () => void; onSave: (d: CreateDocumentPayload) => void; saving: boolean }) {
  const [form, setForm] = useState({ title: "", content: "", status: "draft", date: new Date().toISOString().split("T")[0] });
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 16, padding: 28, width: 600, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 20px", color: "#e0e0e0", fontFamily: "monospace", fontSize: 16 }}>📝 Add Documentation</h3>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., API Architecture Overview" style={inputStyle} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><label style={labelStyle}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={selectStyle}>{DOC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label style={labelStyle}>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 20 }}><label style={labelStyle}>Content *</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your documentation here..." rows={8} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} /></div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#111122", border: "1px solid #1a1a2e", color: "#666", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "monospace" }}>Cancel</button>
          <button disabled={saving || !form.title.trim() || !form.content.trim()} onClick={() => {
            if (form.title.trim() && form.content.trim()) onSave({ title: form.title.trim(), content: form.content.trim(), status: form.status, date: form.date });
          }} style={{ background: saving ? "#555" : project.color, border: "none", color: "#000", padding: "8px 18px", borderRadius: 8, cursor: saving ? "wait" : "pointer", fontWeight: 700, fontFamily: "monospace", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Document"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AddGoalModal({ project, onClose, onSave, saving }: { project: Project; onClose: () => void; onSave: (g: CreateGoalPayload) => void; saving: boolean }) {
  const [form, setForm] = useState({ title: "", target: 100, current: 0, category: "Learning" });
  const goalCategories = ["Learning", "Quality", "Delivery", "Performance", "DevOps"];
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 16, padding: 28, width: 440, maxWidth: "90vw" }}>
        <h3 style={{ margin: "0 0 20px", color: "#e0e0e0", fontFamily: "monospace", fontSize: 16 }}>🎯 Add Goal</h3>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Goal Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Master Redis patterns" style={inputStyle} /></div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={selectStyle}>{goalCategories.map(c => <option key={c}>{c}</option>)}</select></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div><label style={labelStyle}>Target</label><input type="number" min={1} value={form.target} onChange={e => setForm({ ...form, target: +e.target.value })} style={inputStyle} /></div>
          <div><label style={labelStyle}>Current</label><input type="number" min={0} value={form.current} onChange={e => setForm({ ...form, current: +e.target.value })} style={inputStyle} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#111122", border: "1px solid #1a1a2e", color: "#666", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "monospace" }}>Cancel</button>
          <button disabled={saving || !form.title.trim()} onClick={() => {
            if (form.title.trim()) onSave({ title: form.title.trim(), target: form.target, current: form.current, category: form.category });
          }} style={{ background: saving ? "#555" : project.color, border: "none", color: "#000", padding: "8px 18px", borderRadius: 8, cursor: saving ? "wait" : "pointer", fontWeight: 700, fontFamily: "monospace", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Add Goal"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── API CONFIG MODAL ─────────────────────────────────────────────────────────

function ApiConfigModal({ onClose, onSave, currentUrl }: { onClose: () => void; onSave: (url: string) => void; currentUrl: string }) {
  const [url, setUrl] = useState(currentUrl);
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 16, padding: 28, width: 520, maxWidth: "90vw" }}>
        <h3 style={{ margin: "0 0 6px", color: "#e0e0e0", fontFamily: "monospace", fontSize: 16 }}>⚙️ API Configuration</h3>
        <p style={{ margin: "0 0 20px", fontSize: 11, color: "#555", fontFamily: "monospace" }}>Set the base URL for your backend API. The app will fall back to local mock data when offline.</p>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>API Base URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="http://localhost:3001/api" style={inputStyle} />
        </div>
        <div style={{ background: "#080810", border: "1px solid #111122", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 10, color: "#666", fontFamily: "monospace", lineHeight: 1.8 }}>
          <div style={{ color: "#888", marginBottom: 4 }}>Expected endpoints:</div>
          <div>GET  /api/projects</div>
          <div>POST /api/projects</div>
          <div>PUT  /api/projects/:id</div>
          <div>DELETE /api/projects/:id</div>
          <div>POST /api/projects/:id/learning</div>
          <div>POST /api/projects/:id/reports</div>
          <div>POST /api/projects/:id/docs</div>
          <div>POST /api/projects/:id/goals</div>
          <div style={{ color: "#444", marginTop: 4 }}>...and more (see API docs)</div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#111122", border: "1px solid #1a1a2e", color: "#666", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "monospace" }}>Cancel</button>
          <button onClick={() => { onSave(url); onClose(); }} style={{ background: "#00FFB2", border: "none", color: "#000", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontFamily: "monospace" }}>Save & Reconnect</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── GIT METRICS VIEW ─────────────────────────────────────────────────────────

function GitMetricsView({ project }: { project: Project }) {
  if (!project || !project.gitMetrics) return <div style={{ color: "#444", padding: 20 }}>No Git data available.</div>;

  const gm = project.gitMetrics;
  const { commitsPerDay, avgCommits, prMergeRate } = calcGitMetrics(project);
  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 14, color: "#e0e0e0", fontFamily: "monospace", fontWeight: 600, marginBottom: 16 }}>📊 Git Metrics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Weekly Commits" value={commitsPerDay} sub={`avg: ${avgCommits}/day`} accent={project.color} />
        <StatCard label="Pull Requests" value={gm.pullRequests || 0} sub={`${gm.mergedPRs || 0} merged`} accent="#38BDF8" />
        <StatCard label="Merge Rate" value={`${prMergeRate || 0}%`} sub="quality" accent="#A78BFA" />
        <StatCard label="Code Reviews" value={gm.codeReviews || 0} sub="conducted" accent="#FFD700" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#080810", border: "1px solid #111122", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginBottom: 10 }}>COMMITS BY DAY</div>
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 60 }}>
            {(gm.commitsByDay || [0, 0, 0, 0, 0, 0, 0]).map((val, i) => {
              const max = Math.max(...(gm.commitsByDay || [0, 0, 0, 0, 0, 0, 0]), 1);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: "100%", height: 40, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", height: `${(val / max) * 40}px`, background: project.color, borderRadius: "2px 2px 0 0", opacity: 0.8 }} />
                  </div>
                  <span style={{ fontSize: 8, color: "#555" }}>{WEEKLY_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ background: "#080810", border: "1px solid #111122", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginBottom: 10 }}>LANGUAGES</div>
          {gm.languages && Object.entries(gm.languages).length > 0 ? Object.entries(gm.languages).map(([lang, pct]) => (
            <div key={lang} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "#ccc" }}>{lang}</span>
                <span style={{ fontSize: 10, color: "#666" }}>{pct}%</span>
              </div>
              <MiniBar value={pct} max={100} color={project.color} height={4} />
            </div>
          )) : <div style={{ color: "#555", fontSize: 12, textAlign: "center", padding: 20 }}>No data</div>}
        </div>
      </div>
      {gm.commitMessages && gm.commitMessages.length > 0 && (
        <div style={{ background: "#080810", border: "1px solid #111122", borderRadius: 10, padding: 14, marginTop: 12 }}>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginBottom: 10 }}>RECENT COMMITS</div>
          {gm.commitMessages.slice(0, 5).map((msg, i) => (
            <div key={i} style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace", padding: "6px 8px", background: "#0d0d1a", borderRadius: 4, borderLeft: `2px solid ${project.color}`, marginBottom: 4 }}>{msg || "No message"}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROJECT DETAIL ───────────────────────────────────────────────────────────

function ProjectDetail({ project, onClose, onSave, onDeleteLearning, onDeleteReport, onDeleteDoc, onDeleteGoal, onCreateLearning, onCreateReport, onCreateDoc, onCreateGoal, saving }: {
  project: Project;
  onClose: () => void;
  onSave: (updated: Project) => void;
  onDeleteLearning: (projectId: number, entryId: number) => void;
  onDeleteReport: (projectId: number, reportId: number) => void;
  onDeleteDoc: (projectId: number, docId: number) => void;
  onDeleteGoal: (projectId: number, goalId: number) => void;
  onCreateLearning: (projectId: number, payload: CreateLearningEntryPayload) => void;
  onCreateReport: (projectId: number, payload: CreateDailyReportPayload) => void;
  onCreateDoc: (projectId: number, payload: CreateDocumentPayload) => void;
  onCreateGoal: (projectId: number, payload: CreateGoalPayload) => void;
  saving: boolean;
}) {
  const health = calcHealth(project);
  const completion = calcCompletion(project);
  const productivity = calcProductivityScore(project);
  const learning = calcLearningIntensity(project);
  const momentum = calcMomentum(project);
  const healthLabels: Record<string, string> = { green: "Healthy & Active", yellow: "Needs Attention", red: "Stale – Revive Now" };
  const [showLearning, setShowLearning] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);

  const confColors: Record<string, string> = { Low: "#FF4444", Medium: "#FFD700", High: "#00FFB2" };
  const typeIcons: Record<string, string> = { "New concept": "💡", "Mistake learned": "🔥", "Deepened knowledge": "📈", "Optimization": "⚡" };
  const moodEmoji: Record<string, string> = { productive: "💪", focused: "🎯", tired: "😴", distracted: "🌀", stressed: "😰" };
  const statusColors: Record<string, string> = { draft: "#FF6B35", "in-progress": "#FFD700", complete: "#00FFB2" };

  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 4, height: 32, background: project.color, borderRadius: 2 }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 22, color: "#e0e0e0", fontFamily: "monospace" }}>{project.name}</h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>{project.category} · ID: {project.id}</span>
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: project.color, textDecoration: "none", fontFamily: "monospace", padding: "2px 6px", background: `${project.color}11`, borderRadius: 4, border: `1px solid ${project.color}33` }}>
                  🔗 Repository
                </a>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "#111122", border: "1px solid #1a1a2e", color: "#666", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "monospace" }}>← Back</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "🧠 Add Learning", onClick: () => setShowLearning(true) },
          { label: "📅 Daily Report", onClick: () => setShowDailyReport(true) },
          { label: "📝 Add Doc", onClick: () => setShowDocModal(true) },
          { label: "🎯 Add Goal", onClick: () => setShowGoalModal(true) },
        ].map(btn => (
          <button key={btn.label} onClick={btn.onClick} style={{
            background: "#111122", border: `1px solid ${project.color}44`, color: project.color,
            padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontFamily: "monospace", fontSize: 12
          }}>{btn.label}</button>
        ))}
      </div>

      {/* Health Banner */}
      <div style={{
        background: `${health === "green" ? "#00FFB2" : health === "yellow" ? "#FFD700" : "#FF4444"}15`,
        border: `1px solid ${health === "green" ? "#00FFB2" : health === "yellow" ? "#FFD700" : "#FF4444"}44`,
        borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap"
      }}>
        <HealthDot health={health} />
        <span style={{ color: "#ccc", fontSize: 13 }}>{healthLabels[health]}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#666", fontFamily: "monospace" }}>
          Last active: {Math.floor((Date.now() - project.lastActive.getTime()) / 86400000)}d ago · 🔥 Burnout: {getBurnoutRisk(project)}
        </span>
      </div>

      {/* Score Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Completion", val: completion, col: project.color },
          { label: "Productivity", val: productivity, col: "#FF6B35" },
          { label: "Learning IQ", val: learning, col: "#A78BFA" },
          { label: "Momentum", val: momentum, col: "#38BDF8" }
        ].map(({ label, val, col }) => (
          <div key={label} style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <CircleProgress value={val} size={72} color={col} />
            <div style={{ fontSize: 11, color: "#555", marginTop: 8, fontFamily: "monospace", textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Hours", value: project.totalHours, color: project.color },
          { label: "Commits", value: project.commits, color: "#38BDF8" },
          { label: "Features", value: project.features, color: "#00FFB2" },
          { label: "Bugs Fixed", value: project.bugsFixed, color: "#FFD700" },
          { label: "Refactors", value: project.refactors, color: "#A78BFA" },
          { label: "Active Days", value: project.activeDays, color: "#FF6B35" }
        ].map(({ label, value, color }) => (
          <StatCard key={label} label={label} value={value} accent={color} />
        ))}
      </div>

      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>📈 Weekly Activity</div>
        <WeeklyChart data={project.weeklyHours} color={project.color} />
      </div>

      <GitMetricsView project={project} />

      {/* Daily Reports */}
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5 }}>📅 Daily Reports ({project.dailyReports.length})</div>
          <button onClick={() => setShowDailyReport(true)} style={{ background: "transparent", border: `1px solid ${project.color}44`, color: project.color, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>+ Add</button>
        </div>
        {project.dailyReports.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {[...project.dailyReports].sort((a, b) => b.date.localeCompare(a.date)).map(report => (
              <div key={report.id} style={{ background: "#080810", borderRadius: 8, padding: 12, border: "1px solid #111122" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#ddd", fontWeight: 600 }}>{report.date}</span>
                    <span>{moodEmoji[report.mood] || "🤔"}</span>
                    <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{report.mood}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: project.color, fontFamily: "monospace" }}>{report.hoursWorked}h</span>
                    <span style={{ fontSize: 10, color: "#A78BFA", fontFamily: "monospace" }}>{report.tasksDone} tasks</span>
                    <span style={{ fontSize: 10, color: "#FFD700", fontFamily: "monospace" }}>Focus: {report.focusScore}/10</span>
                    <button onClick={() => { if (confirm("Delete this report?")) onDeleteReport(project.id, report.id); }}
                      style={{ background: "transparent", border: "1px solid #FF444444", color: "#FF4444", padding: "1px 5px", borderRadius: 3, cursor: "pointer", fontSize: 8 }}>✕</button>
                  </div>
                </div>
                {report.notes && <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", borderTop: "1px solid #111122", paddingTop: 6 }}>{report.notes}</div>}
              </div>
            ))}
          </div>
        ) : <div style={{ color: "#444", textAlign: "center", padding: "24px 0", fontSize: 12, fontFamily: "monospace" }}>No daily reports yet.</div>}
      </div>

      {/* Documentation */}
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5 }}>📝 Documentation ({project.documentation.length})</div>
          <button onClick={() => setShowDocModal(true)} style={{ background: "transparent", border: `1px solid ${project.color}44`, color: project.color, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>+ Add</button>
        </div>
        {project.documentation.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {project.documentation.map(doc => (
              <div key={doc.id} style={{ background: "#080810", borderRadius: 8, padding: 12, border: "1px solid #111122" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, cursor: "pointer" }} onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}>
                  <span style={{ fontSize: 12, color: "#ddd", fontWeight: 600 }}>{doc.title}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: (statusColors[doc.status] || "#555") + "22", color: statusColors[doc.status] || "#555", fontFamily: "monospace", textTransform: "uppercase" }}>{doc.status}</span>
                    <span style={{ fontSize: 10, color: "#555" }}>{expandedDoc === doc.id ? "▲" : "▼"}</span>
                    <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this document?")) onDeleteDoc(project.id, doc.id); }}
                      style={{ background: "transparent", border: "1px solid #FF444444", color: "#FF4444", padding: "1px 5px", borderRadius: 3, cursor: "pointer", fontSize: 8 }}>✕</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#666", fontFamily: "monospace" }}><span>{doc.date}</span><span>{doc.sections} sections</span><span>{doc.wordCount} words</span></div>
                {expandedDoc === doc.id && <div style={{ marginTop: 10, padding: 10, background: "#0d0d1a", borderRadius: 6, fontSize: 12, color: "#aaa", lineHeight: 1.6, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{doc.content}</div>}
              </div>
            ))}
          </div>
        ) : <div style={{ color: "#444", textAlign: "center", padding: "24px 0", fontSize: 12, fontFamily: "monospace" }}>No documentation yet.</div>}
      </div>

      {/* Learning Entries */}
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5 }}>📚 Learning ({project.learningEntries.length} entries · {project.learningPoints} pts)</div>
          <button onClick={() => setShowLearning(true)} style={{ background: "transparent", border: `1px solid ${project.color}44`, color: project.color, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>+ Add</button>
        </div>
        {project.learningEntries.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
            {project.learningEntries.map(e => (
              <div key={e.id} style={{ background: "#080810", borderRadius: 8, padding: 12, border: "1px solid #111122" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#ddd", fontWeight: 600 }}>{typeIcons[e.type] || "📌"} {e.concept}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: confColors[e.confidence], fontFamily: "monospace" }}>{e.confidence}</span>
                    <button onClick={() => { if (confirm("Delete this entry?")) onDeleteLearning(project.id, e.id); }}
                      style={{ background: "transparent", border: "1px solid #FF444444", color: "#FF4444", padding: "1px 5px", borderRadius: 3, cursor: "pointer", fontSize: 8 }}>✕</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, color: "#555", fontFamily: "monospace" }}>{e.category}</span>
                  <span style={{ fontSize: 9, color: "#555" }}>·</span>
                  <span style={{ fontSize: 9, color: "#555" }}>{"★".repeat(e.difficulty)}{"☆".repeat(5 - e.difficulty)}</span>
                  <span style={{ fontSize: 9, color: "#555" }}>·</span>
                  <span style={{ fontSize: 9, color: "#666" }}>{e.timeSpent}h · {e.dateLogged}</span>
                </div>
                {e.resources && e.resources.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {e.resources.map((r, j) => <span key={j} style={{ fontSize: 8, color: "#888", background: "#0d0d1a", padding: "2px 6px", borderRadius: 3 }}>{r}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <div style={{ color: "#444", textAlign: "center", padding: "24px 0", fontSize: 12, fontFamily: "monospace" }}>No learning entries yet.</div>}
      </div>

      {/* Goals */}
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5 }}>🎯 Goals ({project.goals.length})</div>
          <button onClick={() => setShowGoalModal(true)} style={{ background: "transparent", border: `1px solid ${project.color}44`, color: project.color, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>+ Add</button>
        </div>
        {project.goals.length > 0 ? project.goals.map(goal => {
          const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
          return (
            <div key={goal.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#ccc" }}>{goal.title}</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "#555", fontFamily: "monospace", background: "#080810", padding: "2px 6px", borderRadius: 3 }}>{goal.category}</span>
                  <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{goal.current}/{goal.target} ({pct}%)</span>
                  <button onClick={() => { if (confirm("Delete this goal?")) onDeleteGoal(project.id, goal.id); }}
                    style={{ background: "transparent", border: "1px solid #FF444444", color: "#FF4444", padding: "1px 5px", borderRadius: 3, cursor: "pointer", fontSize: 8 }}>✕</button>
                </div>
              </div>
              <MiniBar value={goal.current} max={goal.target} color={pct >= 100 ? "#00FFB2" : project.color} height={6} />
            </div>
          );
        }) : <div style={{ color: "#444", textAlign: "center", padding: "24px 0", fontSize: 12, fontFamily: "monospace" }}>No goals set yet.</div>}
      </div>

      {/* Tech Stack */}
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>🛠 Tech Stack</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {project.techStack.map(t => <span key={t} style={{ fontSize: 12, padding: "6px 14px", background: "#080810", borderRadius: 8, color: project.color, fontFamily: "monospace", border: `1px solid ${project.color}33` }}>{t}</span>)}
          {project.techStack.length === 0 && <span style={{ color: "#444", fontSize: 12, fontFamily: "monospace" }}>No tech stack defined</span>}
        </div>
      </div>

      {/* Modals */}
      {showLearning && (
        <AddLearningModal project={project} saving={saving} onClose={() => setShowLearning(false)}
          onSave={(payload) => {
            onCreateLearning(project.id, payload);
            setShowLearning(false);
          }} />
      )}
      {showDailyReport && (
        <AddDailyReportModal project={project} saving={saving} onClose={() => setShowDailyReport(false)}
          onSave={(payload) => {
            onCreateReport(project.id, payload);
            setShowDailyReport(false);
          }} />
      )}
      {showDocModal && (
        <AddDocumentModal project={project} saving={saving} onClose={() => setShowDocModal(false)}
          onSave={(payload) => {
            onCreateDoc(project.id, payload);
            setShowDocModal(false);
          }} />
      )}
      {showGoalModal && (
        <AddGoalModal project={project} saving={saving} onClose={() => setShowGoalModal(false)}
          onSave={(payload) => {
            onCreateGoal(project.id, payload);
            setShowGoalModal(false);
          }} />
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export function App() {
  const [view, setView] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [filter, setFilter] = useState("all");
  const [showNewProject, setShowNewProject] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:3001/api");
  const toastIdRef = useRef(0);

  // ── Toast helpers ───────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── API connection ──────────────────────────────────────────────────────────
  const connectToApi = useCallback(async (url?: string) => {
    const baseUrl = url || apiBaseUrl;
    configureApi({ baseUrl });
    setSyncStatus("syncing");
    try {
      const online = await checkApiHealth();
      if (online) {
        setSyncStatus("synced");
        addToast("Connected to API server", "success");
        // Fetch projects from API
        setLoading(true);
        try {
          const response = await projectsApi.list();
          const apiProjects = response.data.map(dtoToProject);
          if (apiProjects.length > 0) {
            setProjects(apiProjects);
            addToast(`Loaded ${apiProjects.length} projects from API`, "info");
          }
        } catch (err) {
          console.warn("Failed to fetch projects:", err);
          addToast("Using local data (API fetch failed)", "info");
        } finally {
          setLoading(false);
        }
      } else {
        setSyncStatus("offline");
        addToast("API unreachable – using offline mode", "info");
      }
    } catch {
      setSyncStatus("offline");
      addToast("Running in offline mode with local data", "info");
    }
  }, [apiBaseUrl, addToast]);

  // Try connecting on mount
  useEffect(() => {
    connectToApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── CRUD Operations with API fallback ───────────────────────────────────────

  const handleCreateProject = useCallback(async (payload: CreateProjectPayload & { techStack: string[] }) => {
    setSaving(true);
    try {
      if (syncStatus === "synced") {
        const response = await projectsApi.create(payload);
        const newProject = dtoToProject(response.data);
        setProjects(prev => [...prev, newProject]);
        addToast(`Project "${payload.name}" created (synced)`, "success");
      } else {
        // Offline fallback – create locally
        const newProject: Project = {
          id: Date.now(), name: payload.name, category: payload.category, color: payload.color,
          totalTasks: payload.totalTasks, completedTasks: 0, features: 0, bugsFixed: 0, refactors: 0,
          totalHours: 0, activeDays: 0, lastActive: new Date(), commits: 0,
          techStack: payload.techStack, weeklyHours: [0, 0, 0, 0, 0, 0, 0],
          monthlyHours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          learningPoints: 0, learningEntries: [],
          gitMetrics: { commitsByDay: [0, 0, 0, 0, 0, 0, 0], pullRequests: 0, mergedPRs: 0, codeReviews: 0, commitMessages: [], languages: {}, commitTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
          documentation: [], dailyReports: [], createdDate: new Date(), goals: [],
        };
        setProjects(prev => [...prev, newProject]);
        addToast(`Project "${payload.name}" created (offline)`, "success");
      }
    } catch (err) {
      console.error("Create project error:", err);
      // Fallback to local
      const newProject: Project = {
        id: Date.now(), name: payload.name, category: payload.category, color: payload.color,
        totalTasks: payload.totalTasks, completedTasks: 0, features: 0, bugsFixed: 0, refactors: 0,
        totalHours: 0, activeDays: 0, lastActive: new Date(), commits: 0,
        techStack: payload.techStack, weeklyHours: [0, 0, 0, 0, 0, 0, 0],
        monthlyHours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        learningPoints: 0, learningEntries: [],
        gitMetrics: { commitsByDay: [0, 0, 0, 0, 0, 0, 0], pullRequests: 0, mergedPRs: 0, codeReviews: 0, commitMessages: [], languages: {}, commitTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        documentation: [], dailyReports: [], createdDate: new Date(), goals: [],
      };
      setProjects(prev => [...prev, newProject]);
      addToast(`Project created locally (API error)`, "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      setSaving(false);
      setShowNewProject(false);
    }
  }, [syncStatus, addToast]);

  const handleUpdateProject = useCallback(async (updated: Project) => {
    setSaving(true);
    try {
      if (syncStatus === "synced") {
        const dto = projectToDto(updated);
        const updatePayload: UpdateProjectPayload = {
          name: dto.name, category: dto.category, color: dto.color,
          totalTasks: dto.totalTasks, completedTasks: dto.completedTasks,
          features: dto.features, bugsFixed: dto.bugsFixed, refactors: dto.refactors,
          totalHours: dto.totalHours, activeDays: dto.activeDays,
          lastActive: dto.lastActive, commits: dto.commits,
          techStack: dto.techStack, weeklyHours: dto.weeklyHours,
          monthlyHours: dto.monthlyHours, learningPoints: dto.learningPoints,
        };
        await projectsApi.update(updated.id, updatePayload);
        addToast("Project updated (synced)", "success");
      } else {
        addToast("Project updated (offline)", "info");
      }
    } catch (err) {
      console.error("Update project error:", err);
      addToast("Saved locally (API sync failed)", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSelectedProject(updated);
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  const handleDeleteProject = useCallback(async (id: number) => {
    try {
      if (syncStatus === "synced") {
        await projectsApi.delete(id);
        addToast("Project deleted (synced)", "success");
      } else {
        addToast("Project deleted (offline)", "info");
      }
    } catch (err) {
      console.error("Delete project error:", err);
      addToast("Deleted locally (API sync failed)", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
    }
  }, [syncStatus, selectedProject, addToast]);

  const handleDeleteLearning = useCallback(async (projectId: number, entryId: number) => {
    try {
      if (syncStatus === "synced") {
        await learningApi.delete(projectId, entryId);
      }
    } catch (err) { console.error(err); if (err instanceof NetworkError) setSyncStatus("offline"); }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, learningEntries: p.learningEntries.filter(e => e.id !== entryId) } : p));
    setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, learningEntries: prev.learningEntries.filter(e => e.id !== entryId) } : prev);
    addToast("Learning entry deleted", "info");
  }, [syncStatus, addToast]);

  const handleDeleteReport = useCallback(async (projectId: number, reportId: number) => {
    try {
      if (syncStatus === "synced") {
        await reportsApi.delete(projectId, reportId);
      }
    } catch (err) { console.error(err); if (err instanceof NetworkError) setSyncStatus("offline"); }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, dailyReports: p.dailyReports.filter(r => r.id !== reportId) } : p));
    setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, dailyReports: prev.dailyReports.filter(r => r.id !== reportId) } : prev);
    addToast("Report deleted", "info");
  }, [syncStatus, addToast]);

  const handleDeleteDoc = useCallback(async (projectId: number, docId: number) => {
    try {
      if (syncStatus === "synced") {
        await docsApi.delete(projectId, docId);
      }
    } catch (err) { console.error(err); if (err instanceof NetworkError) setSyncStatus("offline"); }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, documentation: p.documentation.filter(d => d.id !== docId) } : p));
    setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, documentation: prev.documentation.filter(d => d.id !== docId) } : prev);
    addToast("Document deleted", "info");
  }, [syncStatus, addToast]);

  const handleDeleteGoal = useCallback(async (projectId: number, goalId: number) => {
    try {
      if (syncStatus === "synced") {
        await goalsApi.delete(projectId, goalId);
      }
    } catch (err) { console.error(err); if (err instanceof NetworkError) setSyncStatus("offline"); }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, goals: p.goals.filter(g => g.id !== goalId) } : p));
    setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, goals: prev.goals.filter(g => g.id !== goalId) } : prev);
    addToast("Goal deleted", "info");
  }, [syncStatus, addToast]);

  // ── Computed values ─────────────────────────────────────────────────────────
  const totalHours = projects?.reduce((a, p) => a + (p.totalHours || 0), 0) || 0;
  const totalCommits = projects?.reduce((a, p) => a + (p.commits || 0), 0) || 0;
  const totalLearning = projects?.reduce((a, p) => a + (p.learningPoints || 0), 0) || 0;
  const totalPRs = projects?.reduce((a, p) => a + (p.gitMetrics?.pullRequests || 0), 0) || 0;
  const overallProductivity = projects && projects.length > 0
    ? Math.round(projects.reduce((a, p) => a + calcProductivityScore(p), 0) / projects.length)
    : 0;
  const skillDist = getSkillDistribution(projects || []);
  const sortedSkills = Object.entries(skillDist).sort((a, b) => b[1] - a[1]);
  const strongestSkill = sortedSkills[0];
  const weakestSkill = sortedSkills[sortedSkills.length - 1];
  const totalLearningEntries = projects?.reduce((a, p) => a + (p.learningEntries?.length || 0), 0) || 0;
  const totalDocs = projects?.reduce((a, p) => a + (p.documentation?.length || 0), 0) || 0;
  const totalDailyReports = projects?.reduce((a, p) => a + (p.dailyReports?.length || 0), 0) || 0;

  const filteredProjects = Array.isArray(projects) ? (
    filter === "all" ? projects :
      filter === "active" ? projects.filter(p => p && calcHealth(p) === "green") :
        filter === "warning" ? projects.filter(p => p && calcHealth(p) !== "green") :
          projects
  ) : [];

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⬡" },
    { id: "projects", label: "Projects", icon: "◈" },
    { id: "learning", label: "Learning", icon: "🧠" },
    { id: "reports", label: "Reports", icon: "📅" },
    { id: "docs", label: "Docs", icon: "📝" },
    { id: "git", label: "Git Stats", icon: "📊" },
  ];
  const handleCreateLearning = useCallback(async (projectId: number, payload: CreateLearningEntryPayload) => {
    setSaving(true);
    try {
      if (syncStatus === "synced") {
        const response = await learningApi.create(projectId, payload);
        const newEntry = response.data;
        setProjects(prev => prev.map(p => p.id === projectId ? {
          ...p,
          learningEntries: [...p.learningEntries, newEntry],
          learningPoints: p.learningPoints + payload.difficulty * 40,
          lastActive: new Date()
        } : p));
        setSelectedProject(prev => prev && prev.id === projectId ? {
          ...prev,
          learningEntries: [...prev.learningEntries, newEntry],
          learningPoints: prev.learningPoints + payload.difficulty * 40,
          lastActive: new Date()
        } : prev);
        addToast("Learning entry synced", "success");
      } else {
        const newEntry: LearningEntryDTO = { id: Date.now(), ...payload };
        setProjects(prev => prev.map(p => p.id === projectId ? {
          ...p,
          learningEntries: [...p.learningEntries, newEntry],
          learningPoints: p.learningPoints + payload.difficulty * 40,
          lastActive: new Date()
        } : p));
        setSelectedProject(prev => prev && prev.id === projectId ? {
          ...prev,
          learningEntries: [...prev.learningEntries, newEntry],
          learningPoints: prev.learningPoints + payload.difficulty * 40,
          lastActive: new Date()
        } : prev);
        addToast("Learning entry saved locally", "info");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to sync learning entry", "error");
    } finally {
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  const handleCreateReport = useCallback(async (projectId: number, payload: CreateDailyReportPayload) => {
    setSaving(true);
    try {
      if (syncStatus === "synced") {
        const response = await reportsApi.create(projectId, payload);
        const newReport = response.data;
        setProjects(prev => prev.map(p => {
          if (p.id !== projectId) return p;
          const dayOfWeek = new Date(payload.date).getDay();
          const weekIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const newWeekly = [...p.weeklyHours];
          newWeekly[weekIdx] += payload.hoursWorked;
          return {
            ...p,
            dailyReports: [...p.dailyReports, newReport],
            totalHours: p.totalHours + payload.hoursWorked,
            completedTasks: p.completedTasks + payload.tasksDone,
            weeklyHours: newWeekly,
            activeDays: p.activeDays + 1,
            lastActive: new Date()
          };
        }));
        setSelectedProject(prev => {
          if (!prev || prev.id !== projectId) return prev;
          const dayOfWeek = new Date(payload.date).getDay();
          const weekIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const newWeekly = [...prev.weeklyHours];
          newWeekly[weekIdx] += payload.hoursWorked;
          return {
            ...prev,
            dailyReports: [...prev.dailyReports, newReport],
            totalHours: prev.totalHours + payload.hoursWorked,
            completedTasks: prev.completedTasks + payload.tasksDone,
            weeklyHours: newWeekly,
            activeDays: prev.activeDays + 1,
            lastActive: new Date()
          };
        });
        addToast("Daily report synced", "success");
      } else {
        const newReport: DailyReportDTO = { id: Date.now(), ...payload };
        setProjects(prev => prev.map(p => {
          if (p.id !== projectId) return p;
          const dayOfWeek = new Date(payload.date).getDay();
          const weekIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const newWeekly = [...p.weeklyHours];
          newWeekly[weekIdx] += payload.hoursWorked;
          return {
            ...p,
            dailyReports: [...p.dailyReports, newReport],
            totalHours: p.totalHours + payload.hoursWorked,
            completedTasks: p.completedTasks + payload.tasksDone,
            weeklyHours: newWeekly,
            activeDays: p.activeDays + 1,
            lastActive: new Date()
          };
        }));
        setSelectedProject(prev => {
          if (!prev || prev.id !== projectId) return prev;
          const dayOfWeek = new Date(payload.date).getDay();
          const weekIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const newWeekly = [...prev.weeklyHours];
          newWeekly[weekIdx] += payload.hoursWorked;
          return {
            ...prev,
            dailyReports: [...prev.dailyReports, newReport],
            totalHours: prev.totalHours + payload.hoursWorked,
            completedTasks: prev.completedTasks + payload.tasksDone,
            weeklyHours: newWeekly,
            activeDays: prev.activeDays + 1,
            lastActive: new Date()
          };
        });
        addToast("Daily report saved locally", "info");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to sync daily report", "error");
    } finally {
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  const handleCreateDoc = useCallback(async (projectId: number, payload: CreateDocumentPayload) => {
    setSaving(true);
    try {
      if (syncStatus === "synced") {
        const response = await docsApi.create(projectId, payload);
        const newDoc = response.data;
        setProjects(prev => prev.map(p => p.id === projectId ? {
          ...p,
          documentation: [...p.documentation, newDoc],
          lastActive: new Date()
        } : p));
        setSelectedProject(prev => prev && prev.id === projectId ? {
          ...prev,
          documentation: [...prev.documentation, newDoc],
          lastActive: new Date()
        } : prev);
        addToast("Document synced", "success");
      } else {
        const wordCount = payload.content.trim().split(/\s+/).length;
        const sections = Math.max(1, payload.content.split("\n\n").filter(s => s.trim()).length);
        const newDoc: DocumentationDTO = { id: Date.now(), ...payload, wordCount, sections };
        setProjects(prev => prev.map(p => p.id === projectId ? {
          ...p,
          documentation: [...p.documentation, newDoc],
          lastActive: new Date()
        } : p));
        setSelectedProject(prev => prev && prev.id === projectId ? {
          ...prev,
          documentation: [...prev.documentation, newDoc],
          lastActive: new Date()
        } : prev);
        addToast("Document saved locally", "info");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to sync document", "error");
    } finally {
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  const handleCreateGoal = useCallback(async (projectId: number, payload: CreateGoalPayload) => {
    setSaving(true);
    try {
      if (syncStatus === "synced") {
        const response = await goalsApi.create(projectId, payload);
        const newGoal = response.data;
        setProjects(prev => prev.map(p => p.id === projectId ? {
          ...p,
          goals: [...p.goals, newGoal]
        } : p));
        setSelectedProject(prev => prev && prev.id === projectId ? {
          ...prev,
          goals: [...prev.goals, newGoal]
        } : prev);
        addToast("Goal synced", "success");
      } else {
        const newGoal: GoalDTO = { id: Date.now(), ...payload };
        setProjects(prev => prev.map(p => p.id === projectId ? {
          ...p,
          goals: [...p.goals, newGoal]
        } : p));
        setSelectedProject(prev => prev && prev.id === projectId ? {
          ...prev,
          goals: [...prev.goals, newGoal]
        } : prev);
        addToast("Goal saved locally", "info");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to sync goal", "error");
    } finally {
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  return (
    <div style={{ minHeight: "100vh", background: "#04040d", fontFamily: "'Segoe UI', sans-serif", color: "#ccc", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#080810", borderRight: "1px solid #111122", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "0 20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#00FFB2", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#000" }}>P</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e0e0", fontFamily: "monospace" }}>PulseIQ</div>
              <div style={{ fontSize: 9, color: "#444", fontFamily: "monospace" }}>Dev Intelligence</div>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div style={{ padding: "0 16px 16px" }}>
          <SyncBadge status={syncStatus} onRetry={() => connectToApi()} />
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setView(item.id); setSelectedProject(null); }} style={{
              width: "100%", textAlign: "left", background: view === item.id ? "#0d0d1a" : "transparent",
              border: "none", borderLeft: `2px solid ${view === item.id ? "#00FFB2" : "transparent"}`,
              color: view === item.id ? "#e0e0e0" : "#444", padding: "12px 20px",
              cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 10,
              fontFamily: "monospace", transition: "all 0.15s"
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "0 20px" }}>
          <button onClick={() => setShowNewProject(true)} style={{
            width: "100%", background: "#00FFB2", border: "none", color: "#000",
            padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700,
            fontFamily: "monospace", fontSize: 12, marginBottom: 8
          }}>+ New Project</button>

          <button onClick={() => setShowApiConfig(true)} style={{
            width: "100%", background: "transparent", border: "1px solid #1a1a2e", color: "#555",
            padding: "8px 16px", borderRadius: 8, cursor: "pointer",
            fontFamily: "monospace", fontSize: 11, marginBottom: 16
          }}>⚙️ API Settings</button>

          <div style={{ borderTop: "1px solid #111122", paddingTop: 16 }}>
            <div style={{ fontSize: 10, color: "#333", fontFamily: "monospace", marginBottom: 8 }}>PROJECT HEALTH</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {projects.map(p => (
                <div key={p.id} title={p.name} style={{ cursor: "pointer" }} onClick={() => { setSelectedProject(p); setView("projects"); }}>
                  <HealthDot health={calcHealth(p)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", maxHeight: "100vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px" }}>
          {loading ? <Spinner /> : (
            <>
              {/* DASHBOARD */}
              {view === "dashboard" && (
                <div>
                  <h1 style={{ margin: "0 0 6px", fontSize: 26, color: "#e0e0e0", fontFamily: "monospace", fontWeight: 800 }}>Developer Intelligence Hub</h1>
                  <p style={{ margin: "0 0 24px", fontSize: 12, color: "#444", fontFamily: "monospace" }}>
                    {syncStatus === "synced" ? "✓ Connected to API" : "○ Offline mode"} · {projects.length} projects tracked
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
                    <StatCard label="Overall Score" value={overallProductivity} sub="productivity" accent="#00FFB2" />
                    <StatCard label="Total Hours" value={`${totalHours}h`} sub="invested" accent="#FF6B35" />
                    <StatCard label="Commits" value={totalCommits} sub="pushed" accent="#38BDF8" />
                    <StatCard label="Learning" value={totalLearning} sub={`${totalLearningEntries} entries`} accent="#A78BFA" />
                    <StatCard label="Pull Requests" value={totalPRs} sub="total" accent="#FFD700" />
                    <StatCard label="Reports" value={totalDailyReports} sub="logged" accent="#FF4444" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 20 }}>
                    <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20 }}>
                      <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>Projects Overview</div>
                      {Array.isArray(projects) && projects.map(p => (
                        <div key={p.id} onClick={() => { setSelectedProject(p); setView("projects"); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "10px 12px", borderRadius: 8, background: "#080810", border: "1px solid #111122" }}>
                          <HealthDot health={calcHealth(p)} />
                          <span style={{ fontSize: 12, color: "#ccc", width: 100, fontWeight: 600 }}>{p.name}</span>
                          <div style={{ flex: 1 }}><MiniBar value={calcCompletion(p)} max={100} color={p.color} height={6} /></div>
                          <span style={{ fontSize: 10, color: p.color, fontFamily: "monospace", minWidth: 40, textAlign: "right" }}>{calcCompletion(p)}%</span>
                        </div>
                      ))}
                      {(!Array.isArray(projects) || projects.length === 0) && <div style={{ color: "#444", textAlign: "center", padding: "30px 0", fontSize: 13, fontFamily: "monospace" }}>No projects yet</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Skill Distribution</div>
                        <SkillRadar projects={projects} />
                      </div>
                      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Quick Stats</div>
                        {[
                          { label: "Strongest", value: strongestSkill?.[0] || "—", color: "#00FFB2" },
                          { label: "Weakest", value: weakestSkill?.[0] || "—", color: "#FF4444" },
                          { label: "Projects", value: `${projects.length}`, color: "#38BDF8" },
                          { label: "Docs", value: `${totalDocs}`, color: "#A78BFA" }
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 10, color: "#555", fontFamily: "monospace" }}>{label}</span>
                            <span style={{ fontSize: 12, color, fontFamily: "monospace", fontWeight: 600 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Recent Activity</div>
                    {projects.flatMap(p => [
                      ...p.dailyReports.map(r => ({ type: "report" as const, date: r.date, project: p.name, color: p.color, text: `Logged ${r.hoursWorked}h · ${r.tasksDone} tasks · ${r.mood}` })),
                      ...p.learningEntries.map(e => ({ type: "learning" as const, date: e.dateLogged, project: p.name, color: p.color, text: `Learned: ${e.concept}` })),
                      ...p.documentation.map(d => ({ type: "doc" as const, date: d.date, project: p.name, color: p.color, text: `Documented: ${d.title}` })),
                    ]).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((item, i) => {
                      const icons = { report: "📅", learning: "🧠", doc: "📝" };
                      return (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: 8, background: "#080810", borderRadius: 6, border: "1px solid #111122", marginBottom: 6 }}>
                          <span style={{ fontSize: 14 }}>{icons[item.type]}</span>
                          <span style={{ fontSize: 10, color: item.color, fontFamily: "monospace", minWidth: 80 }}>{item.project}</span>
                          <span style={{ fontSize: 11, color: "#888", flex: 1 }}>{item.text}</span>
                          <span style={{ fontSize: 9, color: "#555", fontFamily: "monospace" }}>{item.date}</span>
                        </div>
                      );
                    })}
                    {projects.length === 0 && <div style={{ color: "#444", textAlign: "center", padding: 20, fontSize: 12, fontFamily: "monospace" }}>No activity</div>}
                  </div>
                </div>
              )}

              {/* PROJECTS LIST */}
              {view === "projects" && !selectedProject && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                    <h1 style={{ margin: 0, fontSize: 22, color: "#e0e0e0", fontFamily: "monospace" }}>Projects ({filteredProjects.length})</h1>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {["all", "active", "warning"].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                          background: filter === f ? "#00FFB2" : "#111122", color: filter === f ? "#000" : "#555",
                          border: "1px solid #1a1a2e", padding: "6px 14px", borderRadius: 8,
                          cursor: "pointer", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase"
                        }}>{f}</button>
                      ))}
                      <button onClick={() => setShowNewProject(true)} style={{
                        background: "#00FFB2", border: "none", color: "#000", padding: "6px 14px", borderRadius: 8,
                        cursor: "pointer", fontSize: 11, fontFamily: "monospace", fontWeight: 700
                      }}>+ New</button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
                    {filteredProjects.map(p => (
                      <ProjectCard key={p.id} project={p} onClick={proj => setSelectedProject(proj)} onDelete={handleDeleteProject} />
                    ))}
                  </div>
                  {filteredProjects.length === 0 && (
                    <div style={{ color: "#444", textAlign: "center", padding: "60px 0", fontSize: 14, fontFamily: "monospace" }}>
                      {filter === "all" ? "No projects yet." : "No projects match this filter."}
                    </div>
                  )}
                </div>
              )}

              {/* PROJECT DETAIL */}
              {view === "projects" && selectedProject && (
                <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} saving={saving}
                  onSave={handleUpdateProject}
                  onDeleteLearning={handleDeleteLearning}
                  onDeleteReport={handleDeleteReport}
                  onDeleteDoc={handleDeleteDoc}
                  onDeleteGoal={handleDeleteGoal}
                  onCreateLearning={handleCreateLearning}
                  onCreateReport={handleCreateReport}
                  onCreateDoc={handleCreateDoc}
                  onCreateGoal={handleCreateGoal}
                />
              )}

              {/* LEARNING */}
              {view === "learning" && (
                <div>
                  <h1 style={{ margin: "0 0 24px", fontSize: 22, color: "#e0e0e0", fontFamily: "monospace" }}>Learning Intelligence ({totalLearningEntries} entries)</h1>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
                    <StatCard label="Total Learning Pts" value={totalLearning} accent="#A78BFA" />
                    <StatCard label="Strongest" value={strongestSkill?.[0] || "—"} accent="#00FFB2" />
                    <StatCard label="Weakest" value={weakestSkill?.[0] || "—"} accent="#FF4444" />
                    <StatCard label="Total Entries" value={totalLearningEntries} accent="#38BDF8" />
                  </div>
                  <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Skill Points</div>
                    {Object.entries(skillDist).map(([cat, val]) => (
                      <div key={cat} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#ccc" }}>{cat}</span>
                          <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{val} pts</span>
                        </div>
                        <MiniBar value={val} max={Math.max(...Object.values(skillDist), 1)} color="#A78BFA" height={6} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 16 }}>
                    {projects.map(p => (
                      <div key={p.id} style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer" }} onClick={() => { setSelectedProject(p); setView("projects"); }}>
                          <div style={{ width: 10, height: 10, background: p.color, borderRadius: "50%" }} />
                          <span style={{ fontSize: 14, color: "#ccc", fontWeight: 600 }}>{p.name}</span>
                          <span style={{ marginLeft: "auto", fontSize: 12, color: p.color, fontFamily: "monospace" }}>{p.learningEntries.length} entries</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                          {p.learningEntries.map(e => {
                            const cc: Record<string, string> = { Low: "#FF4444", Medium: "#FFD700", High: "#00FFB2" };
                            return (
                              <div key={e.id} style={{ background: "#080810", borderRadius: 8, padding: "8px 12px", border: "1px solid #111122" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, color: "#ddd", fontWeight: 600 }}>{e.concept}</span>
                                  <span style={{ fontSize: 9, color: cc[e.confidence], fontFamily: "monospace" }}>{e.confidence}</span>
                                </div>
                                <div style={{ fontSize: 9, color: "#666", fontFamily: "monospace" }}>{e.category} · {"★".repeat(e.difficulty)}{"☆".repeat(5 - e.difficulty)} · {e.timeSpent}h · {e.dateLogged}</div>
                              </div>
                            );
                          })}
                          {p.learningEntries.length === 0 && <div style={{ color: "#555", textAlign: "center", padding: "20px 0", fontSize: 12 }}>No entries yet</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REPORTS */}
              {view === "reports" && (
                <div>
                  <h1 style={{ margin: "0 0 24px", fontSize: 22, color: "#e0e0e0", fontFamily: "monospace" }}>Daily Reports ({totalDailyReports})</h1>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
                    <StatCard label="Total Reports" value={totalDailyReports} accent="#FF6B35" />
                    <StatCard label="Total Hours" value={`${totalHours}h`} accent="#00FFB2" />
                    <StatCard label="Avg Focus" value={projects.flatMap(p => p.dailyReports).length > 0 ? (projects.flatMap(p => p.dailyReports).reduce((a, r) => a + r.focusScore, 0) / projects.flatMap(p => p.dailyReports).length).toFixed(1) : "—"} sub="/10" accent="#A78BFA" />
                  </div>
                  {projects.map(p => (
                    <div key={p.id} style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer" }} onClick={() => { setSelectedProject(p); setView("projects"); }}>
                        <div style={{ width: 10, height: 10, background: p.color, borderRadius: "50%" }} />
                        <span style={{ fontSize: 14, color: "#ccc", fontWeight: 600 }}>{p.name}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#555", fontFamily: "monospace" }}>{p.dailyReports.length} reports</span>
                      </div>
                      {p.dailyReports.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {[...p.dailyReports].sort((a, b) => b.date.localeCompare(a.date)).map(r => {
                            const me: Record<string, string> = { productive: "💪", focused: "🎯", tired: "😴", distracted: "🌀", stressed: "😰" };
                            return (
                              <div key={r.id} style={{ background: "#080810", borderRadius: 8, padding: 12, border: "1px solid #111122" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 12, color: "#ddd", fontWeight: 600 }}>{r.date}</span>
                                    <span>{me[r.mood] || "🤔"}</span>
                                    <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{r.mood}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 12 }}>
                                    <span style={{ fontSize: 10, color: p.color, fontFamily: "monospace" }}>{r.hoursWorked}h</span>
                                    <span style={{ fontSize: 10, color: "#A78BFA", fontFamily: "monospace" }}>{r.tasksDone} tasks</span>
                                    <span style={{ fontSize: 10, color: "#FFD700", fontFamily: "monospace" }}>Focus: {r.focusScore}/10</span>
                                  </div>
                                </div>
                                {r.notes && <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", marginTop: 6 }}>{r.notes}</div>}
                              </div>
                            );
                          })}
                        </div>
                      ) : <div style={{ color: "#555", textAlign: "center", padding: "20px 0", fontSize: 12, fontFamily: "monospace" }}>No reports</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* DOCS */}
              {view === "docs" && (
                <div>
                  <h1 style={{ margin: "0 0 24px", fontSize: 22, color: "#e0e0e0", fontFamily: "monospace" }}>Documentation ({totalDocs})</h1>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
                    <StatCard label="Total Docs" value={totalDocs} accent="#A78BFA" />
                    <StatCard label="Total Words" value={projects.flatMap(p => p.documentation).reduce((a, d) => a + d.wordCount, 0)} accent="#00FFB2" />
                    <StatCard label="Complete" value={projects.flatMap(p => p.documentation).filter(d => d.status === "complete").length} accent="#38BDF8" />
                  </div>
                  {projects.map(p => (
                    <div key={p.id} style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer" }} onClick={() => { setSelectedProject(p); setView("projects"); }}>
                        <div style={{ width: 10, height: 10, background: p.color, borderRadius: "50%" }} />
                        <span style={{ fontSize: 14, color: "#ccc", fontWeight: 600 }}>{p.name}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#555", fontFamily: "monospace" }}>{p.documentation.length} docs</span>
                      </div>
                      {p.documentation.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {p.documentation.map(doc => {
                            const sc: Record<string, string> = { draft: "#FF6B35", "in-progress": "#FFD700", complete: "#00FFB2" };
                            return (
                              <div key={doc.id} style={{ background: "#080810", borderRadius: 8, padding: 12, border: "1px solid #111122" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <span style={{ fontSize: 12, color: "#ddd", fontWeight: 600 }}>{doc.title}</span>
                                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: (sc[doc.status] || "#555") + "22", color: sc[doc.status] || "#555", fontFamily: "monospace", textTransform: "uppercase" }}>{doc.status}</span>
                                </div>
                                <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", marginBottom: 8 }}>{doc.date} · {doc.sections} sections · {doc.wordCount} words</div>
                                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>{doc.content.substring(0, 200)}{doc.content.length > 200 ? "..." : ""}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : <div style={{ color: "#555", textAlign: "center", padding: "20px 0", fontSize: 12, fontFamily: "monospace" }}>No docs</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* GIT STATS */}
              {view === "git" && (
                <div>
                  <h1 style={{ margin: "0 0 24px", fontSize: 22, color: "#e0e0e0", fontFamily: "monospace" }}>Git Statistics</h1>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
                    <StatCard label="Total Commits" value={totalCommits} accent="#38BDF8" />
                    <StatCard label="Total PRs" value={totalPRs} accent="#A78BFA" />
                    <StatCard label="Merged PRs" value={projects.reduce((a, p) => a + p.gitMetrics.mergedPRs, 0)} accent="#00FFB2" />
                    <StatCard label="Code Reviews" value={projects.reduce((a, p) => a + p.gitMetrics.codeReviews, 0)} accent="#FFD700" />
                  </div>
                  {projects.map(p => (
                    <div key={p.id} style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }} onClick={() => { setSelectedProject(p); setView("projects"); }}>
                        <div style={{ width: 10, height: 10, background: p.color, borderRadius: "50%" }} />
                        <h3 style={{ margin: 0, color: p.color, fontFamily: "monospace", fontSize: 16 }}>{p.name}</h3>
                      </div>
                      <GitMetricsView project={p} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewProject && <AddProjectModal onClose={() => setShowNewProject(false)} onSave={handleCreateProject} saving={saving} />}
      {showApiConfig && (
        <ApiConfigModal currentUrl={apiBaseUrl} onClose={() => setShowApiConfig(false)} onSave={(url) => {
          setApiBaseUrl(url);
          connectToApi(url);
        }} />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* CSS Animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}