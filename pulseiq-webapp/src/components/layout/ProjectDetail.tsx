import { useState, useEffect } from "react";
import {
    type Project,
} from "../../types";
import {
    type GoalDTO,
    type CreateLearningEntryPayload,
    type CreateDailyReportPayload,
    type CreateDocumentPayload,
    type CreateGoalPayload,
    type CreateIssuePayload,
    type IssueDTO,
    type TaskDTO,
} from "../../api";
import {
    calcHealth,
    calcCompletion,
    calcProductivityScore,
    calcLearningIntensity,
    calcMomentum,
    getBurnoutRisk,
    getProjectWeeklyActivity,
} from "../../utils/analytics";
import { HealthDot } from "../common/HealthDot";
import { CircleProgress } from "../common/CircleProgress";
import { StatCard } from "../common/StatCard";
import { WeeklyChart } from "../common/WeeklyChart";
import { MiniBar } from "../common/MiniBar";
import { GitMetricsView } from "../features/GitMetricsView";
import { AddLearningModal } from "../modals/AddLearningModal";
import { AddDailyReportModal } from "../modals/AddDailyReportModal";
import { AddDocumentModal } from "../modals/AddDocumentModal";
import { AddGoalModal } from "../modals/AddGoalModal";
import { EditGoalModal } from "../modals/EditGoalModal";
import { AddIssueModal } from "../modals/AddIssueModal";
import { EditIssueModal } from "../modals/EditIssueModal";
import { inputStyle } from "../../constants";

export function ProjectDetail({
    project,
    onClose,
    onSave,
    onCreateLearning,
    onCreateReport,
    onCreateDoc,
    onCreateGoal,
    onExportProject,
    onFetchGitData,
    onUpdateGoal,
    onDeleteLearning,
    onDeleteReport,
    onDeleteDoc,
    onDeleteGoal,
    onDeleteIssue,
    saving,
    fetchingGit,
    onUpdateIssue,
    onCreateIssue,
    onCreateTask,
    onUpdateTask,
    onDeleteTask,
}: {
    project: Project;
    onClose: () => void;
    onSave: (updated: Project) => void;
    onCreateLearning: (projectId: number, payload: CreateLearningEntryPayload) => void;
    onCreateReport: (projectId: number, payload: CreateDailyReportPayload) => void;
    onCreateDoc: (projectId: number, payload: CreateDocumentPayload) => void;
    onCreateGoal: (projectId: number, payload: CreateGoalPayload) => void;
    onCreateIssue: (projectId: number, payload: CreateIssuePayload) => void;
    onExportProject: (projectId: number) => Promise<boolean>;
    onFetchGitData: (projectId: number) => void;
    onUpdateGoal: (projectId: number, goal: GoalDTO) => void;
    onUpdateIssue: (projectId: number, issue: IssueDTO) => void;
    onDeleteLearning: (projectId: number, entryId: number) => void;
    onDeleteReport: (projectId: number, reportId: number) => void;
    onDeleteDoc: (projectId: number, docId: number) => void;
    onDeleteGoal: (projectId: number, goalId: number) => void;
    onDeleteIssue: (projectId: number, issueId: number) => void;
    onCreateTask: (projectId: number, payload: { title: string; status: string }) => void;
    onUpdateTask: (projectId: number, task: TaskDTO) => void;
    onDeleteTask: (projectId: number, taskId: number) => void;
    saving: boolean;
    fetchingGit: boolean;
}) {
    const health = calcHealth(project);
    const completion = calcCompletion(project);
    const productivity = calcProductivityScore(project);
    const learning = calcLearningIntensity(project);
    const momentum = calcMomentum(project);
    const healthLabels: Record<string, string> = {
        green: "Healthy & Active",
        yellow: "Needs Attention",
        red: "Stale – Revive Now",
    };
    const [showLearning, setShowLearning] = useState(false);
    const [showDailyReport, setShowDailyReport] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<GoalDTO | null>(null);
    const [editingIssue, setEditingIssue] = useState<IssueDTO | null>(null);
    const [expandedDoc, setExpandedDoc] = useState<number | null>(null);
    const [gitRepoInput, setGitRepoInput] = useState(project.git_repo || "");
    const [exporting, setExporting] = useState(false);
    const [exportReady, setExportReady] = useState(false);

    useEffect(() => {
        setGitRepoInput(project.git_repo || "");
    }, [project.git_repo, project.id]);
    useEffect(() => {
        setExportReady(false);
    }, [project.id]);

    const confColors: Record<string, string> = {
        Low: "#FF4444",
        Medium: "#FFD700",
        High: "#00FFB2",
    };
    const typeIcons: Record<string, string> = {
        "New concept": "💡",
        "Mistake learned": "🔥",
        "Deepened knowledge": "📈",
        Optimization: "⚡",
    };
    const moodEmoji: Record<string, string> = {
        productive: "💪",
        focused: "🎯",
        tired: "😴",
        distracted: "🌀",
        stressed: "😰",
    };
    const statusColors: Record<string, string> = {
        draft: "#FF6B35",
        "in-progress": "#FFD700",
        complete: "#00FFB2",
    };
    const issueStatusColors: Record<string, string> = {
        open: "#FF4444",
        "in-progress": "#38BDF8",
        resolved: "#00FFB2",
        closed: "#555",
    };
    const issuePriorityColors: Record<string, string> = {
        low: "#555",
        medium: "#FFD700",
        high: "#FF6B35",
        critical: "#FF4444",
    };
    const burnout = getBurnoutRisk(project);
    const weeklyActivity = getProjectWeeklyActivity(project);

    return (
        <div style={{ padding: "0 0 40px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                        style={{ width: 4, height: 32, background: project.color, borderRadius: 2 }}
                    />
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: 22,
                                color: "#e0e0e0",
                                fontFamily: "monospace",
                            }}
                        >
                            {project.name}
                        </h2>
                        <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>
                            {project.category} · ID: {project.id}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: "#111122",
                        border: "1px solid #1a1a2e",
                        color: "#666",
                        padding: "6px 14px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "monospace",
                    }}
                >
                    ← Back
                </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                    { label: "🧠 Add Learning", onClick: () => setShowLearning(true) },
                    { label: "📅 Daily Report", onClick: () => setShowDailyReport(true) },
                    { label: "📝 Add Doc", onClick: () => setShowDocModal(true) },
                    { label: "🎯 Add Goal", onClick: () => setShowGoalModal(true) },
                    { label: "🚩 Add Issue", onClick: () => setShowIssueModal(true) },
                ].map((btn) => (
                    <button
                        key={btn.label}
                        onClick={btn.onClick}
                        style={{
                            background: "#111122",
                            border: `1px solid ${project.color}44`,
                            color: project.color,
                            padding: "8px 16px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 600,
                            fontFamily: "monospace",
                            fontSize: 12,
                        }}
                    >
                        {btn.label}
                    </button>
                ))}
                <button
                    disabled={exporting}
                    onClick={async () => {
                        setExporting(true);
                        const ok = await onExportProject(project.id);
                        if (ok) setExportReady(true);
                        setExporting(false);
                    }}
                    style={{
                        background: "#111122",
                        border: `1px solid ${project.color}44`,
                        color: project.color,
                        padding: "8px 16px",
                        borderRadius: 8,
                        cursor: exporting ? "wait" : "pointer",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        fontSize: 12,
                        opacity: exporting ? 0.7 : 1,
                    }}
                >
                    {exporting ? "Converting..." : exportReady ? "Download" : "Convert"}
                </button>
            </div>

            {/* Health Banner */}
            <div
                style={{
                    background: `${health === "green" ? "#00FFB2" : health === "yellow" ? "#FFD700" : "#FF4444"
                        }15`,
                    border: `1px solid ${health === "green" ? "#00FFB2" : health === "yellow" ? "#FFD700" : "#FF4444"
                        }44`,
                    borderRadius: 10,
                    padding: "10px 16px",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                <HealthDot health={health} />
                <span style={{ color: "#ccc", fontSize: 13 }}>{healthLabels[health]}</span>
                <span
                    style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        color: "#666",
                        fontFamily: "monospace",
                    }}
                >
                    Last active:{" "}
                    {Math.floor((Date.now() - project.lastActive.getTime()) / 86400000)}d ago ·
                    🔥 Burnout: {burnout}
                </span>
            </div>

            {/* Score Row */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                {[
                    { label: "Completion", val: completion, col: project.color },
                    { label: "Productivity", val: productivity, col: "#FF6B35" },
                    { label: "Learning IQ", val: learning, col: "#A78BFA" },
                    { label: "Momentum", val: momentum, col: "#38BDF8" },
                ].map(({ label, val, col }) => (
                    <div
                        key={label}
                        style={{
                            background: "#0d0d1a",
                            border: "1px solid #1a1a2e",
                            borderRadius: 12,
                            padding: 16,
                            textAlign: "center",
                        }}
                    >
                        <CircleProgress value={val} size={72} color={col} />
                        <div
                            style={{
                                fontSize: 11,
                                color: "#555",
                                marginTop: 8,
                                fontFamily: "monospace",
                                textTransform: "uppercase",
                            }}
                        >
                            {label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                {[
                    { label: "Total Hours", value: project.totalHours, color: project.color },
                    { label: "Commits", value: project.commits, color: "#38BDF8" },
                    { label: "Features", value: project.features, color: "#00FFB2" },
                    { label: "Bugs Fixed", value: project.bugsFixed, color: "#FFD700" },
                    { label: "Refactors", value: project.refactors, color: "#A78BFA" },
                    { label: "Active Days", value: project.activeDays, color: "#FF6B35" },
                ].map(({ label, value, color }) => (
                    <StatCard key={label} label={label} value={value} accent={color} />
                ))}
            </div>

            {/* Repository */}
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        color: "#555",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        marginBottom: 10,
                    }}
                >
                    Git Repository
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto auto",
                        gap: 10,
                        alignItems: "center",
                    }}
                >
                    <input
                        value={gitRepoInput}
                        onChange={(e) => setGitRepoInput(e.target.value)}
                        placeholder="https://github.com/user/repo"
                        style={inputStyle}
                    />
                    <button
                        onClick={() =>
                            onSave({ ...project, git_repo: gitRepoInput.trim() || undefined })
                        }
                        disabled={saving}
                        style={{
                            background: saving ? "#555" : project.color,
                            border: "none",
                            color: "#000",
                            padding: "8px 14px",
                            borderRadius: 8,
                            cursor: saving ? "wait" : "pointer",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            opacity: saving ? 0.6 : 1,
                        }}
                    >
                        Save Repo
                    </button>
                    <button
                        onClick={() => onFetchGitData(project.id)}
                        disabled={fetchingGit}
                        style={{
                            background: fetchingGit ? "#555" : "#38BDF8",
                            border: "none",
                            color: "#000",
                            padding: "8px 14px",
                            borderRadius: 8,
                            cursor: fetchingGit ? "wait" : "pointer",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            opacity: fetchingGit ? 0.7 : 1,
                        }}
                    >
                        {fetchingGit ? "Fetching..." : "Fetch Git Data"}
                    </button>
                </div>
                {project.git_repo && (
                    <a
                        href={project.git_repo}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: "inline-block",
                            marginTop: 10,
                            color: project.color,
                            fontSize: 12,
                            fontFamily: "monospace",
                        }}
                    >
                        Open repository
                    </a>
                )}
            </div>

            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        color: "#555",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        marginBottom: 14,
                    }}
                >
                    📈 Weekly Activity
                </div>
                <WeeklyChart
                    data={weeklyActivity.data}
                    labels={weeklyActivity.labels}
                    color={project.color}
                />
            </div>

            <GitMetricsView project={project} />

            {/* Daily Reports */}
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            letterSpacing: 1.5,
                        }}
                    >
                        📅 Daily Reports ({project.dailyReports.length})
                    </div>
                    <button
                        onClick={() => setShowDailyReport(true)}
                        style={{
                            background: "transparent",
                            border: `1px solid ${project.color}44`,
                            color: project.color,
                            padding: "4px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "monospace",
                        }}
                    >
                        + Add
                    </button>
                </div>
                {project.dailyReports.length > 0 ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            maxHeight: 300,
                            overflowY: "auto",
                        }}
                    >
                        {[...project.dailyReports]
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .map((report) => (
                                <div
                                    key={report.id}
                                    style={{
                                        background: "#080810",
                                        borderRadius: 8,
                                        padding: 12,
                                        border: "1px solid #111122",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: 6,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 12, color: "#ddd", fontWeight: 600 }}>
                                                {report.date}
                                            </span>
                                            <span>{moodEmoji[report.mood] || "🤔"}</span>
                                            <span
                                                style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}
                                            >
                                                {report.mood}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: project.color,
                                                    fontFamily: "monospace",
                                                }}
                                            >
                                                {report.hoursWorked}h
                                            </span>
                                            <span style={{ fontSize: 10, color: "#A78BFA", fontFamily: "monospace" }}>
                                                {report.tasksDone} tasks
                                            </span>
                                            <span style={{ fontSize: 10, color: "#FFD700", fontFamily: "monospace" }}>
                                                Focus: {report.focusScore}/10
                                            </span>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Delete this report?"))
                                                        onDeleteReport(project.id, report.id);
                                                }}
                                                style={{
                                                    background: "transparent",
                                                    border: "1px solid #FF444444",
                                                    color: "#FF4444",
                                                    padding: "1px 5px",
                                                    borderRadius: 3,
                                                    cursor: "pointer",
                                                    fontSize: 8,
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                    {report.notes && (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: "#888",
                                                fontFamily: "monospace",
                                                borderTop: "1px solid #111122",
                                                paddingTop: 6,
                                            }}
                                        >
                                            {report.notes}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                ) : (
                    <div
                        style={{
                            color: "#444",
                            textAlign: "center",
                            padding: "24px 0",
                            fontSize: 12,
                            fontFamily: "monospace",
                        }}
                    >
                        No daily reports yet.
                    </div>
                )}
            </div>

            {/* Documentation */}
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            letterSpacing: 1.5,
                        }}
                    >
                        📝 Documentation ({project.documentation.length})
                    </div>
                    <button
                        onClick={() => setShowDocModal(true)}
                        style={{
                            background: "transparent",
                            border: `1px solid ${project.color}44`,
                            color: project.color,
                            padding: "4px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "monospace",
                        }}
                    >
                        + Add
                    </button>
                </div>
                {project.documentation.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {project.documentation.map((doc) => (
                            <div
                                key={doc.id}
                                style={{
                                    background: "#080810",
                                    borderRadius: 8,
                                    padding: 12,
                                    border: "1px solid #111122",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 6,
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                                >
                                    <span style={{ fontSize: 12, color: "#ddd", fontWeight: 600 }}>
                                        {doc.title}
                                    </span>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                padding: "2px 8px",
                                                borderRadius: 4,
                                                background: (statusColors[doc.status] || "#555") + "22",
                                                color: statusColors[doc.status] || "#555",
                                                fontFamily: "monospace",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {doc.status}
                                        </span>
                                        <span style={{ fontSize: 10, color: "#555" }}>
                                            {expandedDoc === doc.id ? "▲" : "▼"}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("Delete this document?"))
                                                    onDeleteDoc(project.id, doc.id);
                                            }}
                                            style={{
                                                background: "transparent",
                                                border: "1px solid #FF444444",
                                                color: "#FF4444",
                                                padding: "1px 5px",
                                                borderRadius: 3,
                                                cursor: "pointer",
                                                fontSize: 8,
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        fontSize: 10,
                                        color: "#666",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    <span>{doc.date}</span>
                                    <span>{doc.sections} sections</span>
                                    <span>{doc.wordCount} words</span>
                                </div>
                                {expandedDoc === doc.id && (
                                    <div
                                        style={{
                                            marginTop: 10,
                                            padding: 10,
                                            background: "#0d0d1a",
                                            borderRadius: 6,
                                            fontSize: 12,
                                            color: "#aaa",
                                            lineHeight: 1.6,
                                            fontFamily: "monospace",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {doc.content}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            color: "#444",
                            textAlign: "center",
                            padding: "24px 0",
                            fontSize: 12,
                            fontFamily: "monospace",
                        }}
                    >
                        No documentation yet.
                    </div>
                )}
            </div>

            {/* Issue Tracking */}
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            letterSpacing: 1.5,
                        }}
                    >
                        🚩 Issues ({project.issues?.length || 0})
                    </div>
                    <button
                        onClick={() => setShowIssueModal(true)}
                        style={{
                            background: "transparent",
                            border: `1px solid ${project.color}44`,
                            color: project.color,
                            padding: "4px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "monospace",
                        }}
                    >
                        + Add
                    </button>
                </div>
                {project.issues && project.issues.length > 0 ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            maxHeight: 350,
                            overflowY: "auto",
                        }}
                    >
                        {[...project.issues]
                            .sort((a, b) => b.id - a.id)
                            .map((issue) => (
                                <div
                                    key={issue.id}
                                    style={{
                                        background: "#080810",
                                        borderRadius: 10,
                                        padding: 14,
                                        border: "1px solid #111122",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: 13, color: "#eee", fontWeight: 700, marginBottom: 4 }}>
                                                {issue.title}
                                            </div>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span style={{
                                                    fontSize: 9,
                                                    padding: "2px 6px",
                                                    borderRadius: 4,
                                                    background: (issueStatusColors[issue.status as keyof typeof issueStatusColors] || "#555") + "22",
                                                    color: issueStatusColors[issue.status as keyof typeof issueStatusColors] || "#555",
                                                    textTransform: "uppercase",
                                                    fontWeight: 800,
                                                    fontFamily: "monospace"
                                                }}>
                                                    {issue.status}
                                                </span>
                                                <span style={{
                                                    fontSize: 9,
                                                    padding: "2px 6px",
                                                    borderRadius: 4,
                                                    background: (issuePriorityColors[issue.priority as keyof typeof issuePriorityColors] || "#555") + "22",
                                                    color: issuePriorityColors[issue.priority as keyof typeof issuePriorityColors] || "#555",
                                                    textTransform: "uppercase",
                                                    fontWeight: 800,
                                                    fontFamily: "monospace"
                                                }}>
                                                    {issue.priority}
                                                </span>
                                                <span style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>
                                                    {new Date(issue.dateCreated).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                            {issue.status !== "resolved" && issue.status !== "closed" && (
                                                <button
                                                    onClick={() => {
                                                        onUpdateIssue(project.id, { ...issue, status: "resolved" });
                                                    }}
                                                    style={{
                                                        background: "transparent",
                                                        border: "1px solid #00FFB244",
                                                        color: "#00FFB2",
                                                        padding: "2px 8px",
                                                        borderRadius: 4,
                                                        cursor: "pointer",
                                                        fontSize: 10,
                                                        fontFamily: "monospace",
                                                    }}
                                                >
                                                    solved
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setEditingIssue(issue)}
                                                style={{
                                                    background: "transparent",
                                                    border: "1px solid #38BDF844",
                                                    color: "#38BDF8",
                                                    padding: "1px 5px",
                                                    borderRadius: 3,
                                                    cursor: "pointer",
                                                    fontSize: 8,
                                                }}
                                            >
                                                edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Delete this issue?"))
                                                        onDeleteIssue(project.id, issue.id);
                                                }}
                                                style={{
                                                    background: "transparent",
                                                    border: "1px solid #FF444444",
                                                    color: "#FF4444",
                                                    padding: "2px 6px",
                                                    borderRadius: 4,
                                                    cursor: "pointer",
                                                    fontSize: 10,
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: "#777", lineHeight: 1.5 }}>
                                        {issue.description}
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <div
                        style={{
                            color: "#444",
                            textAlign: "center",
                            padding: "24px 0",
                            fontSize: 12,
                            fontFamily: "monospace",
                        }}
                    >
                        No issues tracked yet.
                    </div>
                )}
            </div>

            {/* Learning Entries */}
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            letterSpacing: 1.5,
                        }}
                    >
                        📚 Learning ({project.learningEntries.length} entries ·{" "}
                        {project.learningPoints} pts)
                    </div>
                    <button
                        onClick={() => setShowLearning(true)}
                        style={{
                            background: "transparent",
                            border: `1px solid ${project.color}44`,
                            color: project.color,
                            padding: "4px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "monospace",
                        }}
                    >
                        + Add
                    </button>
                </div>
                {project.learningEntries.length > 0 ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            maxHeight: 300,
                            overflowY: "auto",
                        }}
                    >
                        {project.learningEntries.map((e) => (
                            <div
                                key={e.id}
                                style={{
                                    background: "#080810",
                                    borderRadius: 8,
                                    padding: 12,
                                    border: "1px solid #111122",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        marginBottom: 6,
                                    }}
                                >
                                    <span style={{ fontSize: 12, color: "#ddd", fontWeight: 600 }}>
                                        {typeIcons[e.type] || "📌"} {e.concept}
                                    </span>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: confColors[e.confidence],
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {e.confidence}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (confirm("Delete this entry?"))
                                                    onDeleteLearning(project.id, e.id);
                                            }}
                                            style={{
                                                background: "transparent",
                                                border: "1px solid #FF444444",
                                                color: "#FF4444",
                                                padding: "1px 5px",
                                                borderRadius: 3,
                                                cursor: "pointer",
                                                fontSize: 8,
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginBottom: 6,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span style={{ fontSize: 9, color: "#555", fontFamily: "monospace" }}>
                                        {e.category}
                                    </span>
                                    <span style={{ fontSize: 9, color: "#555" }}>·</span>
                                    <span style={{ fontSize: 9, color: "#555" }}>
                                        {"★".repeat(e.difficulty)}
                                        {"☆".repeat(5 - e.difficulty)}
                                    </span>
                                    <span style={{ fontSize: 9, color: "#555" }}>·</span>
                                    <span style={{ fontSize: 9, color: "#666" }}>
                                        {e.timeSpent}h · {e.dateLogged}
                                    </span>
                                </div>
                                {e.resources && e.resources.length > 0 && (
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                        {e.resources.map((r, j) => (
                                            <span
                                                key={j}
                                                style={{
                                                    fontSize: 8,
                                                    color: "#888",
                                                    background: "#0d0d1a",
                                                    padding: "2px 6px",
                                                    borderRadius: 3,
                                                }}
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            color: "#444",
                            textAlign: "center",
                            padding: "24px 0",
                            fontSize: 12,
                            fontFamily: "monospace",
                        }}
                    >
                        No learning entries yet.
                    </div>
                )}
            </div>

            {/* Tasks */}
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            letterSpacing: 1.5,
                        }}
                    >
                        ✅ Tasks ({project.tasks?.length || 0})
                    </div>
                    <button
                        onClick={() => {
                            const title = prompt("Enter task title:");
                            if (title) onCreateTask(project.id, { title, status: 'todo' });
                        }}
                        style={{
                            background: "transparent",
                            border: `1px solid ${project.color}44`,
                            color: project.color,
                            padding: "4px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "monospace",
                        }}
                    >
                        + Add Task
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(project.tasks || []).map(task => (
                        <div key={task.id} style={{ background: '#080810', padding: '10px 14px', borderRadius: 8, border: '1px solid #111122', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: "#ccc" }}>{task.title}</span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button
                                    onClick={() => onUpdateTask(project.id, { ...task, status: task.status === 'completed' ? 'todo' : 'completed' })}
                                    style={{
                                        fontSize: 8,
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        background: task.status === 'completed' ? '#00FFB222' : '#555222',
                                        color: task.status === 'completed' ? '#00FFB2' : '#555',
                                        textTransform: 'uppercase',
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {task.status}
                                </button>
                                <button
                                    onClick={() => { if (confirm('Delete task?')) onDeleteTask(project.id, task.id); }}
                                    style={{ background: 'transparent', border: 'none', color: '#FF4444', fontSize: 10, cursor: 'pointer', padding: '0 4px' }}
                                >✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Goals */}
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            letterSpacing: 1.5,
                        }}
                    >
                        🎯 Goals ({project.goals.length})
                    </div>
                    <button
                        onClick={() => setShowGoalModal(true)}
                        style={{
                            background: "transparent",
                            border: `1px solid ${project.color}44`,
                            color: project.color,
                            padding: "4px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 10,
                            fontFamily: "monospace",
                        }}
                    >
                        + Add
                    </button>
                </div>
                {project.goals.length > 0 ? (
                    project.goals.map((goal) => {
                        const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
                        return (
                            <div key={goal.id} style={{ marginBottom: 16, background: '#080810', padding: 12, borderRadius: 10, border: '1px solid #111122' }}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: 8,
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 2 }}>{goal.title}</div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span
                                                style={{
                                                    fontSize: 9,
                                                    color: "#555",
                                                    fontFamily: "monospace",
                                                    background: "#0d0d1a",
                                                    padding: "2px 6px",
                                                    borderRadius: 3,
                                                    border: '1px solid #1a1a2e'
                                                }}
                                            >
                                                {goal.category}
                                            </span>
                                            <span style={{
                                                fontSize: 9,
                                                color: goal.status === 'completed' ? '#00FFB2' : goal.status === 'in-progress' ? '#38BDF8' : '#555',
                                                fontWeight: 700,
                                                textTransform: 'uppercase'
                                            }}>
                                                {goal.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <div style={{ display: 'flex', gap: 6, marginRight: 8 }}>
                                            {goal.issueIds?.length > 0 && <span title="Linked Issues" style={{ fontSize: 10, color: '#38BDF8' }}>📦 {goal.issueIds.length}</span>}
                                            {goal.taskIds?.length > 0 && <span title="Linked Tasks" style={{ fontSize: 10, color: '#00FFB2' }}>✅ {goal.taskIds.length}</span>}
                                        </div>
                                        <button
                                            onClick={() => setEditingGoal(goal)}
                                            style={{
                                                background: "transparent",
                                                border: "1px solid #38BDF844",
                                                color: "#38BDF8",
                                                padding: "2px 8px",
                                                borderRadius: 4,
                                                cursor: "pointer",
                                                fontSize: 10,
                                            }}
                                        >
                                            edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm("Delete this goal?"))
                                                    onDeleteGoal(project.id, goal.id);
                                            }}
                                            style={{
                                                background: "transparent",
                                                border: "1px solid #FF444444",
                                                color: "#FF4444",
                                                padding: "2px 6px",
                                                borderRadius: 4,
                                                cursor: "pointer",
                                                fontSize: 10,
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <MiniBar
                                            value={goal.current}
                                            max={goal.target}
                                            color={goal.status === 'completed' ? "#00FFB2" : project.color}
                                            height={6}
                                        />
                                    </div>
                                    <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace", minWidth: 60, textAlign: 'right' }}>
                                        {goal.current}/{goal.target} ({pct}%)
                                    </span>
                                </div>
                                {goal.hoursSpent > 0 && (
                                    <div style={{ fontSize: 9, color: '#444', marginTop: 4, textAlign: 'right' }}>
                                        Effort: {goal.hoursSpent}h
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div
                        style={{
                            color: "#444",
                            textAlign: "center",
                            padding: "24px 0",
                            fontSize: 12,
                            fontFamily: "monospace",
                        }}
                    >
                        No goals set yet.
                    </div>
                )}
            </div>

            {/* Tech Stack */}
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 12,
                    padding: 20,
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        color: "#555",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        marginBottom: 14,
                    }}
                >
                    🛠 Tech Stack
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {project.techStack.map((t) => (
                        <span
                            key={t}
                            style={{
                                fontSize: 12,
                                padding: "6px 14px",
                                background: "#080810",
                                borderRadius: 8,
                                color: project.color,
                                fontFamily: "monospace",
                                border: `1px solid ${project.color}33`,
                            }}
                        >
                            {t}
                        </span>
                    ))}
                    {project.techStack.length === 0 && (
                        <span style={{ color: "#444", fontSize: 12, fontFamily: "monospace" }}>
                            No tech stack defined
                        </span>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showLearning && (
                <AddLearningModal
                    project={project}
                    saving={saving}
                    onClose={() => setShowLearning(false)}
                    onSave={(payload) => {
                        onCreateLearning(project.id, payload);
                        setShowLearning(false);
                    }}
                />
            )}
            {showDailyReport && (
                <AddDailyReportModal
                    project={project}
                    saving={saving}
                    onClose={() => setShowDailyReport(false)}
                    onSave={(payload) => {
                        onCreateReport(project.id, payload);
                        setShowDailyReport(false);
                    }}
                />
            )}
            {showDocModal && (
                <AddDocumentModal
                    project={project}
                    saving={saving}
                    onClose={() => setShowDocModal(false)}
                    onSave={(payload) => {
                        onCreateDoc(project.id, payload);
                        setShowDocModal(false);
                    }}
                />
            )}
            {showGoalModal && (
                <AddGoalModal
                    project={project}
                    saving={saving}
                    onClose={() => setShowGoalModal(false)}
                    onSave={(payload) => {
                        onCreateGoal(project.id, payload);
                        setShowGoalModal(false);
                    }}
                />
            )}
            {editingGoal && (
                <EditGoalModal
                    project={project}
                    goal={editingGoal}
                    saving={saving}
                    onClose={() => setEditingGoal(null)}
                    onSave={(goal) => {
                        onUpdateGoal(project.id, goal);
                        setEditingGoal(null);
                    }}
                />
            )}
            {showIssueModal && (
                <AddIssueModal
                    project={project}
                    saving={saving}
                    onClose={() => setShowIssueModal(false)}
                    onSave={(payload) => {
                        onCreateIssue(project.id, payload);
                        setShowIssueModal(false);
                    }}
                />
            )}
            {editingIssue && (
                <EditIssueModal
                    project={project}
                    issue={editingIssue}
                    saving={saving}
                    onClose={() => setEditingIssue(null)}
                    onSave={(i) => {
                        onUpdateIssue(project.id, i);
                        setEditingIssue(null);
                    }}
                />
            )}
        </div>
    );
}
