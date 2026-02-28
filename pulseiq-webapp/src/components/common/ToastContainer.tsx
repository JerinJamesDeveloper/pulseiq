// ToastContainer.tsx
import { type Toast } from "../../types";

export function ToastContainer({
    toasts,
    onDismiss,
}: {
    toasts: Toast[];
    onDismiss: (id: number) => void;
}) {
    const colors = { success: "#00FFB2", error: "#FF4444", info: "#38BDF8" };
    return (
        <div
            style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                zIndex: 200,
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
        >
            {toasts.map((t) => (
                <div
                    key={t.id}
                    onClick={() => onDismiss(t.id)}
                    style={{
                        background: "#0d0d1a",
                        border: `1px solid ${colors[t.type]}66`,
                        borderRadius: 10,
                        padding: "10px 16px",
                        color: colors[t.type],
                        fontSize: 12,
                        fontFamily: "monospace",
                        cursor: "pointer",
                        boxShadow: `0 4px 20px ${colors[t.type]}22`,
                        minWidth: 250,
                        animation: "slideIn 0.3s ease",
                    }}
                >
                    {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}{" "}
                    {t.message}
                </div>
            ))}
        </div>
    );
}
