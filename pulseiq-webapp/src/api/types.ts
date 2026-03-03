// ─── API DATA MODELS ──────────────────────────────────────────────────────────
// These types represent the shapes expected by the REST API.
// Dates are serialized as ISO 8601 strings in JSON payloads.

export interface LearningEntryDTO {
  id: number;
  concept: string;
  category: string;
  difficulty: number;
  type: string;
  confidence: string;
  dateLogged: string;
  timeSpent: number;
  resources?: string[];
}

export interface GitMetricsDTO {
  commitsByDay: number[];
  pullRequests: number;
  mergedPRs: number;
  codeReviews: number;
  commitMessages?: string[];
  languages: Record<string, number>;
  commitTrend: number[];
}

export interface DocumentationDTO {
  id: number;
  date: string;
  title: string;
  content: string;
  status: string;
  sections: number;
  wordCount: number;
}

export interface DailyReportDTO {
  id: number;
  date: string;
  hoursWorked: number;
  tasksDone: number;
  notes: string;
  mood: string;
  focusScore: number;
}

export interface GoalDTO {
  id: number;
  projectId: number;
  title: string;
  target: number;
  current: number;
  category: string;
  comments?: string;
  status: "todo" | "in-progress" | "completed";
  hoursSpent: number;
  issueIds: number[];
  reportIds: number[];
  taskIds: number[];
  createdAt: string;
  updatedAt: string;
}

export type IssueStatus = "open" | "in-progress" | "resolved" | "closed";
export type IssuePriority = "low" | "medium" | "high" | "critical";

export interface IssueDTO {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  dateCreated: string;
  updatedAt?: string;
}

export interface TaskDTO {
  id: number;
  projectId: number;
  title: string;
  status: "todo" | "in-progress" | "completed";
  dateCreated: string;
  updatedAt?: string;
}

export interface ProjectDTO {
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
  lastActive: string; // ISO date string
  commits: number;
  techStack: string[];
  git_repo?: string;
  weeklyHours: number[];
  monthlyHours: number[];
  learningPoints: number;
  learningEntries: LearningEntryDTO[];
  gitMetrics: GitMetricsDTO;
  documentation: DocumentationDTO[];
  dailyReports: DailyReportDTO[];
  createdDate: string; // ISO date string
  goals: GoalDTO[];
  issues: IssueDTO[];
  tasks: TaskDTO[];
}

// ─── REQUEST PAYLOADS (Create / Update) ───────────────────────────────────────

export interface CreateProjectPayload {
  name: string;
  category: string;
  color: string;
  techStack: string[];
  git_repo?: string;
  totalTasks: number;
}

export interface UpdateProjectPayload {
  name?: string;
  category?: string;
  color?: string;
  totalTasks?: number;
  completedTasks?: number;
  features?: number;
  bugsFixed?: number;
  refactors?: number;
  totalHours?: number;
  activeDays?: number;
  lastActive?: string;
  commits?: number;
  techStack?: string[];
  git_repo?: string;
  weeklyHours?: number[];
  monthlyHours?: number[];
  learningPoints?: number;
}

export interface CreateLearningEntryPayload {
  concept: string;
  category: string;
  difficulty: number;
  type: string;
  confidence: string;
  dateLogged: string;
  timeSpent: number;
  resources?: string[];
}

export interface UpdateLearningEntryPayload {
  concept?: string;
  category?: string;
  difficulty?: number;
  type?: string;
  confidence?: string;
  dateLogged?: string;
  timeSpent?: number;
  resources?: string[];
}

export interface CreateDailyReportPayload {
  date: string;
  hoursWorked: number;
  tasksDone: number;
  notes: string;
  mood: string;
  focusScore: number;
}

export interface UpdateDailyReportPayload {
  date?: string;
  hoursWorked?: number;
  tasksDone?: number;
  notes?: string;
  mood?: string;
  focusScore?: number;
}

export interface CreateDocumentPayload {
  title: string;
  content: string;
  status: string;
  date: string;
}

export interface UpdateDocumentPayload {
  title?: string;
  content?: string;
  status?: string;
  date?: string;
}

export interface CreateGoalPayload {
  title: string;
  target: number;
  current?: number;
  category: string;
  comments?: string;
  status?: "todo" | "in-progress" | "completed";
  hoursSpent?: number;
  issueIds?: number[];
  reportIds?: number[];
  taskIds?: number[];
}

export interface UpdateGoalPayload {
  title?: string;
  target?: number;
  current?: number;
  category?: string;
  comments?: string;
  status?: "todo" | "in-progress" | "completed";
  hoursSpent?: number;
  issueIds?: number[];
  reportIds?: number[];
  taskIds?: number[];
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
}

export interface CreateTaskPayload {
  title: string;
  status?: "todo" | "in-progress" | "completed";
}

export interface UpdateTaskPayload {
  title?: string;
  status?: "todo" | "in-progress" | "completed";
}

// ─── API RESPONSE WRAPPERS ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

// ─── ANALYTICS RESPONSE TYPES ─────────────────────────────────────────────────

export interface AnalyticsOverviewDTO {
  totalProjects: number;
  totalHours: number;
  totalCommits: number;
  totalLearningPoints: number;
  totalPullRequests: number;
  totalDailyReports: number;
  totalDocuments: number;
  overallProductivity: number;
  skillDistribution: Record<string, number>;
}

export interface DashboardStatsDTO {
  totalProjects: number;
  totalHours: number;
  totalCommits: number;
  totalLearningPoints: number;
  totalLearningEntries: number;
  totalDocs: number;
  totalDailyReports: number;
  totalTaskCount: number;
  completedTaskCount: number;
  pendingTaskCount?: number;
  totalIssueCount: number;
  completedIssueCount: number;
  pendingIssueCount?: number;
  openWorkload?: number;
  totalWorkItems?: number;
  totalCompletedItems?: number;
  backlogCompletionRate?: number;
  pendingProjectsCount?: number;
  cleanProjectsCount?: number;
  projectsWithPendingPercent?: number;
  avgPendingAcrossActiveProjects?: number;
  topBacklogProject?: DashboardProjectWorkloadDTO | null;
  projectWorkload?: DashboardProjectWorkloadDTO[];
  skillDistribution: Record<string, number>;
  strongestSkill: string | null;
}

export interface DashboardProjectWorkloadDTO {
  projectId: number;
  name: string;
  category: string;
  totalTaskCount: number;
  completedTaskCount: number;
  pendingTaskCount: number;
  totalIssueCount: number;
  completedIssueCount: number;
  pendingIssueCount: number;
  totalPending: number;
  completionRate: number;
  riskLevel: "low" | "medium" | "high";
}

export type AIChatRole = "user" | "assistant" | "system";

export interface AIChatMessageDTO {
  role: AIChatRole;
  content: string;
}

export interface AIChatRequestPayload {
  prompt?: string;
  messages?: AIChatMessageDTO[];
  model?: string;
}

export interface AIChatChoiceDTO {
  index?: number;
  message?: AIChatMessageDTO;
  text?: string;
  finish_reason?: string;
}

export interface AIChatResponseDTO {
  id?: string;
  model?: string;
  choices?: AIChatChoiceDTO[];
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}
