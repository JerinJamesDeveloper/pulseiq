import { useState, type CSSProperties } from "react";
import {
    type CreateTaskPayload,
    type TaskDTO,
    type TaskImpactLevel,
    type TaskPriority,
    type TaskRiskLevel,
    type TaskStatus,
    type TaskType,
} from "../../api";
import { type Project } from "../../types";
import {
    inputStyle,
    labelStyle,
    selectStyle,
    TASK_IMPACT_LEVELS,
    TASK_PRIORITIES,
    TASK_RISK_LEVELS,
    TASK_STATUSES,
    TASK_TYPES,
} from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

type TaskFormState = {
    title: string;
    description: string;
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    storyPoints: string;
    complexityScore: string;
    createdBy: string;
    assignedTo: string;
    reviewerId: string;
    sprintId: string;
    milestoneId: string;
    estimatedHours: string;
    actualHours: string;
    commitCount: string;
    linesAdded: string;
    linesRemoved: string;
    filesChanged: string;
    branchName: string;
    pullRequestId: string;
    riskLevel: TaskRiskLevel;
    impactLevel: TaskImpactLevel;
    startDate: string;
    dueDate: string;
    completedAt: string;
};

const textAreaStyle: CSSProperties = {
    ...inputStyle,
    minHeight: 88,
    resize: "vertical",
};

function toOptionalInteger(value: string) {
    if (!value.trim()) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalFloat(value: string) {
    if (!value.trim()) return undefined;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalString(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}

function fieldRowStyle() {
    return {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 14,
    } as const;
}

function toDateTimeLocal(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
}

function buildInitialForm(task?: TaskDTO | null): TaskFormState {
    return {
        title: task?.title || "",
        description: task?.description || "",
        type: task?.type || "feature",
        status: task?.status || "todo",
        priority: task?.priority || "medium",
        storyPoints: task?.storyPoints?.toString() || "",
        complexityScore: task?.complexityScore?.toString() || "",
        createdBy: task?.createdBy?.toString() || "",
        assignedTo: task?.assignedTo?.toString() || "",
        reviewerId: task?.reviewerId?.toString() || "",
        sprintId: task?.sprintId?.toString() || "",
        milestoneId: task?.milestoneId?.toString() || "",
        estimatedHours: task?.estimatedHours?.toString() || "",
        actualHours: task?.actualHours?.toString() || "",
        commitCount: task?.commitCount?.toString() || "0",
        linesAdded: task?.linesAdded?.toString() || "0",
        linesRemoved: task?.linesRemoved?.toString() || "0",
        filesChanged: task?.filesChanged?.toString() || "0",
        branchName: task?.branchName || "",
        pullRequestId: task?.pullRequestId || "",
        riskLevel: task?.riskLevel || "medium",
        impactLevel: task?.impactLevel || "medium",
        startDate: toDateTimeLocal(task?.startDate),
        dueDate: toDateTimeLocal(task?.dueDate),
        completedAt: toDateTimeLocal(task?.completedAt),
    };
}

export function AddTaskModal({
    project,
    onClose,
    onSave,
    saving,
    initialTask,
    mode = "create",
}: {
    project: Project;
    onClose: () => void;
    onSave: (payload: CreateTaskPayload) => void;
    saving: boolean;
    initialTask?: TaskDTO | null;
    mode?: "create" | "edit";
}) {
    const [form, setForm] = useState<TaskFormState>(() => buildInitialForm(initialTask));

    const submit = () => {
        const title = form.title.trim();
        if (!title) return;

        onSave({
            title,
            description: toOptionalString(form.description),
            type: form.type,
            status: form.status,
            priority: form.priority,
            storyPoints: toOptionalInteger(form.storyPoints),
            complexityScore: toOptionalInteger(form.complexityScore),
            createdBy: toOptionalInteger(form.createdBy),
            assignedTo: toOptionalInteger(form.assignedTo),
            reviewerId: toOptionalInteger(form.reviewerId),
            sprintId: toOptionalInteger(form.sprintId),
            milestoneId: toOptionalInteger(form.milestoneId),
            estimatedHours: toOptionalFloat(form.estimatedHours),
            actualHours: toOptionalFloat(form.actualHours),
            commitCount: toOptionalInteger(form.commitCount),
            linesAdded: toOptionalInteger(form.linesAdded),
            linesRemoved: toOptionalInteger(form.linesRemoved),
            filesChanged: toOptionalInteger(form.filesChanged),
            branchName: toOptionalString(form.branchName),
            pullRequestId: toOptionalString(form.pullRequestId),
            riskLevel: form.riskLevel,
            impactLevel: form.impactLevel,
            startDate: form.startDate || undefined,
            dueDate: form.dueDate || undefined,
            completedAt: form.completedAt || undefined,
        });
    };

    return (
        <ModalOverlay onClose={onClose}>
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 16,
                    padding: 28,
                    width: 820,
                    maxWidth: "96vw",
                    maxHeight: "88vh",
                    overflowY: "auto",
                }}
            >
                <h3
                    style={{
                        margin: "0 0 20px",
                        color: "#e0e0e0",
                        fontFamily: "monospace",
                        fontSize: 16,
                    }}
                >
                    {mode === "edit" ? "Edit Task" : "Add New Task"}
                </h3>

                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Title *</label>
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g., Build task details workflow"
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Description</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="What needs to be done, constraints, expected output..."
                        style={textAreaStyle}
                    />
                </div>

                <div style={fieldRowStyle()}>
                    <div>
                        <label style={labelStyle}>Type</label>
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TaskType })} style={selectStyle}>
                            {TASK_TYPES.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Status</label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })} style={selectStyle}>
                            {TASK_STATUSES.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Priority</label>
                        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })} style={selectStyle}>
                            {TASK_PRIORITIES.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={fieldRowStyle()}>
                    <div>
                        <label style={labelStyle}>Story Points</label>
                        <input type="number" min={0} value={form.storyPoints} onChange={(e) => setForm({ ...form, storyPoints: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Complexity Score</label>
                        <input type="number" min={0} value={form.complexityScore} onChange={(e) => setForm({ ...form, complexityScore: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Estimated Hours</label>
                        <input type="number" min={0} step="0.25" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Actual Hours</label>
                        <input type="number" min={0} step="0.25" value={form.actualHours} onChange={(e) => setForm({ ...form, actualHours: e.target.value })} style={inputStyle} />
                    </div>
                </div>

                <div style={fieldRowStyle()}>
                    <div>
                        <label style={labelStyle}>Created By</label>
                        <input type="number" min={0} value={form.createdBy} onChange={(e) => setForm({ ...form, createdBy: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Assigned To</label>
                        <input type="number" min={0} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Reviewer ID</label>
                        <input type="number" min={0} value={form.reviewerId} onChange={(e) => setForm({ ...form, reviewerId: e.target.value })} style={inputStyle} />
                    </div>
                </div>

                <div style={fieldRowStyle()}>
                    <div>
                        <label style={labelStyle}>Sprint ID</label>
                        <input type="number" min={0} value={form.sprintId} onChange={(e) => setForm({ ...form, sprintId: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Milestone ID</label>
                        <input type="number" min={0} value={form.milestoneId} onChange={(e) => setForm({ ...form, milestoneId: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Branch Name</label>
                        <input value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Pull Request ID</label>
                        <input value={form.pullRequestId} onChange={(e) => setForm({ ...form, pullRequestId: e.target.value })} style={inputStyle} />
                    </div>
                </div>

                <div style={fieldRowStyle()}>
                    <div>
                        <label style={labelStyle}>Commit Count</label>
                        <input type="number" min={0} value={form.commitCount} onChange={(e) => setForm({ ...form, commitCount: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Lines Added</label>
                        <input type="number" min={0} value={form.linesAdded} onChange={(e) => setForm({ ...form, linesAdded: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Lines Removed</label>
                        <input type="number" min={0} value={form.linesRemoved} onChange={(e) => setForm({ ...form, linesRemoved: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Files Changed</label>
                        <input type="number" min={0} value={form.filesChanged} onChange={(e) => setForm({ ...form, filesChanged: e.target.value })} style={inputStyle} />
                    </div>
                </div>

                <div style={fieldRowStyle()}>
                    <div>
                        <label style={labelStyle}>Risk Level</label>
                        <select value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value as TaskRiskLevel })} style={selectStyle}>
                            {TASK_RISK_LEVELS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Impact Level</label>
                        <select value={form.impactLevel} onChange={(e) => setForm({ ...form, impactLevel: e.target.value as TaskImpactLevel })} style={selectStyle}>
                            {TASK_IMPACT_LEVELS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Start Date</label>
                        <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Due Date</label>
                        <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />
                    </div>
                </div>

                <div style={{ marginBottom: 20, maxWidth: 250 }}>
                    <label style={labelStyle}>Completed At</label>
                    <input type="datetime-local" value={form.completedAt} onChange={(e) => setForm({ ...form, completedAt: e.target.value })} style={inputStyle} />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#111122",
                            border: "1px solid #1a1a2e",
                            color: "#666",
                            padding: "8px 18px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontFamily: "monospace",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        disabled={saving || !form.title.trim()}
                        onClick={submit}
                        style={{
                            background: saving ? "#555" : project.color,
                            border: "none",
                            color: "#000",
                            padding: "8px 18px",
                            borderRadius: 8,
                            cursor: saving ? "wait" : "pointer",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            opacity: saving || !form.title.trim() ? 0.6 : 1,
                        }}
                    >
                        {saving ? "Saving..." : mode === "edit" ? "Update Task" : "Create Task"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
