// CircleProgress.tsx

export function CircleProgress({
    value,
    size = 80,
    stroke = 7,
    color = "#00FFB2",
    label,
}: {
    value: number;
    size?: number;
    stroke?: number;
    color?: string;
    label?: string;
}) {
    const safeValue = Math.min(100, Math.max(0, value || 0));
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (safeValue / 100) * circ;

    return (
        <div
            style={{
                position: "relative",
                width: size,
                height: size,
                flexShrink: 0,
            }}
        >
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="#1a1a2e"
                    strokeWidth={stroke}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                />
            </svg>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        fontSize: size > 70 ? 16 : 12,
                        fontWeight: 700,
                        color: "#fff",
                        fontFamily: "'Courier New', monospace",
                    }}
                >
                    {safeValue}%
                </span>
                {label && (
                    <span style={{ fontSize: 9, color: "#666", marginTop: 1 }}>
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
}
