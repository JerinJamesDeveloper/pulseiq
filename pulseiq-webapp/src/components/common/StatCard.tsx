// StatCard.tsx

export function StatCard({
    label,
    value,
    sub,
    accent = "#00FFB2",
}: {
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
}) {
    return (
        <div
            style={{
                background: "#0d0d1a",
                border: "1px solid #1a1a2e",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
            }}
        >
            <span
                style={{
                    fontSize: 11,
                    color: "#555",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    fontFamily: "monospace",
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: accent,
                    fontFamily: "'Courier New', monospace",
                    lineHeight: 1,
                }}
            >
                {value}
            </span>
            {sub && <span style={{ fontSize: 11, color: "#444" }}>{sub}</span>}
        </div>
    );
}
