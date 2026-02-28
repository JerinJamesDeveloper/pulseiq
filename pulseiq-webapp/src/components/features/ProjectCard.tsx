// ProjectCard.tsx
import { type Project } from "../../types";
import {
    calcHealth,
    calcCompletion,
    calcProductivityScore,
    calcLearningIntensity,
    calcMomentum,
    getBurnoutRisk,
} from "../../utils/analytics";
import { HealthDot } from "../common/HealthDot";

export function ProjectCard({
    project,
    onClick,
    onDelete,
    onExport,
}: {
    project: Project;
    onClick: (p: Project) => void;
    onDelete: (id: number) => void;
    onExport: (id: number) => Promise<boolean>;
}) {
    const health = calcHealth(project);
    const completion = calcCompletion(project);
    const productivity = calcProductivityScore(project);
    const learning = calcLearningIntensity(project);
    const momentum = calcMomentum(project);
    const burnout = getBurnoutRisk(project);
    // weeklyActivity removed as it was unused
    const burnoutColors: Record<string, string> = {
        Low: "#00FFB2",
        Medium: "#FFD700",
        High: "#FF4444",
    };
    const daysSince = Math.floor(
        (Date.now() - project.lastActive.getTime()) / 86400000
    );

    return (
        <div
            style={{
                background: "#080810",
                border: "1px solid #111122",
                borderRadius: 16,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 80,
                    height: 80,
                    background: `radial-gradient(circle, ${project.color}15 0%, transparent 70%)`,
                    borderRadius: "0 16px 0 80px",
                }}
            />

            <div onClick={() => onClick(project)}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 4,
                            }}
                        >
                            <HealthDot health={health} />
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0" }}>
                                {project.name}
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: 10,
                                color: "#444",
                                fontFamily: "monospace",
                                textTransform: "uppercase",
                                letterSpacing: 1,
                            }}
                        >
                            {project.category} · {daysSince === 0 ? "Today" : `${daysSince}d ago`}
                        </span>
                    </div>
                    <div
                        style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: burnoutColors[burnout] + "15",
                            border: `1px solid ${burnoutColors[burnout]}33`,
                            fontSize: 9,
                            color: burnoutColors[burnout],
                            fontFamily: "monospace",
                        }}
                    >
                        {burnout} RISK
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 16,
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                            }}
                        >
                            <span style={{ fontSize: 10, color: "#555" }}>COMPLETION</span>
                            <span style={{ fontSize: 10, color: project.color }}>
                                {completion}%
                            </span>
                        </div>
                        <div
                            style={{
                                height: 4,
                                background: "#1a1a2e",
                                borderRadius: 2,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: `${completion}%`,
                                    height: "100%",
                                    background: project.color,
                                    borderRadius: 2,
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                            }}
                        >
                            <span style={{ fontSize: 10, color: "#555" }}>MOMENTUM</span>
                            <span style={{ fontSize: 10, color: "#38BDF8" }}>
                                {momentum}%
                            </span>
                        </div>
                        <div
                            style={{
                                height: 4,
                                background: "#1a1a2e",
                                borderRadius: 2,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: `${momentum}%`,
                                    height: "100%",
                                    background: "#38BDF8",
                                    borderRadius: 2,
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>
                                {project.totalHours}
                            </div>
                            <div style={{ fontSize: 8, color: "#444" }}>HOURS</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>
                                {project.commits}
                            </div>
                            <div style={{ fontSize: 8, color: "#444" }}>COMMITS</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>
                                {learning}
                            </div>
                            <div style={{ fontSize: 8, color: "#444" }}>LEARN IQ</div>
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#e0e0e0",
                            fontFamily: "monospace",
                            background: "#111122",
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #1a1a2e",
                        }}
                    >
                        {productivity}
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 12,
                    borderTop: "1px solid #111122",
                    paddingTop: 12,
                }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onExport(project.id);
                    }}
                    style={{
                        background: "transparent",
                        border: "1px solid #333",
                        color: "#666",
                        fontSize: 10,
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                    }}
                >
                    EXCEL
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this project?")) onDelete(project.id);
                    }}
                    style={{
                        background: "transparent",
                        border: "1px solid #442222",
                        color: "#884444",
                        fontSize: 10,
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                    }}
                >
                    DELETE
                </button>
            </div>
        </div>
    );
}
