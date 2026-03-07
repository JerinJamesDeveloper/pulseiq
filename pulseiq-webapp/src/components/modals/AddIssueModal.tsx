import { useState } from "react";
import { type CreateIssuePayload, type IssueStatus, type IssuePriority } from "../../api";
import { type Project } from "../../types";
import { ISSUE_STATUSES, ISSUE_PRIORITIES, inputStyle, selectStyle, labelStyle } from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

export function AddIssueModal({
    project,
    onClose,
    onSave,
    saving,
}: {
    project: Project;
    onClose: () => void;
    onSave: (p: CreateIssuePayload) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState({
        title: "",
        description: "",
        status: "open",
        priority: "medium",
        timeSpent: 0,
    });

    return (
        <ModalOverlay onClose={onClose}>
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 16,
                    padding: 28,
                    width: 500,
                    maxWidth: "90vw",
                    maxHeight: "90vh",
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
                    🚩 Add New Issue
                </h3>

                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Title *</label>
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g., Fix login button padding"
                        style={inputStyle}
                    />
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 12,
                        marginBottom: 14,
                    }}
                >
                    <div>
                        <label style={labelStyle}>Priority</label>
                        <select
                            value={form.priority}
                            onChange={(e) => setForm({ ...form, priority: e.target.value })}
                            style={selectStyle}
                        >
                            {ISSUE_PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            style={selectStyle}
                        >
                            {ISSUE_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Time Spent (hrs)</label>
                        <input
                            type="number"
                            value={form.timeSpent}
                            onChange={(e) => setForm({ ...form, timeSpent: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            min="0"
                            step="0.5"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Description *</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe the problem..."
                        rows={4}
                        style={{ ...inputStyle, resize: "vertical" }}
                    />
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
                        disabled={saving || !form.title.trim() || !form.description.trim()}
                        onClick={() => {
                            if (form.title.trim() && form.description.trim()) {
                                onSave({
                                    title: form.title.trim(),
                                    description: form.description.trim(),
                                    status: form.status as IssueStatus,
                                    priority: form.priority as IssuePriority,
                                    timeSpent: form.timeSpent,
                                });
                            }
                        }}
                        style={{
                            background: saving ? "#555" : project.color,
                            border: "none",
                            color: "#000",
                            padding: "8px 18px",
                            borderRadius: 8,
                            cursor: saving ? "wait" : "pointer",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            opacity: (saving || !form.title.trim() || !form.description.trim()) ? 0.6 : 1,
                        }}
                    >
                        {saving ? "Saving..." : "Create Issue"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
