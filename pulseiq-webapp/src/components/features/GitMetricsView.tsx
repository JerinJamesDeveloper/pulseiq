// GitMetricsView.tsx
import { type Project } from "../../types";
import { calcGitMetrics } from "../../utils/analytics";
import { WEEKLY_LABELS } from "../../constants";
import { StatCard } from "../common/StatCard";
import { MiniBar } from "../common/MiniBar";

export function GitMetricsView({ project }: { project: Project }) {
    const gm = project.gitMetrics;
    const { commitsPerDay, avgCommits, prMergeRate } = calcGitMetrics(project);
    return (
        <div
            style={{
                background: "#0d0d1a",
                border: "1px solid #1a1a2e",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
            }}
        >
            <div
                style={{
                    fontSize: 14,
                    color: "#e0e0e0",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    marginBottom: 16,
                }}
            >
                📊 Git Metrics
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <StatCard
                    label="Weekly Commits"
                    value={commitsPerDay}
                    sub={`avg: ${avgCommits}/day`}
                    accent={project.color}
                />
                <StatCard
                    label="Pull Requests"
                    value={gm.pullRequests}
                    sub={`${gm.mergedPRs} merged`}
                    accent="#38BDF8"
                />
                <StatCard
                    label="Merge Rate"
                    value={`${prMergeRate}%`}
                    sub="quality"
                    accent="#A78BFA"
                />
                <StatCard
                    label="Code Reviews"
                    value={gm.codeReviews}
                    sub="conducted"
                    accent="#FFD700"
                />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div
                    style={{
                        background: "#080810",
                        border: "1px solid #111122",
                        borderRadius: 10,
                        padding: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: "monospace",
                            marginBottom: 10,
                        }}
                    >
                        COMMITS BY DAY
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: 3,
                            alignItems: "flex-end",
                            height: 60,
                        }}
                    >
                        {gm.commitsByDay.map((val, i) => {
                            const max = Math.max(...gm.commitsByDay, 1);
                            return (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 2,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: 40,
                                            display: "flex",
                                            alignItems: "flex-end",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "100%",
                                                height: `${(val / max) * 40}px`,
                                                background: project.color,
                                                borderRadius: "2px 2px 0 0",
                                                opacity: 0.8,
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: 8, color: "#555" }}>
                                        {WEEKLY_LABELS[i]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div
                    style={{
                        background: "#080810",
                        border: "1px solid #111122",
                        borderRadius: 10,
                        padding: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: "monospace",
                            marginBottom: 10,
                        }}
                    >
                        LANGUAGES
                    </div>
                    {Object.entries(gm.languages).length > 0 ? (
                        Object.entries(gm.languages).map(([lang, pct]) => (
                            <div key={lang} style={{ marginBottom: 8 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: 3,
                                    }}
                                >
                                    <span style={{ fontSize: 11, color: "#ccc" }}>{lang}</span>
                                    <span style={{ fontSize: 10, color: "#666" }}>{pct}%</span>
                                </div>
                                <MiniBar value={pct} max={100} color={project.color} height={4} />
                            </div>
                        ))
                    ) : (
                        <div
                            style={{
                                color: "#555",
                                fontSize: 12,
                                textAlign: "center",
                                padding: 20,
                            }}
                        >
                            No data
                        </div>
                    )}
                </div>
            </div>
            {gm.commitMessages && gm.commitMessages.length > 0 && (
                <div
                    style={{
                        background: "#080810",
                        border: "1px solid #111122",
                        borderRadius: 10,
                        padding: 14,
                        marginTop: 12,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: "monospace",
                            marginBottom: 10,
                        }}
                    >
                        RECENT COMMITS
                    </div>
                    {gm.commitMessages.slice(0, 5).map((msg, i) => (
                        <div
                            key={i}
                            style={{
                                fontSize: 11,
                                color: "#aaa",
                                fontFamily: "monospace",
                                padding: "6px 8px",
                                background: "#0d0d1a",
                                borderRadius: 4,
                                borderLeft: `2px solid ${project.color}`,
                                marginBottom: 4,
                            }}
                        >
                            {msg}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
