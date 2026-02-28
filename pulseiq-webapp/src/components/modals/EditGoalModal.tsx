import { useState } from "react";
import { type GoalDTO } from "../../api";
import { type Project } from "../../types";
import { inputStyle, selectStyle, labelStyle } from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

export function EditGoalModal({
    project,
    goal,
    onClose,
    onSave,
    saving,
}: {
    project: Project;
    goal: GoalDTO;
    onClose: () => void;
    onSave: (g: GoalDTO) => void;
    saving: boolean;
}) {
    const [form, setForm] = useState({
        title: goal.title,
        target: goal.target,
        current: goal.current,
        category: goal.category,
        comments: goal.comments || "",
        status: goal.status || "todo",
        hoursSpent: goal.hoursSpent || 0,
        issueIds: goal.issueIds || [],
        taskIds: goal.taskIds || [],
        reportIds: goal.reportIds || [],
    });
    const goalCategories = ["Learning", "Quality", "Delivery", "Performance", "DevOps"];

    return (
        <ModalOverlay onClose={onClose}>
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 16,
                    padding: 28,
                    width: 440,
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
                    ✏️ Edit Goal
                </h3>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Goal Title *</label>
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        style={inputStyle}
                    />
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Category</label>
                    <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        style={selectStyle}
                    >
                        {goalCategories.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
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
                            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                            style={selectStyle}
                        >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Hours Spent</label>
                        <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={form.hoursSpent}
                            onChange={(e) => setForm({ ...form, hoursSpent: +e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Comments</label>
                    <textarea
                        value={form.comments}
                        onChange={(e) => setForm({ ...form, comments: e.target.value })}
                        placeholder="Add some notes about this goal..."
                        style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Link Resources</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 150, overflowY: 'auto', padding: 10, background: '#08081a', borderRadius: 8, border: '1px solid #1a1a2e' }}>
                        <div>
                            <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>ISSUES</div>
                            {project.issues?.map(i => (
                                <label key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ccc', marginBottom: 4, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={form.issueIds.includes(i.id)} onChange={e => {
                                        const ids = e.target.checked ? [...form.issueIds, i.id] : form.issueIds.filter(id => id !== i.id);
                                        setForm({ ...form, issueIds: ids });
                                    }} />
                                    {i.title}
                                </label>
                            ))}
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>TASKS</div>
                            {project.tasks?.map(t => (
                                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ccc', marginBottom: 4, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={form.taskIds.includes(t.id)} onChange={e => {
                                        const ids = e.target.checked ? [...form.taskIds, t.id] : form.taskIds.filter(id => id !== t.id);
                                        setForm({ ...form, taskIds: ids });
                                    }} />
                                    {t.title}
                                </label>
                            ))}
                        </div>
                    </div>
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
                            if (!form.title.trim()) return;
                            onSave({
                                ...goal,
                                title: form.title.trim(),
                                target: Math.max(1, form.target),
                                current: Math.max(0, form.current),
                                category: form.category,
                                comments: form.comments,
                                status: form.status,
                                hoursSpent: form.hoursSpent,
                                issueIds: form.issueIds,
                                taskIds: form.taskIds,
                                reportIds: form.reportIds,
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
                        {saving ? "Saving..." : "Update Goal"}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
