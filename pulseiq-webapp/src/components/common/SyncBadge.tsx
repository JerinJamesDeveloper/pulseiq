// SyncBadge.tsx
import { type SyncStatus } from "../../types";

export function SyncBadge({
    status,
    onRetry,
}: {
    status: SyncStatus;
    onRetry: () => void;
}) {
    const config: Record<
        SyncStatus,
        { color: string; bg: string; label: string; icon: string }
    > = {
        synced: {
            color: "#00FFB2",
            bg: "#00FFB215",
            label: "API Connected",
            icon: "●",
        },
        syncing: {
            color: "#38BDF8",
            bg: "#38BDF815",
            label: "Syncing...",
            icon: "◌",
        },
        offline: {
            color: "#FFD700",
            bg: "#FFD70015",
            label: "Offline Mode",
            icon: "○",
        },
        error: { color: "#FF4444", bg: "#FF444415", label: "Sync Error", icon: "✕" },
    };
    const c = config[status];
    return (
        <div
            onClick={status === "offline" || status === "error" ? onRetry : undefined}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: c.bg,
                border: `1px solid ${c.color}44`,
                borderRadius: 6,
                cursor:
                    status === "offline" || status === "error" ? "pointer" : "default",
                fontSize: 10,
                fontFamily: "monospace",
                color: c.color,
                transition: "all 0.2s",
            }}
            title={
                status === "offline"
                    ? "Click to retry connection"
                    : status === "error"
                        ? "Click to retry"
                        : ""
            }
        >
            <span
                style={{
                    fontSize: 8,
                    animation: status === "syncing" ? "spin 1s linear infinite" : "none",
                }}
            >
                {c.icon}
            </span>
            {c.label}
        </div>
    );
}
