import { useState } from "react";
import { type CreateDailyReportPayload } from "../../api";
import { type Project } from "../../types";
import { MOODS, inputStyle, labelStyle } from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

export function AddDailyReportModal({
    project,
    onClose,
    onSave,
    saving,
}: {
    project: Project;
    onClose: () => void;
    onSave: (r: CreateDailyReportPayload) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState({
        date: new Date().toISOString().split("T")[0],
        hoursWorked: 0,
        tasksDone: 0,
        notes: "",
        mood: "productive",
        focusScore: 7,
    });
    const moodEmoji: Record<string, string> = {
        productive: "💪",
        focused: "🎯",
        tired: "😴",
        distracted: "🌀",
        stressed: "😰",
    };
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
                    📅 Daily Report
                </h3>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Date</label>
                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
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
                        <label style={labelStyle}>Hours Worked</label>
                        <input
                            type="number"
                            step={0.5}
                            min={0}
                            max={24}
                            value={form.hoursWorked}
                            onChange={(e) => setForm({ ...form, hoursWorked: +e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Tasks Completed</label>
                        <input
                            type="number"
                            min={0}
                            value={form.tasksDone}
                            onChange={(e) => setForm({ ...form, tasksDone: +e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Mood</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {MOODS.map((m) => (
                            <button
                                key={m}
                                onClick={() => setForm({ ...form, mood: m })}
                                style={{
                                    background: form.mood === m ? project.color + "33" : "#080810",
                                    border: `1px solid ${form.mood === m ? project.color : "#1a1a2e"
                                        }`,
                                    color: form.mood === m ? project.color : "#666",
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontFamily: "monospace",
                                }}
                            >
                                {moodEmoji[m]} {m}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Focus Score (1-10): {form.focusScore}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: "#555" }}>1</span>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={form.focusScore}
                            onChange={(e) => setForm({ ...form, focusScore: +e.target.value })}
                            style={{ flex: 1, accentColor: project.color }}
                        />
                        <span style={{ fontSize: 10, color: "#555" }}>10</span>
                    </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Notes</label>
                    <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="What did you accomplish?"
                        rows={3}
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
                        disabled={saving}
                        onClick={() => onSave(form)}
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
                        {saving ? "Saving..." : "Save Report"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
