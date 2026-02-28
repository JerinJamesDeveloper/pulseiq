import { useState } from "react";
import { type CreateLearningEntryPayload } from "../../api";
import { type Project } from "../../types";
import { SKILL_CATS, LEARNING_TYPES, inputStyle, selectStyle, labelStyle } from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

export function AddLearningModal({
    project,
    onClose,
    onSave,
    saving,
}: {
    project: Project;
    onClose: () => void;
    onSave: (entry: CreateLearningEntryPayload) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState({
        concept: "",
        category: "Backend",
        difficulty: 3,
        type: "New concept",
        confidence: "Medium",
        dateLogged: new Date().toISOString().split("T")[0],
        timeSpent: 1,
        resources: "",
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
                    🧠 Log Learning Entry
                </h3>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Concept / Topic *</label>
                    <input
                        value={form.concept}
                        onChange={(e) => setForm({ ...form, concept: e.target.value })}
                        placeholder="e.g., Redis Pub/Sub"
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
                            {SKILL_CATS.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Type</label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                            style={selectStyle}
                        >
                            {LEARNING_TYPES.map((t) => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                    </div>
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
                        <label style={labelStyle}>Difficulty (1-5)</label>
                        <input
                            type="number"
                            min={1}
                            max={5}
                            value={form.difficulty}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    difficulty: Math.min(5, Math.max(1, +e.target.value)),
                                })
                            }
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Confidence</label>
                        <select
                            value={form.confidence}
                            onChange={(e) => setForm({ ...form, confidence: e.target.value })}
                            style={selectStyle}
                        >
                            {["Low", "Medium", "High"].map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Time Spent (hrs)</label>
                        <input
                            type="number"
                            step={0.5}
                            min={0}
                            value={form.timeSpent}
                            onChange={(e) => setForm({ ...form, timeSpent: +e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Date</label>
                    <input
                        type="date"
                        value={form.dateLogged}
                        onChange={(e) => setForm({ ...form, dateLogged: e.target.value })}
                        style={inputStyle}
                    />
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Resources (comma-separated)</label>
                    <input
                        value={form.resources}
                        onChange={(e) => setForm({ ...form, resources: e.target.value })}
                        placeholder="Docs, YouTube"
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
                        disabled={saving || !form.concept.trim()}
                        onClick={() => {
                            if (form.concept.trim())
                                onSave({
                                    concept: form.concept.trim(),
                                    category: form.category,
                                    difficulty: form.difficulty,
                                    type: form.type,
                                    confidence: form.confidence,
                                    dateLogged: form.dateLogged,
                                    timeSpent: form.timeSpent,
                                    resources: form.resources
                                        .split(",")
                                        .map((r) => r.trim())
                                        .filter((r) => r),
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
                        {saving ? "Saving..." : "Save Entry"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
