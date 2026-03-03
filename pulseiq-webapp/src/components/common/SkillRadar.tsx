// SkillRadar.tsx
import { type Project } from "../../types";
import { getSkillDistribution } from "../../utils/analytics";

export function SkillRadar({ projects, distribution }: { projects: Project[]; distribution?: Record<string, number> }) {
    const dist = distribution && Object.keys(distribution).length > 0 ? distribution : getSkillDistribution(projects);
    const maxVal = Math.max(...Object.values(dist), 1);
    const cx = 90,
        cy = 90,
        r = 70,
        cats = Object.keys(dist),
        n = cats.length;
    const pts = cats.map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const v = dist[cats[i]] / maxVal;
        return { x: cx + r * v * Math.cos(a), y: cy + r * v * Math.sin(a) };
    });
    const lbl = cats.map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return {
            x: cx + (r + 18) * Math.cos(a),
            y: cy + (r + 18) * Math.sin(a),
            label: cats[i],
        };
    });
    const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const grid = [0.25, 0.5, 0.75, 1].map((s) =>
        cats
            .map((_, i) => {
                const a = (Math.PI * 2 * i) / n - Math.PI / 2;
                return `${cx + r * s * Math.cos(a)},${cy + r * s * Math.sin(a)}`;
            })
            .join(" ")
    );
    return (
        <svg width={180} height={180} style={{ display: "block", margin: "0 auto" }}>
            {grid.map((g, gi) => (
                <polygon
                    key={gi}
                    points={g}
                    fill="none"
                    stroke="#1e1e3a"
                    strokeWidth={1}
                />
            ))}
            {cats.map((_, i) => {
                const a = (Math.PI * 2 * i) / n - Math.PI / 2;
                return (
                    <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={cx + r * Math.cos(a)}
                        y2={cy + r * Math.sin(a)}
                        stroke="#1e1e3a"
                        strokeWidth={1}
                    />
                );
            })}
            <polygon
                points={poly}
                fill="#00FFB222"
                stroke="#00FFB2"
                strokeWidth={1.5}
            />
            {lbl.map((p, i) => (
                <text
                    key={i}
                    x={p.x}
                    y={p.y}
                    fill="#666"
                    fontSize={8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {p.label}
                </text>
            ))}
        </svg>
    );
}
