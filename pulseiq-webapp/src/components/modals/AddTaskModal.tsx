import { useState } from "react";
import { type CreateTaskPayload } from "../../api";
import { type Project } from "../../types";
import { inputStyle, selectStyle, labelStyle } from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

export function AddTaskModal({
    project,
    onClose,
    onSave,
    saving,
}: {
    project: Project;
    onClose: () => void;
    onSave: (payload: CreateTaskPayload) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<CreateTaskPayload>({
        title: "",
        status: "todo",
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
                    Add New Task
                </h3>

                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Title *</label>
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g., Build task updation card"
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Status</label>
                    <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as CreateTaskPayload["status"] })}
                        style={selectStyle}
                    >
                        <option value="todo">Todo</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
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
                        onClick={() => {
                            if (form.title.trim()) {
                                onSave({ title: form.title.trim(), status: form.status });
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
                            opacity: saving || !form.title.trim() ? 0.6 : 1,
                        }}
                    >
                        {saving ? "Saving..." : "Create Task"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
