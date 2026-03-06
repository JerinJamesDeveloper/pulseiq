export const CATEGORIES = [
    "E-Commerce",
    "SaaS Tool",
    "DevOps",
    "Mobile App",
    "API Service",
    "Data Pipeline",
    "ML/AI",
    "Open Source",
    "LIMS development",
];
export const COLORS = ["#00FFB2", "#FF6B35", "#A78BFA", "#38BDF8", "#FFD700", "#FF4444", "#00D9FF", "#FF00FF"];
export const WEEKLY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const SKILL_CATS = ["Backend", "Frontend", "DevOps", "Architecture", "Business"];
export const LEARNING_TYPES = ["New concept", "Mistake learned", "Deepened knowledge", "Optimization"];
export const MOODS = ["productive", "focused", "tired", "distracted", "stressed"];
export const DOC_STATUSES = ["draft", "in-progress", "complete"];

export const ISSUE_STATUSES = ["open", "in-progress", "resolved", "closed"];
export const ISSUE_PRIORITIES = ["low", "medium", "high", "critical"];
export const TASK_STATUSES = ["todo", "in-progress", "completed"];
export const TASK_TYPES = ["feature", "bug", "improvement", "research"];
export const TASK_PRIORITIES = ["low", "medium", "high", "critical"];
export const TASK_RISK_LEVELS = ["low", "medium", "high"];
export const TASK_IMPACT_LEVELS = ["low", "medium", "high"];

export const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#080810",
    border: "1px solid #1a1a2e",
    borderRadius: 8,
    color: "#ccc",
    padding: "8px 12px",
    fontSize: 13,
    boxSizing: "border-box",
    fontFamily: "monospace",
    outline: "none",
};
export const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
export const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: "#555",
    display: "block",
    marginBottom: 4,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 1,
};
