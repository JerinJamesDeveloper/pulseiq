// WeeklyChart.tsx
import { WEEKLY_LABELS } from "../../constants";
import { toFiniteNumber } from "../../utils/converters";

export function WeeklyChart({
    data,
    labels = WEEKLY_LABELS,
    color,
}: {
    data: number[];
    labels?: string[];
    color: string;
}) {
    const rawData = data && data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0];
    const safeData = rawData.map((v) => toFiniteNumber(v, 0));
    const safeLabels =
        labels && labels.length === safeData.length ? labels : WEEKLY_LABELS;
    const max = Math.max(...safeData, 1);
    return (
        <div
            style={{
                display: "flex",
                gap: 4,
                alignItems: "stretch",
                height: 80,
            }}
        >
            {safeData.map((val, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                    }}
                >
                    <span
                        style={{
                            fontSize: 8,
                            color: "#777",
                            fontFamily: "monospace",
                            lineHeight: 1,
                        }}
                    >
                        {val.toFixed(1)}h
                    </span>
                    <div
                        style={{
                            width: "100%",
                            flex: 1,
                            display: "flex",
                            alignItems: "flex-end",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: `${(val / max) * 100}%`,
                                minHeight: val > 0 ? 3 : 0,
                                background: color,
                                borderRadius: "3px 3px 0 0",
                                opacity: 0.85,
                                transition: "height 0.8s ease",
                            }}
                        />
                    </div>
                    <span
                        style={{ fontSize: 8, color: "#555", fontFamily: "monospace" }}
                    >
                        {safeLabels[i]}
                    </span>
                </div>
            ))}
        </div>
    );
}
