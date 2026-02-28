import { useState } from "react";
import { type CreateProjectPayload } from "../../api";
import { CATEGORIES, COLORS, inputStyle, selectStyle, labelStyle } from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

export function AddProjectModal({
    onClose,
    onSave,
    saving,
}: {
    onClose: () => void;
    onSave: (p: CreateProjectPayload) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState({
        name: "",
        category: CATEGORIES[0],
        color: COLORS[0],
        techStack: "",
        gitRepo: "",
        totalTasks: 0,
    });
    return (
        <ModalOverlay onClose={onClose}>
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 16,
                    padding: 28,
                    width: 520,
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
                    🚀 New Project
                </h3>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Project Name *</label>
                    <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g., NeuralCart"
                        style={inputStyle}
                    />
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 14,
                    }}
                >
                    <div>
                        <label style={labelStyle}>Category</label>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            style={selectStyle}
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Color Theme</label>
                        <div
                            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}
                        >
                            {COLORS.map((c) => (
                                <div
                                    key={c}
                                    onClick={() => setForm({ ...form, color: c })}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 6,
                                        background: c,
                                        cursor: "pointer",
                                        border:
                                            form.color === c ? "2px solid #fff" : "2px solid transparent",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Tech Stack (comma-separated)</label>
                    <input
                        value={form.techStack}
                        onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                        placeholder="e.g., React, Node.js"
                        style={inputStyle}
                    />
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Git Repository URL</label>
                    <input
                        value={form.gitRepo}
                        onChange={(e) => setForm({ ...form, gitRepo: e.target.value })}
                        placeholder="https://github.com/user/repo"
                        style={inputStyle}
                    />
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Estimated Total Tasks</label>
                    <input
                        type="number"
                        min={0}
                        value={form.totalTasks}
                        onChange={(e) => setForm({ ...form, totalTasks: +e.target.value })}
                        style={inputStyle}
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
                        disabled={saving || !form.name.trim()}
                        onClick={() => {
                            if (form.name.trim())
                                onSave({
                                    name: form.name.trim(),
                                    category: form.category,
                                    color: form.color,
                                    techStack: form.techStack
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter((s) => s),
                                    git_repo: form.gitRepo.trim() || undefined,
                                    totalTasks: form.totalTasks,
                                });
                        }}
                        style={{
                            background: saving ? "#555" : form.color,
                            border: "none",
                            color: "#000",
                            padding: "8px 18px",
                            borderRadius: 8,
                            cursor: saving ? "wait" : "pointer",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            opacity: saving ? 0.6 : 1,
                        }}
                    >
                        {saving ? "Creating..." : "Create Project"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
