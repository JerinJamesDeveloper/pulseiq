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
  ApiResponse,
  ApiListResponse,
  AnalyticsOverviewDTO,
} from "./types";

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  /** GET /api/projects */
  list: () =>
    http.get<ApiListResponse<ProjectDTO>>("/projects"),

  /** GET /api/projects/:id */
  get: (id: number) =>
    http.get<ApiResponse<ProjectDTO>>(`/projects/${id}`),

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

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  /** GET /api/analytics/overview */
  overview: () =>
    http.get<ApiResponse<AnalyticsOverviewDTO>>("/analytics/overview"),
};
