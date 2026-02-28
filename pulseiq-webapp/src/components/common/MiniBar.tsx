// MiniBar.tsx

export function MiniBar({
    value,
    max,
    color,
    height = 24,
}: {
    value: number;
    max: number;
    color: string;
    height?: number;
}) {
    const safeValue = value || 0;
    const safeMax = max || 1;
    const pct = safeMax > 0 ? Math.min(100, (safeValue / safeMax) * 100) : 0;
    return (
        <div
            style={{
                background: "#1a1a2e",
                borderRadius: 4,
                overflow: "hidden",
                height,
                flex: 1,
            }}
        >
            <div
                style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: color,
                    transition: "width 1s ease",
                    borderRadius: 4,
                }}
            />
        </div>
    );
}
