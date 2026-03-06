import { useState, useEffect, useRef, useCallback } from "react";
import {
  projectsApi,
  learningApi,
  reportsApi,
  docsApi,
  goalsApi,
  issuesApi,
  tasksApi,
  aiApi,
  configureApi,
  checkApiHealth,
  NetworkError,
  type ProjectDTO,
  type LearningEntryDTO,
  type DailyReportDTO,
  type DocumentationDTO,
  type GoalDTO,
  type CreateProjectPayload,
  type UpdateProjectPayload,
  type CreateLearningEntryPayload,
  type CreateDailyReportPayload,
  type CreateDocumentPayload,
  type CreateGoalPayload,
  type CreateIssuePayload,
  type CreateTaskPayload,
  type IssueDTO,
  type TaskDTO,
  type DashboardStatsDTO
} from "./api";
import { type Project, type SyncStatus, type Toast, type ChatMessage } from "./types";
// No constants needed here after refactor
import { DEFAULT_PROJECTS } from "./constants/mockData";
import {
  dtoToProject,
  projectToDto,
  extractProjectDto,
  normalizeGitMetrics,
} from "./utils/converters";
import {
  calcHealth,
  calcProductivityScore,
  getSkillDistribution,
} from "./utils/analytics";
import { downloadProjectExcel } from "./utils/excel";

// Components
import { SyncBadge } from "./components/common/SyncBadge";
import { ToastContainer } from "./components/common/ToastContainer";
import { Spinner } from "./components/common/Spinner";
import { StatCard } from "./components/common/StatCard";
import { SkillRadar } from "./components/common/SkillRadar";
import { ProjectCard } from "./components/features/ProjectCard";
import { ProjectDetail } from "./components/layout/ProjectDetail";
import { GoalsPage } from "./components/features/GoalsPage";
import { AddProjectModal } from "./components/modals/AddProjectModal";
import { ApiConfigModal } from "./components/modals/ApiConfigModal";
import { DashboardReports } from "./components/features/DashboardReports";

const DASHBOARD_CACHE_KEY = "pulseiq_dashboard_stats_v1";

// ── MAIN APP ─────────────────────────────────────────────────────────────────

export function App() {
  const [view, setView] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [filter, setFilter] = useState("all");
  const [categoryFilter] = useState("all");
  const [showNewProject, setShowNewProject] = useState(false);
const [showApiConfig, setShowApiConfig] = useState(false);
  const [showDashboardReports, setShowDashboardReports] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");
  const [saving, setSaving] = useState(false);
  const [fetchingGitProjectId, setFetchingGitProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsDTO | null>(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DashboardStatsDTO;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    try {
      return localStorage.getItem("pulseiq_api_base_url") || "http://localhost:3001/api";
    } catch {
      return "http://localhost:3001/api";
    }
  });
  const [settingsApiUrl, setSettingsApiUrl] = useState(() => {
    try {
      return localStorage.getItem("pulseiq_api_base_url") || "http://localhost:3001/api";
    } catch {
      return "http://localhost:3001/api";
    }
  });
  const [showEmiChat, setShowEmiChat] = useState(false);
  const [emiInput, setEmiInput] = useState("");
  const [emiSending, setEmiSending] = useState(false);
  const [emiMessages, setEmiMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", text: "Hi, I am emi. Ask me about your projects, reports, or progress." },
  ]);
  const toastIdRef = useRef(0);
  const emiMsgIdRef = useRef(1);
  const emiEndRef = useRef<HTMLDivElement | null>(null);

  // ── Toast helpers ───────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const applyDashboardStats = useCallback((stats: DashboardStatsDTO | null) => {
    setDashboardStats(stats);
    try {
      if (stats) localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(stats));
      else localStorage.removeItem(DASHBOARD_CACHE_KEY);
    } catch {
      // Ignore localStorage failures.
    }
  }, []);

  const refreshDashboardStats = useCallback(async (silent = true) => {
    if (syncStatus !== "synced") return null;
    try {
      const response = await projectsApi.dashboard();
      const stats = response?.data || null;
      applyDashboardStats(stats);
      return stats;
    } catch (err) {
      if (!silent) addToast("Failed to refresh dashboard metrics", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
      return null;
    }
  }, [syncStatus, applyDashboardStats, addToast]);

  const buildEmiReply = useCallback((input: string): string => {
    const text = input.toLowerCase();
    const totalHours = projects.reduce((a, p) => a + (p.totalHours || 0), 0);
    const totalReports = projects.reduce((a, p) => a + (p.dailyReports?.length || 0), 0);
    const totalLearning = projects.reduce((a, p) => a + (p.learningEntries?.length || 0), 0);
    const totalCommits = projects.reduce((a, p) => a + (p.commits || 0), 0);

    if (text.includes("summary") || text.includes("status") || text.includes("overview")) {
      return `You currently track ${projects.length} projects with ${totalHours}h logged, ${totalCommits} commits, ${totalReports} daily reports, and ${totalLearning} learning entries.`;
    }
    if (text.includes("hours")) {
      return `Total hours logged across all projects: ${totalHours}h.`;
    }
    if (text.includes("report")) {
      return `You have logged ${totalReports} daily reports so far.`;
    }
    if (text.includes("learning")) {
      return `You have ${totalLearning} learning entries recorded across your projects.`;
    }
    if (text.includes("project")) {
      const names = projects.slice(0, 4).map((p) => p.name).join(", ");
      return projects.length > 0 ? `Current projects include: ${names}${projects.length > 4 ? ", ..." : ""}.` : "No projects found yet.";
    }

    return "I can help with project summaries, hours, reports, learning progress, and quick status checks.";
  }, [projects]);

  const sendEmiMessage = useCallback(async () => {
    const trimmed = emiInput.trim();
    if (!trimmed || emiSending) return;

    const userMsg: ChatMessage = { id: ++emiMsgIdRef.current, role: "user", text: trimmed };
    setEmiInput("");
    setEmiMessages((prev) => [...prev, userMsg]);
    setEmiSending(true);

    try {
      const apiMessages = [...emiMessages, userMsg]
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.text }));

      const response = await aiApi.chat({ messages: apiMessages });
      const aiText =
        response?.data?.choices?.[0]?.message?.content?.trim() ||
        response?.data?.choices?.[0]?.text?.trim() ||
        "";

      const aiMsg: ChatMessage = {
        id: ++emiMsgIdRef.current,
        role: "assistant",
        text: aiText || buildEmiReply(trimmed),
      };

      setEmiMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI chat request failed:", err);
      const fallback: ChatMessage = {
        id: ++emiMsgIdRef.current,
        role: "assistant",
        text: `${buildEmiReply(trimmed)}\n\n(Using offline fallback reply; AI endpoint unavailable.)`,
      };
      setEmiMessages((prev) => [...prev, fallback]);
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      setEmiSending(false);
    }
  }, [emiInput, emiSending, emiMessages, buildEmiReply]);

  useEffect(() => {
    setSettingsApiUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    emiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [emiMessages, showEmiChat]);

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
          const [projectsResult, dashboardResult] = await Promise.allSettled([
            projectsApi.list(),
            projectsApi.dashboard(),
          ]);

          if (projectsResult.status === "fulfilled") {
            const raw = projectsResult.value as unknown as { data?: ProjectDTO[]; projects?: ProjectDTO[] } | ProjectDTO[];
            const projectRows = Array.isArray(raw)
              ? raw
              : Array.isArray(raw.data)
                ? raw.data
                : Array.isArray(raw.projects)
                  ? raw.projects
                  : [];
            const apiProjects = projectRows.map(dtoToProject);
            setProjects(apiProjects);
            addToast(`Loaded ${apiProjects.length} projects from API`, "info");
          } else {
            console.warn("Failed to fetch projects:", projectsResult.reason);
            addToast("Using local data (projects API fetch failed)", "info");
          }

          if (dashboardResult.status === "fulfilled") {
            applyDashboardStats(dashboardResult.value.data || null);
          } else {
            console.warn("Failed to fetch dashboard data:", dashboardResult.reason);
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
  }, [apiBaseUrl, addToast, applyDashboardStats]);

  const applyGitRefreshResponse = useCallback((projectId: number, payload: unknown): void => {
    let refreshed: Project | null = null;

    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (typeof obj.id === "number" && typeof obj.name === "string") {
        refreshed = dtoToProject(payload as ProjectDTO);
      } else {
        const maybeGitMetrics = ("gitMetrics" in obj ? obj.gitMetrics : payload) as Partial<Project["gitMetrics"]> | undefined;
        const normalized = normalizeGitMetrics(maybeGitMetrics);

        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, gitMetrics: normalized, lastActive: new Date() } : p)),
        );
        setSelectedProject((prev) =>
          prev && prev.id === projectId ? { ...prev, gitMetrics: normalized, lastActive: new Date() } : prev,
        );
        return;
      }
    }

    if (refreshed) {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? refreshed! : p)));
      setSelectedProject((prev) => (prev && prev.id === projectId ? refreshed : prev));
    }
  }, []);

  const handleFetchGitData = useCallback(async (projectId: number) => {
    if (syncStatus !== "synced") {
      addToast("Connect to API to fetch git data", "info");
      return;
    }

    setFetchingGitProjectId(projectId);
    try {
      const response = await projectsApi.getGitMetrics(projectId);
      applyGitRefreshResponse(projectId, response.data);
      addToast("Git data refreshed", "success");
    } catch (err) {
      console.error("Git refresh failed:", err);
      addToast("Failed to fetch git data", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      setFetchingGitProjectId(null);
    }
  }, [syncStatus, addToast, applyGitRefreshResponse]);

  // Try connecting on mount
  useEffect(() => {
    connectToApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (syncStatus !== "synced" || !selectedProject?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await projectsApi.get(selectedProject.id);
        if (cancelled) return;
        const refreshed = dtoToProject(response.data);
        setProjects((prev) => prev.map((p) => (p.id === refreshed.id ? refreshed : p)));
        setSelectedProject((prev) => (prev && prev.id === refreshed.id ? refreshed : prev));
      } catch (err) {
        console.warn("Project refresh with git failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProject?.id, syncStatus]);

  useEffect(() => {
    if (syncStatus !== "synced") return;
    const timer = setInterval(() => {
      refreshDashboardStats(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [syncStatus, refreshDashboardStats]);

  // ── CRUD Operations with API fallback ───────────────────────────────────────

  const handleCreateProject = useCallback(async (payload: CreateProjectPayload) => {
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
          git_repo: payload.git_repo,
          techStack: payload.techStack, weeklyHours: [0, 0, 0, 0, 0, 0, 0],
          monthlyHours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          learningPoints: 0, learningEntries: [],
          gitMetrics: { commitsByDay: [0, 0, 0, 0, 0, 0, 0], pullRequests: 0, mergedPRs: 0, codeReviews: 0, commitMessages: [], languages: {}, commitTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
          documentation: [], dailyReports: [], createdDate: new Date(), goals: [], issues: [], tasks: [],
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
        git_repo: payload.git_repo,
        techStack: payload.techStack, weeklyHours: [0, 0, 0, 0, 0, 0, 0],
        monthlyHours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        learningPoints: 0, learningEntries: [],
        gitMetrics: { commitsByDay: [0, 0, 0, 0, 0, 0, 0], pullRequests: 0, mergedPRs: 0, codeReviews: 0, commitMessages: [], languages: {}, commitTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        documentation: [], dailyReports: [], createdDate: new Date(), goals: [], issues: [], tasks: [],
      };
      setProjects(prev => [...prev, newProject]);
      addToast(`Project created locally (API error)`, "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      if (syncStatus === "synced") {
        refreshDashboardStats(true);
      }
      setSaving(false);
      setShowNewProject(false);
    }
  }, [syncStatus, addToast, refreshDashboardStats]);

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
          techStack: dto.techStack, git_repo: dto.git_repo, weeklyHours: dto.weeklyHours,
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
      if (syncStatus === "synced") {
        refreshDashboardStats(true);
      }
      setSaving(false);
    }
  }, [syncStatus, addToast, refreshDashboardStats]);

  const handleExportProject = useCallback(async (projectId: number): Promise<boolean> => {
    try {
      let dto: ProjectDTO | null = null;
      try {
        const response = await projectsApi.get(projectId);
        dto = extractProjectDto(response);
      } catch (err) {
        console.warn("Project export fetch failed, using local data:", err);
        const local = projects.find((p) => p.id === projectId);
        if (local) dto = projectToDto(local);
      }

      if (!dto) {
        addToast("Unable to load project data for export", "error");
        return false;
      }

      downloadProjectExcel(dto);
      addToast("Project converted and downloaded as Excel", "success");
      return true;
    } catch (err) {
      console.error("Export project error:", err);
      addToast("Failed to export project data", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
      return false;
    }
  }, [projects, addToast]);

  const handleCreateLearning = useCallback(async (projectId: number, payload: CreateLearningEntryPayload) => {
    setSaving(true);
    let created: LearningEntryDTO = { id: Date.now(), ...payload };
    let apiSynced = syncStatus === "synced";
    try {
      if (syncStatus === "synced") {
        const response = await learningApi.create(projectId, payload);
        created = response.data;
      }
    } catch (err) {
      apiSynced = false;
      console.error("Create learning error:", err);
      addToast("Learning saved locally (API sync failed)", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      const now = new Date();
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
              ...p,
              learningEntries: [...p.learningEntries, created],
              learningPoints: p.learningPoints + payload.difficulty * 40,
              lastActive: now,
            }
            : p,
        ),
      );
      setSelectedProject((prev) =>
        prev && prev.id === projectId
          ? {
            ...prev,
            learningEntries: [...prev.learningEntries, created],
            learningPoints: prev.learningPoints + payload.difficulty * 40,
            lastActive: now,
          }
          : prev,
      );
      if (apiSynced || syncStatus !== "synced") {
        addToast(apiSynced ? "Learning entry added (synced)" : "Learning entry added (offline)", "success");
      }
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  const handleCreateReport = useCallback(async (projectId: number, payload: CreateDailyReportPayload) => {
    setSaving(true);
    let created: DailyReportDTO = { id: Date.now(), ...payload };
    let apiSynced = syncStatus === "synced";
    try {
      if (syncStatus === "synced") {
        const response = await reportsApi.create(projectId, payload);
        created = response.data;
      }
    } catch (err) {
      apiSynced = false;
      console.error("Create report error:", err);
      addToast("Report saved locally (API sync failed)", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      const dayOfWeek = new Date(payload.date).getDay();
      const weekIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const now = new Date();
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const newWeekly = [...p.weeklyHours];
          newWeekly[weekIdx] += payload.hoursWorked;
          return {
            ...p,
            dailyReports: [...p.dailyReports, created],
            totalHours: p.totalHours + payload.hoursWorked,
            completedTasks: p.completedTasks + payload.tasksDone,
            weeklyHours: newWeekly,
            activeDays: p.activeDays + 1,
            lastActive: now,
          };
        }),
      );
      setSelectedProject((prev) => {
        if (!prev || prev.id !== projectId) return prev;
        const newWeekly = [...prev.weeklyHours];
        newWeekly[weekIdx] += payload.hoursWorked;
        return {
          ...prev,
          dailyReports: [...prev.dailyReports, created],
          totalHours: prev.totalHours + payload.hoursWorked,
          completedTasks: prev.completedTasks + payload.tasksDone,
          weeklyHours: newWeekly,
          activeDays: prev.activeDays + 1,
          lastActive: now,
        };
      });
      if (apiSynced || syncStatus !== "synced") {
        addToast(apiSynced ? "Report added (synced)" : "Report added (offline)", "success");
      }
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  const handleCreateDoc = useCallback(async (projectId: number, payload: CreateDocumentPayload) => {
    setSaving(true);
    const wordCount = payload.content.trim().split(/\s+/).length;
    const sections = Math.max(1, payload.content.split("\n\n").filter((s) => s.trim()).length);
    let created: DocumentationDTO = { id: Date.now(), ...payload, wordCount, sections };
    let apiSynced = syncStatus === "synced";
    try {
      if (syncStatus === "synced") {
        const response = await docsApi.create(projectId, payload);
        created = response.data;
      }
    } catch (err) {
      apiSynced = false;
      console.error("Create document error:", err);
      addToast("Document saved locally (API sync failed)", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      const now = new Date();
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, documentation: [...p.documentation, created], lastActive: now } : p,
        ),
      );
      setSelectedProject((prev) =>
        prev && prev.id === projectId
          ? { ...prev, documentation: [...prev.documentation, created], lastActive: now }
          : prev,
      );
      if (apiSynced || syncStatus !== "synced") {
        addToast(apiSynced ? "Document added (synced)" : "Document added (offline)", "success");
      }
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  const handleUpdateDoc = useCallback(async (projectId: number, doc: DocumentationDTO) => {
    setSaving(true);
    const payload = {
      title: doc.title,
      content: doc.content,
      status: doc.status,
      date: doc.date,
    };

    const wordCount = doc.content.trim().split(/\s+/).length;
    const sections = Math.max(1, doc.content.split("\n\n").filter((s) => s.trim()).length);
    let updated: DocumentationDTO = { ...doc, wordCount, sections };
    let apiSynced = syncStatus === "synced";

    try {
      if (syncStatus === "synced") {
        const response = await docsApi.update(projectId, doc.id, payload);
        updated = response.data;
      }
    } catch (err) {
      apiSynced = false;
      console.error("Update document error:", err);
      addToast("Document updated locally (API sync failed)", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      const now = new Date();
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
              ...p,
              documentation: p.documentation.map((d) => (d.id === doc.id ? updated : d)),
              lastActive: now,
            }
            : p,
        ),
      );
      setSelectedProject((prev) =>
        prev && prev.id === projectId
          ? {
            ...prev,
            documentation: prev.documentation.map((d) => (d.id === doc.id ? updated : d)),
            lastActive: now,
          }
          : prev,
      );
      if (apiSynced || syncStatus !== "synced") {
        addToast(apiSynced ? "Document updated (synced)" : "Document updated (offline)", "success");
      }
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  const handleCreateGoal = useCallback(async (projectId: number, payload: CreateGoalPayload) => {
    setSaving(true);
    let created: GoalDTO = {
      id: Date.now(),
      ...payload,
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as GoalDTO;
    let apiSynced = syncStatus === "synced";
    try {
      if (syncStatus === "synced") {
        const response = await goalsApi.create(projectId, payload);
        created = response.data;
      }
    } catch (err) {
      apiSynced = false;
      console.error("Create goal error:", err);
      addToast("Goal saved locally (API sync failed)", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, goals: [...p.goals, created] } : p)),
      );
      setSelectedProject((prev) =>
        prev && prev.id === projectId ? { ...prev, goals: [...prev.goals, created] } : prev,
      );
      if (apiSynced || syncStatus !== "synced") {
        addToast(apiSynced ? "Goal added (synced)" : "Goal added (offline)", "success");
      }
      setSaving(false);
    }
  }, [syncStatus, addToast]);

  const handleCreateIssue = useCallback(async (projectId: number, payload: CreateIssuePayload) => {
    setSaving(true);
    let created: IssueDTO = { id: Date.now(), ...payload, dateCreated: new Date().toISOString(), projectId };
    let apiSynced = syncStatus === "synced";
    try {
      if (syncStatus === "synced") {
        const response = await issuesApi.create(projectId, payload);
        created = response.data;
      }
    } catch (err) {
      apiSynced = false;
      console.error("Create issue error:", err);
      addToast("Issue saved locally (API sync failed)", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, issues: [...(p.issues || []), created] } : p)),
      );
      setSelectedProject((prev) =>
        prev && prev.id === projectId ? { ...prev, issues: [...(prev.issues || []), created] } : prev,
      );
      if (apiSynced || syncStatus !== "synced") {
        addToast(apiSynced ? "Issue added (synced)" : "Issue added (offline)", "success");
      }
      if (apiSynced) {
        refreshDashboardStats(true);
      }
      setSaving(false);
    }
  }, [syncStatus, addToast, refreshDashboardStats]);

  const handleUpdateIssue = useCallback(async (projectId: number, issue: IssueDTO) => {
    setSaving(true);
    let apiSynced = syncStatus === "synced";
    try {
      if (syncStatus === "synced") {
        await issuesApi.update(projectId, issue.id, {
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
        });
      }
    } catch (err) {
      apiSynced = false;
      console.error("Update issue error:", err);
      addToast("Issue updated locally (API sync failed)", "error");
      if (err instanceof NetworkError) setSyncStatus("offline");
    } finally {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, issues: p.issues.map((i) => (i.id === issue.id ? issue : i)) }
            : p,
        ),
      );
      setSelectedProject((prev) =>
        prev && prev.id === projectId
          ? { ...prev, issues: prev.issues.map((i) => (i.id === issue.id ? issue : i)) }
          : prev,
      );
      if (apiSynced || syncStatus !== "synced") {
        addToast(apiSynced ? "Issue updated (synced)" : "Issue updated (offline)", "success");
      }
      if (apiSynced) {
        refreshDashboardStats(true);
      }
      setSaving(false);
    }
  }, [syncStatus, addToast, refreshDashboardStats]);

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
      if (syncStatus === "synced") {
        refreshDashboardStats(true);
      }
    }
  }, [syncStatus, selectedProject, addToast, refreshDashboardStats]);

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

  const handleDeleteIssue = useCallback(async (projectId: number, issueId: number) => {
    try {
      if (syncStatus === "synced") {
        await issuesApi.delete(projectId, issueId);
      }
    } catch (err) { console.error(err); if (err instanceof NetworkError) setSyncStatus("offline"); }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, issues: (p.issues || []).filter(i => i.id !== issueId) } : p));
    setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, issues: (prev.issues || []).filter(i => i.id !== issueId) } : prev);
    addToast("Issue deleted", "info");
    if (syncStatus === "synced") {
      refreshDashboardStats(true);
    }
  }, [syncStatus, addToast, refreshDashboardStats]);

  const handleCreateTask = useCallback(async (projectId: number, payload: CreateTaskPayload) => {
    setSaving(true);
    const now = new Date().toISOString();
    let created: TaskDTO = {
      id: Date.now(),
      projectId,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      status: payload.status || "todo",
      priority: payload.priority,
      storyPoints: payload.storyPoints,
      complexityScore: payload.complexityScore,
      createdBy: payload.createdBy,
      assignedTo: payload.assignedTo,
      reviewerId: payload.reviewerId,
      sprintId: payload.sprintId,
      milestoneId: payload.milestoneId,
      estimatedHours: payload.estimatedHours,
      actualHours: payload.actualHours,
      commitCount: payload.commitCount ?? 0,
      linesAdded: payload.linesAdded ?? 0,
      linesRemoved: payload.linesRemoved ?? 0,
      filesChanged: payload.filesChanged ?? 0,
      branchName: payload.branchName,
      pullRequestId: payload.pullRequestId,
      riskLevel: payload.riskLevel,
      impactLevel: payload.impactLevel,
      dateCreated: now,
      dateUpdated: now,
      startDate: payload.startDate,
      dueDate: payload.dueDate,
      completedAt: payload.completedAt ?? ((payload.status || "todo") === "completed" ? now : undefined),
    };
    try {
      if (syncStatus === "synced") {
        const response = await tasksApi.create(projectId, payload);
        created = response.data;
      }
    } catch (err) { console.error(err); if (err instanceof NetworkError) setSyncStatus("offline"); }
    finally {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, tasks: [...(p.tasks || []), created] } : p));
      setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, tasks: [...(prev.tasks || []), created] } : prev);
      if (syncStatus === "synced") {
        refreshDashboardStats(true);
      }
      setSaving(false);
    }
  }, [syncStatus, refreshDashboardStats]);

  const handleUpdateTask = useCallback(async (projectId: number, task: TaskDTO) => {
    const normalizedCompletedAt = task.status === "completed"
      ? (task.completedAt ?? new Date().toISOString())
      : null;
    try {
      if (syncStatus === "synced") {
        await tasksApi.update(projectId, task.id, {
          title: task.title,
          description: task.description ?? null,
          type: task.type ?? null,
          status: task.status,
          priority: task.priority ?? null,
          storyPoints: task.storyPoints ?? null,
          complexityScore: task.complexityScore ?? null,
          createdBy: task.createdBy ?? null,
          assignedTo: task.assignedTo ?? null,
          reviewerId: task.reviewerId ?? null,
          sprintId: task.sprintId ?? null,
          milestoneId: task.milestoneId ?? null,
          estimatedHours: task.estimatedHours ?? null,
          actualHours: task.actualHours ?? null,
          commitCount: task.commitCount ?? 0,
          linesAdded: task.linesAdded ?? 0,
          linesRemoved: task.linesRemoved ?? 0,
          filesChanged: task.filesChanged ?? 0,
          branchName: task.branchName ?? null,
          pullRequestId: task.pullRequestId ?? null,
          riskLevel: task.riskLevel ?? null,
          impactLevel: task.impactLevel ?? null,
          startDate: task.startDate ?? null,
          dueDate: task.dueDate ?? null,
          completedAt: normalizedCompletedAt,
        });
      }
    } catch (err) { console.error(err); if (err instanceof NetworkError) setSyncStatus("offline"); }
    const nextTask: TaskDTO = {
      ...task,
      dateUpdated: new Date().toISOString(),
      completedAt: normalizedCompletedAt ?? undefined,
    };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, tasks: p.tasks.map(t => t.id === task.id ? nextTask : t) } : p));
    setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, tasks: prev.tasks.map(t => t.id === task.id ? nextTask : t) } : prev);
    if (syncStatus === "synced") {
      refreshDashboardStats(true);
    }
  }, [syncStatus, refreshDashboardStats]);

  const handleDeleteTask = useCallback(async (projectId: number, taskId: number) => {
    try {
      if (syncStatus === "synced") {
        await tasksApi.delete(projectId, taskId);
      }
    } catch (err) { console.error(err); if (err instanceof NetworkError) setSyncStatus("offline"); }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p));
    setSelectedProject(prev => prev && prev.id === projectId ? { ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) } : prev);
    if (syncStatus === "synced") {
      refreshDashboardStats(true);
    }
  }, [syncStatus, refreshDashboardStats]);

  const handleUpdateGoal = useCallback(async (projectId: number, goal: GoalDTO) => {
    try {
      if (syncStatus === "synced") {
        await goalsApi.update(projectId, goal.id, {
          title: goal.title,
          target: goal.target,
          current: goal.current,
          category: goal.category,
          comments: goal.comments,
          status: goal.status,
          hoursSpent: goal.hoursSpent,
          issueIds: goal.issueIds,
          reportIds: goal.reportIds,
          taskIds: goal.taskIds,
        });
      }
    } catch (err) {
      console.error(err);
      if (err instanceof NetworkError) setSyncStatus("offline");
      addToast("Saved goal locally (API sync failed)", "error");
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, goals: p.goals.map((g) => (g.id === goal.id ? goal : g)) } : p,
      ),
    );
    setSelectedProject((prev) =>
      prev && prev.id === projectId
        ? { ...prev, goals: prev.goals.map((g) => (g.id === goal.id ? goal : g)) }
        : prev,
    );
    addToast("Goal updated", "success");
  }, [syncStatus, addToast]);

  const handleSaveApiSettings = useCallback(async () => {
    const nextUrl = settingsApiUrl.trim();
    if (!nextUrl) {
      addToast("Please enter a valid API URL", "error");
      return;
    }

    setApiBaseUrl(nextUrl);
    localStorage.setItem("pulseiq_api_base_url", nextUrl);
    await connectToApi(nextUrl);
    addToast("API settings saved", "success");
  }, [settingsApiUrl, connectToApi, addToast]);

  // ── Computed values ─────────────────────────────────────────────────────────
  const totalHours = projects?.reduce((a, p) => a + (p.totalHours || 0), 0) || 0;
  const totalCommits = projects?.reduce((a, p) => a + (p.commits || 0), 0) || 0;
  const totalLearning = projects?.reduce((a, p) => a + (p.learningPoints || 0), 0) || 0;
  const projectCount = dashboardStats?.totalProjects ?? (projects?.length || 0);
  const dashboardTotalHours = dashboardStats?.totalHours ?? totalHours;
  const dashboardTotalCommits = dashboardStats?.totalCommits ?? totalCommits;
  const dashboardTotalLearning = dashboardStats?.totalLearningPoints ?? totalLearning;
  // const totalPRs = projects?.reduce((a, p) => a + (p.gitMetrics?.pullRequests || 0), 0) || 0;
  const overallProductivity = projects && projects.length > 0
    ? Math.round(projects.reduce((a, p) => a + calcProductivityScore(p), 0) / projects.length)
    : 0;
  const skillDist = dashboardStats?.skillDistribution || getSkillDistribution(projects || []);
  const sortedSkills = Object.entries(skillDist).sort((a, b) => b[1] - a[1]);
  const strongestSkill = dashboardStats?.strongestSkill || sortedSkills[0]?.[0] || null;
  // const weakestSkill = sortedSkills[sortedSkills.length - 1];
  const totalLearningEntries = dashboardStats?.totalLearningEntries
    ?? (projects?.reduce((a, p) => a + (p.learningEntries?.length || 0), 0) || 0);
  const totalDocs = dashboardStats?.totalDocs
    ?? (projects?.reduce((a, p) => a + (p.documentation?.length || 0), 0) || 0);
  const totalDailyReports = dashboardStats?.totalDailyReports
    ?? (projects?.reduce((a, p) => a + (p.dailyReports?.length || 0), 0) || 0);
  const totalTaskCount = dashboardStats?.totalTaskCount
    ?? (projects?.reduce((a, p) => a + (p.tasks?.length || 0), 0) || 0);
  const completedTaskCount = dashboardStats?.completedTaskCount
    ?? (projects?.reduce((a, p) => a + ((p.tasks || []).filter((t) => t.status === "completed").length), 0) || 0);
  const pendingTaskCount = Math.max(0, totalTaskCount - completedTaskCount);
  const totalIssueCount = dashboardStats?.totalIssueCount
    ?? (projects?.reduce((a, p) => a + (p.issues?.length || 0), 0) || 0);
  const completedIssueCount = dashboardStats?.completedIssueCount
    ?? (projects?.reduce(
      (a, p) => a + ((p.issues || []).filter((i) => i.status === "resolved" || i.status === "closed").length),
      0,
    ) || 0);
  const pendingIssueCount = Math.max(0, totalIssueCount - completedIssueCount);
  const localProjectWorkload = (projects || [])
    .map((project) => {
      const taskCount = project.tasks?.length || 0;
      const completedTasks = (project.tasks || []).filter((task) => task.status === "completed").length;
      const pendingTasks = Math.max(0, taskCount - completedTasks);
      const issueCount = project.issues?.length || 0;
      const completedIssues = (project.issues || []).filter(
        (issue) => issue.status === "resolved" || issue.status === "closed",
      ).length;
      const pendingIssues = Math.max(0, issueCount - completedIssues);
      const totalItems = taskCount + issueCount;
      const completedItems = completedTasks + completedIssues;

      return {
        projectId: project.id,
        name: project.name,
        category: project.category,
        totalTaskCount: taskCount,
        completedTaskCount: completedTasks,
        pendingTaskCount: pendingTasks,
        totalIssueCount: issueCount,
        completedIssueCount: completedIssues,
        pendingIssueCount: pendingIssues,
        totalPending: pendingTasks + pendingIssues,
        completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        riskLevel: pendingTasks + pendingIssues >= 10 ? "high" : pendingTasks + pendingIssues >= 4 ? "medium" : "low",
      };
    })
    .sort((a, b) => b.totalPending - a.totalPending);
  const projectWorkload = dashboardStats?.projectWorkload && dashboardStats.projectWorkload.length > 0
    ? dashboardStats.projectWorkload
    : localProjectWorkload;
  const pendingProjects = projectWorkload.filter((entry) => entry.totalPending > 0);
  const cleanProjectsCount = Math.max(0, projectCount - pendingProjects.length);
  const topBacklogProject = pendingProjects[0] || null;
  const totalWorkItems = totalTaskCount + totalIssueCount;
  const totalCompletedItems = completedTaskCount + completedIssueCount;
  const backlogCompletionRate = totalWorkItems > 0
    ? Math.round((totalCompletedItems / totalWorkItems) * 100)
    : 0;
  const projectsWithPendingPercent = projectCount > 0
    ? Math.round((pendingProjects.length / projectCount) * 100)
    : 0;
  const avgPendingAcrossActiveProjects = dashboardStats?.avgPendingAcrossActiveProjects !== undefined
    ? dashboardStats.avgPendingAcrossActiveProjects.toFixed(1)
    : pendingProjects.length > 0
      ? (pendingProjects.reduce((sum, item) => sum + item.totalPending, 0) / pendingProjects.length).toFixed(1)
      : "0.0";

  const filteredByStatus = !projects ? [] : (
    filter === "all" ? projects :
      filter === "active" ? projects.filter(p => calcHealth(p) === "green") :
        filter === "warning" ? projects.filter(p => calcHealth(p) !== "green") :
          projects
  );

  const filteredProjects = categoryFilter === "all"
    ? filteredByStatus
    : filteredByStatus.filter((p) => p.category === categoryFilter);

  const navItems = [
    { id: "dashboard", label: "Dashboard", emoji: "🏠" },
    { id: "projects", label: "Projects", emoji: "📁" },
    { id: "goals", label: "Goals", emoji: "🎯" },
    { id: "learning", label: "Learning", emoji: "🧠" },
    { id: "reports", label: "Reports", emoji: "📅" },
  ];

  if (loading) return <Spinner />;

  return (
    <div style={{ minHeight: "100vh", background: "#050510", color: "#ccc", fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif", padding: "0 0 80px" }}>
      {/* Header */}
      <header style={{ height: 60, background: "#08081a", borderBottom: "1px solid #111122", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #00FFB2 0%, #38BDF8 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#000", fontSize: 14 }}>IQ</div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: -0.5, color: "#fff", cursor: "pointer" }} onClick={() => { setView("dashboard"); setSelectedProject(null); }}>PulseIQ <span style={{ color: "#38BDF8", fontSize: 10, fontWeight: 400, marginLeft: 6 }}>v2.4</span></h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <nav style={{ display: "flex", gap: 4 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setSelectedProject(null); }}
                style={{ background: view === item.id ? "#111122" : "transparent", border: "none", color: view === item.id ? "#fff" : "#666", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: view === item.id ? 600 : 400, transition: "0.2s" }}>
                <span style={{ marginRight: 6 }}>{item.emoji}</span>{item.label}
              </button>
            ))}
          </nav>
          <div style={{ height: 24, width: 1, background: "#1a1a2e" }} />
          <SyncBadge status={syncStatus} onRetry={() => setShowApiConfig(true)} />
          <button
            onClick={() => {
              setView("settings");
              setSelectedProject(null);
            }}
            title="Open settings"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid #1a1a2e",
              background: view === "settings" ? "#111122" : "transparent",
              color: view === "settings" ? "#38BDF8" : "#777",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            ⚙
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            saving={saving}
            fetchingGit={fetchingGitProjectId === selectedProject.id}
            onClose={() => setSelectedProject(null)}
            onSave={handleUpdateProject}
            onCreateLearning={handleCreateLearning}
            onCreateReport={handleCreateReport}
            onCreateDoc={handleCreateDoc}
            onUpdateDoc={handleUpdateDoc}
            onCreateGoal={handleCreateGoal}
            onCreateIssue={handleCreateIssue}
            onExportProject={handleExportProject}
            onFetchGitData={handleFetchGitData}
            onUpdateGoal={handleUpdateGoal}
            onUpdateIssue={handleUpdateIssue}
            onDeleteLearning={handleDeleteLearning}
            onDeleteReport={handleDeleteReport}
            onDeleteDoc={handleDeleteDoc}
            onDeleteGoal={handleDeleteGoal}
            onDeleteIssue={handleDeleteIssue}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        ) : view === "dashboard" ? (
          <div>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: 28, color: "#fff", fontWeight: 800 }}>Welcome Back, Dev</h2>
                <p style={{ margin: 0, color: "#555", fontFamily: "monospace", fontSize: 12 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setShowNewProject(true)}
                  style={{ background: "#00FFB2", color: "#000", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(0, 255, 178, 0.2)" }}>
                  <span style={{ fontSize: 18 }}>+</span> New Project
                </button>
                <button onClick={() => setShowDashboardReports(true)}
                  style={{ background: "#38BDF8", color: "#000", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(56, 189, 248, 0.2)" }}>
                  <span style={{ fontSize: 18 }}>📅</span> Add Reports
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
              <StatCard label="Total Effort" value={`${dashboardTotalHours}h`} sub={`${projectCount} projects`} accent="#00FFB2" />
              <StatCard label="Code Velocity" value={dashboardTotalCommits} sub="total commits" accent="#38BDF8" />
              <StatCard label="Skill Growth" value={dashboardTotalLearning} sub="learning points" accent="#A78BFA" />
              <StatCard label="Dev Pulse" value={`${overallProductivity}%`} sub="avg score" accent="#FF6B35" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
              <StatCard label="Open Workload" value={pendingTaskCount + pendingIssueCount} sub="pending tasks + issues" accent="#FFD700" />
              <StatCard label="Projects With Pending" value={`${pendingProjects.length}/${projectCount}`} sub={`${projectsWithPendingPercent}% of portfolio`} accent="#FF6B35" />
              <StatCard label="Backlog Completion" value={`${backlogCompletionRate}%`} sub={`${totalCompletedItems}/${totalWorkItems} items done`} accent="#38BDF8" />
              <StatCard
                label="Top Blocked Project"
                value={topBacklogProject ? topBacklogProject.name : "None"}
                sub={topBacklogProject ? `${topBacklogProject.totalPending} open items` : "No pending workload"}
                accent="#FF4444"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, 1fr)", gap: 24 }}>
              <div style={{ background: "#080810", border: "1px solid #111122", borderRadius: 16, padding: 20, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: "#e0e0e0", fontFamily: "monospace" }}>Pending Work By Project</h3>
                  <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>{pendingProjects.length} projects need attention</span>
                </div>

                {pendingProjects.length === 0 ? (
                  <div style={{ border: "1px dashed #1a1a2e", borderRadius: 12, padding: "28px 20px", textAlign: "center", color: "#555", fontSize: 13 }}>
                    All tracked projects are clear. No pending tasks or issues.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {pendingProjects.slice(0, 8).map((entry) => {
                      const linkedProject = projects.find((project) => project.id === entry.projectId) || null;
                      const level = entry.riskLevel || (entry.totalPending >= 10 ? "high" : entry.totalPending >= 4 ? "medium" : "low");
                      const levelColor = level === "high" ? "#FF4444" : level === "medium" ? "#FFD700" : "#00FFB2";
                      return (
                        <button
                          key={entry.projectId}
                          onClick={() => {
                            if (linkedProject) setSelectedProject(linkedProject);
                          }}
                          style={{
                            border: "1px solid #1a1a2e",
                            borderRadius: 12,
                            padding: "12px 14px",
                            background: "#0d0d1a",
                            display: "grid",
                            gridTemplateColumns: "minmax(160px, 1.4fr) repeat(4, minmax(60px, 0.6fr))",
                            gap: 10,
                            alignItems: "center",
                            color: "#d7d7d7",
                            textAlign: "left",
                            cursor: linkedProject ? "pointer" : "default",
                            opacity: linkedProject ? 1 : 0.85,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{entry.name}</div>
                            <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>{entry.category}</div>
                          </div>
                          <div style={{ fontSize: 11, color: "#888" }}>
                            <div style={{ color: "#666", marginBottom: 2 }}>TASKS</div>
                            <strong style={{ color: "#38BDF8" }}>{entry.pendingTaskCount}</strong>
                          </div>
                          <div style={{ fontSize: 11, color: "#888" }}>
                            <div style={{ color: "#666", marginBottom: 2 }}>ISSUES</div>
                            <strong style={{ color: "#A78BFA" }}>{entry.pendingIssueCount}</strong>
                          </div>
                          <div style={{ fontSize: 11, color: "#888" }}>
                            <div style={{ color: "#666", marginBottom: 2 }}>TOTAL</div>
                            <strong style={{ color: "#FFD700" }}>{entry.totalPending}</strong>
                          </div>
                          <div style={{ fontSize: 11, color: "#888" }}>
                            <div style={{ color: "#666", marginBottom: 2 }}>RISK</div>
                            <strong style={{ color: levelColor, textTransform: "uppercase" }}>{level}</strong>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "#080810", border: "1px solid #111122", borderRadius: 16, padding: 20 }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#e0e0e0", fontFamily: "monospace" }}>Workload Signals</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>AVERAGE OPEN ITEMS / ACTIVE PROJECT</div>
                      <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 15 }}>{avgPendingAcrossActiveProjects}</div>
                    </div>
                    <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>PROJECTS CLEAR OF BACKLOG</div>
                      <div style={{ color: "#00FFB2", fontWeight: 700, fontSize: 15 }}>{cleanProjectsCount}</div>
                    </div>
                    <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>KNOWLEDGE & DOCUMENTATION</div>
                      <div style={{ color: "#A78BFA", fontWeight: 700, fontSize: 15 }}>{totalLearningEntries} logs, {totalDocs} docs</div>
                    </div>
                    <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>STRONGEST SKILL</div>
                      <div style={{ color: "#38BDF8", fontWeight: 700, fontSize: 15 }}>{strongestSkill || "None"}</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: "#080810", border: "1px solid #111122", borderRadius: 16, padding: 20 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#e0e0e0", fontFamily: "monospace", textAlign: "center" }}>Skill Distribution</h3>
                  <SkillRadar projects={projects} distribution={dashboardStats?.skillDistribution} />
                </div>
              </div>
            </div>
          </div>
        ) : view === "projects" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: 24, color: "#fff", fontWeight: 800 }}>My Projects</h2>
                <p style={{ margin: 0, color: "#555", fontFamily: "monospace", fontSize: 12 }}>{projects.length} Total Projects</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["all", "active", "warning"].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ background: filter === f ? "#111122" : "transparent", border: `1px solid ${filter === f ? "#00FFB244" : "#1a1a2e"}`, color: filter === f ? "#00FFB2" : "#555", padding: "8px 16px", borderRadius: 8, fontSize: 12, cursor: "pointer", textTransform: "uppercase", fontWeight: 600 }}>{f}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {filteredProjects.map(p => (
                <ProjectCard key={p.id} project={p} onClick={setSelectedProject} onDelete={handleDeleteProject} onExport={handleExportProject} />
              ))}
              {filteredProjects.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "100px 0", border: "1px dashed #1a1a2e", borderRadius: 20, color: "#444" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                  No projects match your filter.
                </div>
              )}
            </div>
          </div>
        ) : view === "goals" ? (
          <GoalsPage
            projects={projects}
            syncStatus={syncStatus}
            onUpdateProject={handleUpdateProject}
            addToast={addToast}
          />
        ) : view === "settings" ? (
          <div style={{ maxWidth: 720 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 24, color: "#fff", fontWeight: 800 }}>Settings</h2>
            <p style={{ margin: "0 0 24px", color: "#666", fontFamily: "monospace", fontSize: 12 }}>
              Configure app connectivity and environment options.
            </p>

            <div style={{ background: "#080810", border: "1px solid #111122", borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 15 }}>API Connection</h3>
              <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "#888", fontFamily: "monospace" }}>
                API Base URL
              </label>
              <input
                value={settingsApiUrl}
                onChange={(e) => setSettingsApiUrl(e.target.value)}
                placeholder="http://localhost:3001/api"
                style={{
                  width: "100%",
                  background: "#050510",
                  color: "#fff",
                  border: "1px solid #1a1a2e",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 13,
                  marginBottom: 14,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                <button
                  onClick={handleSaveApiSettings}
                  style={{
                    background: "#00FFB2",
                    color: "#000",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save & Connect
                </button>
                <button
                  onClick={() => setShowApiConfig(true)}
                  style={{
                    background: "transparent",
                    color: "#38BDF8",
                    border: "1px solid #1a1a2e",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Advanced Config
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#777", fontFamily: "monospace" }}>
                Current status: <span style={{ color: syncStatus === "synced" ? "#00FFB2" : syncStatus === "syncing" ? "#38BDF8" : "#FFD700" }}>{syncStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "100px 0", color: "#444" }}>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>{view.charAt(0).toUpperCase() + view.slice(1)} View</h2>
            <p>This section is being refactored. Check individual project details for full data.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, maxWidth: 1000, margin: "40px auto" }}>
              <div style={{ background: "#080810", border: "1px solid #1a1a2e", borderRadius: 16, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 24, color: "#fff", fontWeight: 800 }}>{totalDailyReports}</div>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1.5 }}>Reports</div>
              </div>
              <div style={{ background: "#080810", border: "1px solid #1a1a2e", borderRadius: 16, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                <div style={{ fontSize: 24, color: "#fff", fontWeight: 800 }}>{totalDocs}</div>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1.5 }}>Documents</div>
              </div>
              <div style={{ background: "#080810", border: "1px solid #1a1a2e", borderRadius: 16, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
                <div style={{ fontSize: 24, color: "#fff", fontWeight: 800 }}>{totalLearningEntries}</div>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1.5 }}>Learning Logs</div>
              </div>
            </div>
          </div>
        )
        }
      </main >

      {/* Emi Chatbot */}
      < div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        {showEmiChat && (
          <div style={{ width: 350, height: 480, background: "#08081a", border: "1px solid #1a1a2e", borderRadius: 20, marginBottom: 16, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #0d0d1a 0%, #111122 100%)", borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: syncStatus === "synced" ? "#00FFB2" : "#FFD700" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>emi <span style={{ fontWeight: 400, color: "#38BDF8", fontSize: 10 }}>AI Assistant</span></div>
                <div style={{ fontSize: 9, color: "#555", fontFamily: "monospace" }}>{syncStatus === "synced" ? "CONNECTED" : "OFFLINE MODE"}</div>
              </div>
              <button onClick={() => setShowEmiChat(false)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#444", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {emiMessages.map(m => (
                <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                  <div style={{ padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px", background: m.role === "user" ? "#38BDF8" : "#111122", color: m.role === "user" ? "#000" : "#ccc", fontSize: 13, lineHeight: 1.5 }}>{m.text}</div>
                </div>
              ))}
              {emiSending && (
                <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "16px 16px 16px 2px", background: "#111122", display: "flex", gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#444", animation: "pulse 1s infinite" }} />
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#444", animation: "pulse 1s infinite 0.2s" }} />
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#444", animation: "pulse 1s infinite 0.4s" }} />
                </div>
              )}
              <div ref={emiEndRef} />
            </div>
            <div style={{ padding: 16, borderTop: "1px solid #1a1a2e", display: "flex", gap: 8 }}>
              <input value={emiInput} onChange={e => setEmiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendEmiMessage()} placeholder="Ask emi anything..."
                style={{ flex: 1, background: "#050510", border: "1px solid #1a1a2e", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
              <button onClick={sendEmiMessage} disabled={!emiInput.trim() || emiSending}
                style={{ background: "#38BDF8", border: "none", width: 34, height: 34, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (!emiInput.trim() || emiSending) ? 0.5 : 1 }}>
                <span style={{ color: "#000", fontWeight: 900 }}>→</span>
              </button>
            </div>
          </div>
        )}
        <button onClick={() => setShowEmiChat(!showEmiChat)}
          style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #38BDF8 0%, #A78BFA 100%)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(56, 189, 248, 0.4)", transition: "0.3s" }}>
          <span style={{ fontSize: 24 }}>{showEmiChat ? "✕" : "💬"}</span>
        </button>
      </div >

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Modals */}
      {
        showNewProject && (
          <AddProjectModal
            saving={saving}
            onClose={() => setShowNewProject(false)}
            onSave={handleCreateProject}
          />
        )
      }
{
        showApiConfig && (
          <ApiConfigModal
            currentUrl={apiBaseUrl}
            onClose={() => setShowApiConfig(false)}
            onSave={(url) => {
              setApiBaseUrl(url);
              localStorage.setItem("pulseiq_api_base_url", url);
              connectToApi(url);
            }}
          />
        )
      }
      {
        showDashboardReports && (
          <DashboardReports
            projects={projects}
            onClose={() => setShowDashboardReports(false)}
            onSave={handleCreateReport}
            saving={saving}
          />
        )
      }
    </div >
  );
}

export default App;
