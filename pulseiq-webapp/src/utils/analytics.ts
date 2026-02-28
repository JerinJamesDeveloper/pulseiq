import { type Project } from "../types";
import { toFiniteNumber } from "./converters";
import { SKILL_CATS, WEEKLY_LABELS } from "../constants";

export function calcHealth(project: Project): "green" | "yellow" | "red" {
    const daysSince = (Date.now() - project.lastActive.getTime()) / 86400000;
    if (daysSince >= 7) return "red";
    if (daysSince >= 3) return "yellow";
    return "green";
}

export function calcCompletion(p: Project): number {
    const totalTasks = toFiniteNumber(p.totalTasks, 0);
    const completedTasks = toFiniteNumber(p.completedTasks, 0);
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

export function calcProductivityScore(p: Project): number {
    const comp = calcCompletion(p);
    const score = Math.round(
        comp * 0.25 +
        Math.min(toFiniteNumber(p.commits, 0) / 200, 1) * 25 +
        Math.min(toFiniteNumber(p.totalHours, 0) / 400, 1) * 25 +
        Math.min(toFiniteNumber(p.bugsFixed, 0) / 20, 1) * 15 +
        Math.min(toFiniteNumber(p.refactors, 0) / 15, 1) * 10
    );
    return toFiniteNumber(score, 0);
}

export function calcLearningIntensity(p: Project): number {
    const totalHours = toFiniteNumber(p.totalHours, 0);
    const learningPoints = toFiniteNumber(p.learningPoints, 0);
    const pph = totalHours > 0 ? learningPoints / totalHours : 0;

    const categories = p.learningEntries ? new Set(p.learningEntries.map(e => e.category)) : new Set();
    const div = categories.size;

    const avg = p.learningEntries && p.learningEntries.length > 0
        ? p.learningEntries.reduce((a, e) => a + toFiniteNumber(e.difficulty, 0), 0) / p.learningEntries.length
        : 0;

    return Math.min(100, Math.round(pph * 20 + div * 8 + avg * 5));
}

export function calcMomentum(p: Project): number {
    const weeklyHours = (p.weeklyHours || [0, 0, 0, 0, 0, 0, 0]).map((h) => toFiniteNumber(h, 0));
    const recent = weeklyHours.reduce((a, b) => a + b, 0);
    const lastActive = p.lastActive || new Date();
    const recency = Math.max(0, 1 - (Date.now() - lastActive.getTime()) / 86400000 / 14);
    return Math.min(100, Math.round((recent / 35) * 60 * recency + (toFiniteNumber(p.commits, 0) / 200) * 40));
}

export function normalizeSkillCategory(category: unknown): string | null {
    if (typeof category !== "string") return null;
    const key = category.trim().toLowerCase().replace(/[\s_-]+/g, "");
    const map: Record<string, string> = {
        backend: "Backend",
        frontend: "Frontend",
        devops: "DevOps",
        architecture: "Architecture",
        business: "Business",
    };
    return map[key] ?? null;
}

export function getSkillDistribution(projects: Project[]): Record<string, number> {
    const d: Record<string, number> = {};
    SKILL_CATS.forEach(c => d[c] = 0);

    if (projects && projects.length > 0) {
        projects.forEach(p => {
            if (p.learningEntries && p.learningEntries.length > 0) {
                p.learningEntries.forEach(e => {
                    const normalizedCategory = normalizeSkillCategory(e?.category);
                    if (normalizedCategory && d[normalizedCategory] !== undefined) {
                        d[normalizedCategory] += toFiniteNumber(e?.difficulty, 0) * 10;
                    }
                });
            }
        });
    }

    return d;
}

export function getBurnoutRisk(p: Project): string {
    const h = (p.weeklyHours || []).reduce((a, b) => a + toFiniteNumber(b, 0), 0);
    return h > 50 ? "High" : h > 35 ? "Medium" : "Low";
}

export function calcGitMetrics(p: Project) {
    const commitsByDay = p.gitMetrics?.commitsByDay || [0, 0, 0, 0, 0, 0, 0];
    const cpd = commitsByDay.reduce((a, b) => a + b, 0);
    const pullRequests = p.gitMetrics?.pullRequests || 0;
    const mergedPRs = p.gitMetrics?.mergedPRs || 0;

    return {
        commitsPerDay: cpd,
        avgCommits: (cpd / 7).toFixed(1),
        prMergeRate: pullRequests > 0 ? ((mergedPRs / pullRequests) * 100).toFixed(0) : "0"
    };
}

export function getProjectWeeklyActivity(project: Project): { labels: string[]; data: number[] } {
    const normalizedWeekly =
        project.weeklyHours && project.weeklyHours.length === 7
            ? project.weeklyHours.map((n) => toFiniteNumber(n, 0))
            : [0, 0, 0, 0, 0, 0, 0];
    const hasWeeklyFromApi = normalizedWeekly.some((n) => n > 0);
    if (hasWeeklyFromApi) {
        return { labels: WEEKLY_LABELS, data: normalizedWeekly };
    }

    const reports = project.dailyReports || [];

    if (reports.length > 0) {
        const totalsByWeekday = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun

        reports.forEach((report) => {
            if (!report?.date) return;
            const day = new Date(report.date);
            if (Number.isNaN(day.getTime())) return;
            const weekdayIndex = day.getDay() === 0 ? 6 : day.getDay() - 1;
            totalsByWeekday[weekdayIndex] += toFiniteNumber(report.hoursWorked, 0);
        });

        return { labels: WEEKLY_LABELS, data: totalsByWeekday };
    }

    return {
        labels: WEEKLY_LABELS,
        data: normalizedWeekly,
    };
}
