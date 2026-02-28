import { useState } from "react";
import { type CreateDocumentPayload } from "../../api";
import { type Project } from "../../types";
import { DOC_STATUSES, inputStyle, selectStyle, labelStyle } from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

export function AddDocumentModal({
    project,
    onClose,
    onSave,
    saving,
}: {
    project: Project;
    onClose: () => void;
    onSave: (d: CreateDocumentPayload) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState({
        title: "",
        content: "",
        status: "draft",
        date: new Date().toISOString().split("T")[0],
    });
    return (
        <ModalOverlay onClose={onClose}>
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 16,
                    padding: 28,
                    width: 600,
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
                    📝 Add Documentation
                </h3>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Title *</label>
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g., API Architecture Overview"
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
                        <label style={labelStyle}>Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            style={selectStyle}
                        >
                            {DOC_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Content *</label>
                    <textarea
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        placeholder="Write your documentation here..."
                        rows={8}
                        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
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
                        disabled={saving || !form.title.trim() || !form.content.trim()}
                        onClick={() => {
                            if (form.title.trim() && form.content.trim())
                                onSave({
                                    title: form.title.trim(),
                                    content: form.content.trim(),
                                    status: form.status,
                                    date: form.date,
                                });
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
                            opacity: saving ? 0.6 : 1,
                        }}
                    >
                        {saving ? "Saving..." : "Save Document"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
