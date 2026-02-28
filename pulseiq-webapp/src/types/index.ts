import {
  type LearningEntryDTO,
  type DailyReportDTO,
  type DocumentationDTO,
  type GoalDTO,
  type IssueDTO,
  type TaskDTO,
} from "../api";

export {
  type LearningEntryDTO,
  type DailyReportDTO,
  type DocumentationDTO,
  type GoalDTO,
  type IssueDTO,
  type TaskDTO,
};

export interface Project {
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
  git_repo?: string;
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
  issues: IssueDTO[];
  tasks: TaskDTO[];
}

export type SyncStatus = "synced" | "syncing" | "offline" | "error";
export type ChatRole = "assistant" | "user" | "system";

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
}

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}
