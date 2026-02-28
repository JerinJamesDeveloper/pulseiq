// HealthDot.tsx

export function HealthDot({ health }: { health: string }) {
    const c: Record<string, string> = { green: "#00FFB2", yellow: "#FFD700", red: "#FF4444" };
    return (
        <span
            style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: c[health],
                boxShadow: `0 0 8px ${c[health]}`,
                flexShrink: 0,
            }}
        />
    );
}
