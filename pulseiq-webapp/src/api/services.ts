// ─── API SERVICES ─────────────────────────────────────────────────────────────
// Each function maps to a single REST endpoint.
// All functions return Promises and throw on failure.

import { http } from "./client";
import type {
  ProjectDTO,
  LearningEntryDTO,
  DailyReportDTO,
  DocumentationDTO,
  GoalDTO,
  IssueDTO,
  CreateProjectPayload,
  UpdateProjectPayload,
  CreateLearningEntryPayload,
  UpdateLearningEntryPayload,
  CreateDailyReportPayload,
  UpdateDailyReportPayload,
  CreateDocumentPayload,
  UpdateDocumentPayload,
  CreateGoalPayload,
  UpdateGoalPayload,
  CreateIssuePayload,
  UpdateIssuePayload,
  TaskDTO,
  CreateTaskPayload,
  UpdateTaskPayload,
  ApiResponse,
  ApiListResponse,
  AnalyticsOverviewDTO,
  DashboardStatsDTO,
  AIChatRequestPayload,
  AIChatResponseDTO,
} from "./types";

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  /** GET /api/projects */
  list: () =>
    http.get<ApiListResponse<ProjectDTO>>("/projects"),

  /** GET /api/projects/dashboard */
  dashboard: () =>
    http.get<ApiResponse<DashboardStatsDTO>>("/projects/dashboard"),

  /** GET /api/projects/:id */
  get: (id: number) =>
    http.get<ApiResponse<ProjectDTO>>(`/projects/${id}`),

  /** GET /api/projects/:id?refreshGit=true */
  getWithGitRefresh: (id: number) =>
    http.get<ApiResponse<ProjectDTO>>(`/projects/${id}?refreshGit=true`),

  /** GET /api/projects/:id/git-metrics */
  getGitMetrics: (id: number) =>
    http.get<ApiResponse<unknown>>(`/projects/${id}/git-metrics`),

  /** POST /api/projects */
  create: (payload: CreateProjectPayload) =>
    http.post<ApiResponse<ProjectDTO>>("/projects", payload),

  /** PUT /api/projects/:id */
  update: (id: number, payload: UpdateProjectPayload) =>
    http.put<ApiResponse<ProjectDTO>>(`/projects/${id}`, payload),

  /** PATCH /api/projects/:id  (partial update) */
  patch: (id: number, payload: Partial<UpdateProjectPayload>) =>
    http.patch<ApiResponse<ProjectDTO>>(`/projects/${id}`, payload),

  /** DELETE /api/projects/:id */
  delete: (id: number) =>
    http.delete<void>(`/projects/${id}`),
};

// ─── LEARNING ENTRIES ─────────────────────────────────────────────────────────

export const learningApi = {
  /** GET /api/projects/:projectId/learning */
  list: (projectId: number) =>
    http.get<ApiListResponse<LearningEntryDTO>>(`/projects/${projectId}/learning`),

  /** GET /api/projects/:projectId/learning/:id */
  get: (projectId: number, id: number) =>
    http.get<ApiResponse<LearningEntryDTO>>(`/projects/${projectId}/learning/${id}`),

  /** POST /api/projects/:projectId/learning */
  create: (projectId: number, payload: CreateLearningEntryPayload) =>
    http.post<ApiResponse<LearningEntryDTO>>(`/projects/${projectId}/learning`, payload),

  /** PUT /api/projects/:projectId/learning/:id */
  update: (projectId: number, id: number, payload: UpdateLearningEntryPayload) =>
    http.put<ApiResponse<LearningEntryDTO>>(`/projects/${projectId}/learning/${id}`, payload),

  /** DELETE /api/projects/:projectId/learning/:id */
  delete: (projectId: number, id: number) =>
    http.delete<void>(`/projects/${projectId}/learning/${id}`),
};

// ─── DAILY REPORTS ────────────────────────────────────────────────────────────

export const reportsApi = {
  /** GET /api/projects/:projectId/reports */
  list: (projectId: number) =>
    http.get<ApiListResponse<DailyReportDTO>>(`/projects/${projectId}/reports`),

  /** GET /api/projects/:projectId/reports/:id */
  get: (projectId: number, id: number) =>
    http.get<ApiResponse<DailyReportDTO>>(`/projects/${projectId}/reports/${id}`),

  /** POST /api/projects/:projectId/reports */
  create: (projectId: number, payload: CreateDailyReportPayload) =>
    http.post<ApiResponse<DailyReportDTO>>(`/projects/${projectId}/reports`, payload),

  /** PUT /api/projects/:projectId/reports/:id */
  update: (projectId: number, id: number, payload: UpdateDailyReportPayload) =>
    http.put<ApiResponse<DailyReportDTO>>(`/projects/${projectId}/reports/${id}`, payload),

  /** DELETE /api/projects/:projectId/reports/:id */
  delete: (projectId: number, id: number) =>
    http.delete<void>(`/projects/${projectId}/reports/${id}`),
};

// ─── DOCUMENTATION ────────────────────────────────────────────────────────────

export const docsApi = {
  /** GET /api/projects/:projectId/docs */
  list: (projectId: number) =>
    http.get<ApiListResponse<DocumentationDTO>>(`/projects/${projectId}/docs`),

  /** GET /api/projects/:projectId/docs/:id */
  get: (projectId: number, id: number) =>
    http.get<ApiResponse<DocumentationDTO>>(`/projects/${projectId}/docs/${id}`),

  /** POST /api/projects/:projectId/docs */
  create: (projectId: number, payload: CreateDocumentPayload) =>
    http.post<ApiResponse<DocumentationDTO>>(`/projects/${projectId}/docs`, payload),

  /** PUT /api/projects/:projectId/docs/:id */
  update: (projectId: number, id: number, payload: UpdateDocumentPayload) =>
    http.put<ApiResponse<DocumentationDTO>>(`/projects/${projectId}/docs/${id}`, payload),

  /** DELETE /api/projects/:projectId/docs/:id */
  delete: (projectId: number, id: number) =>
    http.delete<void>(`/projects/${projectId}/docs/${id}`),
};

// ─── GOALS ────────────────────────────────────────────────────────────────────

export const goalsApi = {
  /** GET /api/projects/:projectId/goals */
  list: (projectId: number) =>
    http.get<ApiListResponse<GoalDTO>>(`/projects/${projectId}/goals`),

  /** GET /api/projects/:projectId/goals/:id */
  get: (projectId: number, id: number) =>
    http.get<ApiResponse<GoalDTO>>(`/projects/${projectId}/goals/${id}`),

  /** POST /api/projects/:projectId/goals */
  create: (projectId: number, payload: CreateGoalPayload) =>
    http.post<ApiResponse<GoalDTO>>(`/projects/${projectId}/goals`, payload),

  /** PUT /api/projects/:projectId/goals/:id */
  update: (projectId: number, id: number, payload: UpdateGoalPayload) =>
    http.put<ApiResponse<GoalDTO>>(`/projects/${projectId}/goals/${id}`, payload),

  /** DELETE /api/projects/:projectId/goals/:id */
  delete: (projectId: number, id: number) =>
    http.delete<void>(`/projects/${projectId}/goals/${id}`),
};

// ─── ISSUES ───────────────────────────────────────────────────────────────────

export const issuesApi = {
  /** GET /api/projects/:projectId/issues */
  list: (projectId: number) =>
    http.get<ApiListResponse<IssueDTO>>(`/projects/${projectId}/issues`),

  /** POST /api/projects/:projectId/issues */
  create: (projectId: number, payload: CreateIssuePayload) =>
    http.post<ApiResponse<IssueDTO>>(`/projects/${projectId}/issues`, payload),

  /** PUT /api/projects/:projectId/issues/:id */
  update: (projectId: number, id: number, payload: UpdateIssuePayload) =>
    http.put<ApiResponse<IssueDTO>>(`/projects/${projectId}/issues/${id}`, payload),

  /** DELETE /api/projects/:projectId/issues/:id */
  delete: (projectId: number, id: number) =>
    http.delete<void>(`/projects/${projectId}/issues/${id}`),
};

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const tasksApi = {
  /** GET /api/projects/:projectId/tasks */
  list: (projectId: number) =>
    http.get<ApiListResponse<TaskDTO>>(`/projects/${projectId}/tasks`),

  /** POST /api/projects/:projectId/tasks */
  create: (projectId: number, payload: CreateTaskPayload) =>
    http.post<ApiResponse<TaskDTO>>(`/projects/${projectId}/tasks`, payload),

  /** PUT /api/projects/:projectId/tasks/:id */
  update: (projectId: number, id: number, payload: UpdateTaskPayload) =>
    http.put<ApiResponse<TaskDTO>>(`/projects/${projectId}/tasks/${id}`, payload),

  /** DELETE /api/projects/:projectId/tasks/:id */
  delete: (projectId: number, id: number) =>
    http.delete<void>(`/projects/${projectId}/tasks/${id}`),
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  /** GET /api/analytics/overview */
  overview: () =>
    http.get<ApiResponse<AnalyticsOverviewDTO>>("/analytics/overview"),
};

// â”€â”€â”€ AI CHAT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const aiApi = {
  /** POST /api/ai/chat */
  chat: (payload: AIChatRequestPayload) =>
    http.post<ApiResponse<AIChatResponseDTO>>("/ai/chat", payload),
};
