import { useState } from "react";
import { type Project } from "../../types";
import { type CreateDailyReportPayload } from "../../api";
import { MOODS, inputStyle, labelStyle } from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

interface ReportForm {
  id: number;
  projectId: number;
  date: string;
  hoursWorked: number;
  tasksDone: number;
  notes: string;
  mood: string;
  focusScore: number;
}

interface DashboardReportsProps {
  projects: Project[];
  onClose: () => void;
  onSave: (projectId: number, payload: CreateDailyReportPayload) => Promise<void>;
  saving: boolean;
}

export function DashboardReports({
  projects,
  onClose,
  onSave,
  saving,
}: DashboardReportsProps) {
  const [reportForms, setReportForms] = useState<ReportForm[]>([
    {
      id: 1,
      projectId: projects[0]?.id || 0,
      date: new Date().toISOString().split("T")[0],
      hoursWorked: 0,
      tasksDone: 0,
      notes: "",
      mood: "productive",
      focusScore: 7,
    },
  ]);
  const [savedCount, setSavedCount] = useState(0);

  const moodEmoji: Record<string, string> = {
    productive: "💪",
    focused: "🎯",
    tired: "😴",
    distracted: "🌀",
    stressed: "😰",
  };

  const addNewReport = () => {
    const newId = Math.max(...reportForms.map((r) => r.id), 0) + 1;
    setReportForms([
      ...reportForms,
      {
        id: newId,
        projectId: projects[0]?.id || 0,
        date: new Date().toISOString().split("T")[0],
        hoursWorked: 0,
        tasksDone: 0,
        notes: "",
        mood: "productive",
        focusScore: 7,
      },
    ]);
  };

  const removeReport = (id: number) => {
    if (reportForms.length > 1) {
      setReportForms(reportForms.filter((r) => r.id !== id));
    }
  };

  const updateReport = <K extends keyof ReportForm>(id: number, field: K, value: ReportForm[K]) => {
    setReportForms(
      reportForms.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSaveAll = async () => {
    for (const form of reportForms) {
      if (form.hoursWorked > 0 || form.tasksDone > 0 || form.notes.trim()) {
        await onSave(form.projectId, {
          date: form.date,
          hoursWorked: form.hoursWorked,
          tasksDone: form.tasksDone,
          notes: form.notes,
          mood: form.mood,
          focusScore: form.focusScore,
        });
        setSavedCount((prev) => prev + 1);
      }
    }
    onClose();
  };

  const handleSaveSingle = async (form: ReportForm) => {
    if (form.hoursWorked > 0 || form.tasksDone > 0 || form.notes.trim()) {
      await onSave(form.projectId, {
        date: form.date,
        hoursWorked: form.hoursWorked,
        tasksDone: form.tasksDone,
        notes: form.notes,
        mood: form.mood,
        focusScore: form.focusScore,
      });
      setSavedCount((prev) => prev + 1);
      // Remove the saved report from forms
      if (reportForms.length > 1) {
        setReportForms(reportForms.filter((r) => r.id !== form.id));
      } else {
        // Reset the form if it's the last one
        setReportForms([
          {
            id: 1,
            projectId: projects[0]?.id || 0,
            date: new Date().toISOString().split("T")[0],
            hoursWorked: 0,
            tasksDone: 0,
            notes: "",
            mood: "productive",
            focusScore: 7,
          },
        ]);
      }
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div
        style={{
          background: "#0d0d1a",
          border: "1px solid #1a1a2e",
          borderRadius: 16,
          padding: 28,
          width: 700,
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#e0e0e0",
              fontFamily: "monospace",
              fontSize: 16,
            }}
          >
            📅 Quick Daily Reports
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#555",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {reportForms.map((form, index) => {
            const project = projects.find((p) => p.id === form.projectId);
            return (
              <div
                key={form.id}
                style={{
                  background: "#080810",
                  border: "1px solid #1a1a2e",
                  borderRadius: 12,
                  padding: 20,
                  position: "relative",
                }}
              >
                {reportForms.length > 1 && (
                  <button
                    onClick={() => removeReport(form.id)}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "transparent",
                      border: "none",
                      color: "#FF4444",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                    title="Remove this report"
                  >
                    ✕
                  </button>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: project?.color || "#00FFB2",
                    }}
                  />
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
                    Report #{index + 1}
                  </span>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Project</label>
                  <select
                    value={form.projectId}
                    onChange={(e) =>
                      updateReport(form.id, "projectId", parseInt(e.target.value))
                    }
                    style={inputStyle}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      updateReport(form.id, "date", e.target.value)
                    }
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
                      onChange={(e) =>
                        updateReport(form.id, "hoursWorked", parseFloat(e.target.value))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tasks Completed</label>
                    <input
                      type="number"
                      min={0}
                      value={form.tasksDone}
                      onChange={(e) =>
                        updateReport(form.id, "tasksDone", parseInt(e.target.value))
                      }
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
                        onClick={() => updateReport(form.id, "mood", m)}
                        style={{
                          background:
                            form.mood === m
                              ? (project?.color || "#00FFB2") + "33"
                              : "#080810",
                          border: `1px solid ${
                            form.mood === m
                              ? project?.color || "#00FFB2"
                              : "#1a1a2e"
                          }`,
                          color: form.mood === m ? project?.color || "#00FFB2" : "#666",
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
                  <label style={labelStyle}>
                    Focus Score (1-10): {form.focusScore}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#555" }}>1</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={form.focusScore}
                      onChange={(e) =>
                        updateReport(form.id, "focusScore", parseInt(e.target.value))
                      }
                      style={{ flex: 1, accentColor: project?.color || "#00FFB2" }}
                    />
                    <span style={{ fontSize: 10, color: "#555" }}>10</span>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      updateReport(form.id, "notes", e.target.value)
                    }
                    placeholder="What did you accomplish?"
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <button
                  onClick={() => handleSaveSingle(form)}
                  disabled={saving}
                  style={{
                    background: project?.color || "#00FFB2",
                    border: "none",
                    color: "#000",
                    padding: "6px 14px",
                    borderRadius: 8,
                    cursor: saving ? "wait" : "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily: "monospace",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save This Report"}
                </button>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
            marginTop: 20,
            paddingTop: 20,
            borderTop: "1px solid #1a1a2e",
          }}
        >
          <button
            onClick={addNewReport}
            style={{
              background: "transparent",
              border: "1px dashed #1a1a2e",
              color: "#38BDF8",
              padding: "10px 20px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> Add Another Project
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            style={{
              background: saving ? "#555" : "#00FFB2",
              border: "none",
              color: "#000",
              padding: "10px 24px",
              borderRadius: 10,
              cursor: saving ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : `Save All Reports (${reportForms.length})`}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

