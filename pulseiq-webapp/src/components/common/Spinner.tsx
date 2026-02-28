// Spinner.tsx

export function Spinner({
    size = 32,
    color = "#00FFB2",
}: {
    size?: number;
    color?: string;
}) {
    return (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div
                style={{
                    width: size,
                    height: size,
                    border: `3px solid #1a1a2e`,
                    borderTop: `3px solid ${color}`,
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }}
            />
        </div>
    );
}
