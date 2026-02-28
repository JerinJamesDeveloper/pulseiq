import {
    type ProjectDTO,
} from "../api";
import { type Project } from "../types";

export function toFiniteNumber(value: unknown, fallback = 0): number {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function normalizeWeeklyHours(value: unknown): number[] {
    if (Array.isArray(value)) {
        if (value.length > 0 && value[0] && typeof value[0] === "object" && !Array.isArray(value[0])) {
            const rows = value as Record<string, unknown>[];
            const latestRow = rows
                .slice()
                .sort((a, b) => {
                    const aTs = Date.parse(String(a.weekStartDate ?? ""));
                    const bTs = Date.parse(String(b.weekStartDate ?? ""));
                    return (Number.isNaN(bTs) ? 0 : bTs) - (Number.isNaN(aTs) ? 0 : aTs);
                })[0] || {};

            return [
                toFiniteNumber(latestRow.monday, 0),
                toFiniteNumber(latestRow.tuesday, 0),
                toFiniteNumber(latestRow.wednesday, 0),
                toFiniteNumber(latestRow.thursday, 0),
                toFiniteNumber(latestRow.friday, 0),
                toFiniteNumber(latestRow.saturday, 0),
                toFiniteNumber(latestRow.sunday, 0),
            ];
        }

        return value.slice(0, 7).map((n) => toFiniteNumber(n, 0)).concat([0, 0, 0, 0, 0, 0, 0]).slice(0, 7);
    }

    if (value && typeof value === "object") {
        const row = value as Record<string, unknown>;
        return [
            toFiniteNumber(row.monday, 0),
            toFiniteNumber(row.tuesday, 0),
            toFiniteNumber(row.wednesday, 0),
            toFiniteNumber(row.thursday, 0),
            toFiniteNumber(row.friday, 0),
            toFiniteNumber(row.saturday, 0),
            toFiniteNumber(row.sunday, 0),
        ];
    }

    return [0, 0, 0, 0, 0, 0, 0];
}

export function normalizeLanguageDistribution(value: unknown): Record<string, number> {
    if (!value || typeof value !== "object") {
        return {};
    }

    const entries = Object.entries(value as Record<string, unknown>)
        .map(([language, count]) => [language, toFiniteNumber(count, 0)] as const)
        .filter(([, count]) => count > 0);

    if (entries.length === 0) {
        return {};
    }

    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    if (total <= 0) {
        return {};
    }

    let largestIndex = 0;
    for (let i = 1; i < entries.length; i++) {
        if (entries[i][1] > entries[largestIndex][1]) {
            largestIndex = i;
        }
    }

    const normalized = entries.map(([language, count]) => ({
        language,
        percent: Number(((count / total) * 100).toFixed(2)),
    }));

    const roundedTotal = normalized.reduce((sum, item) => sum + item.percent, 0);
    const delta = Number((100 - roundedTotal).toFixed(2));
    if (delta !== 0) {
        normalized[largestIndex].percent = Number((normalized[largestIndex].percent + delta).toFixed(2));
    }

    return normalized.reduce<Record<string, number>>((acc, item) => {
        acc[item.language] = item.percent;
        return acc;
    }, {});
}

export function normalizeGitMetrics(git?: Partial<Project["gitMetrics"]>): Project["gitMetrics"] {
    return {
        commitsByDay: Array.isArray(git?.commitsByDay) ? git!.commitsByDay.map((n) => toFiniteNumber(n, 0)) : [0, 0, 0, 0, 0, 0, 0],
        pullRequests: toFiniteNumber(git?.pullRequests, 0),
        mergedPRs: toFiniteNumber(git?.mergedPRs, 0),
        codeReviews: toFiniteNumber(git?.codeReviews, 0),
        commitMessages: Array.isArray(git?.commitMessages) ? git!.commitMessages : [],
        languages: normalizeLanguageDistribution(git?.languages),
        commitTrend: Array.isArray(git?.commitTrend) ? git!.commitTrend.map((n) => toFiniteNumber(n, 0)) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
}

export function dtoToProject(dto: ProjectDTO): Project {
    const raw = dto as Partial<ProjectDTO>;

    return {
        ...raw,
        techStack: Array.isArray(raw.techStack) ? raw.techStack : [],
        git_repo: raw.git_repo ?? "",
        weeklyHours: normalizeWeeklyHours(raw.weeklyHours),
        monthlyHours: Array.isArray(raw.monthlyHours) ? raw.monthlyHours.map((n) => toFiniteNumber(n, 0)) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        learningEntries: Array.isArray(raw.learningEntries) ? raw.learningEntries : [],
        documentation: Array.isArray(raw.documentation) ? raw.documentation : [],
        dailyReports: Array.isArray(raw.dailyReports) ? raw.dailyReports : [],
        goals: Array.isArray(raw.goals) ? raw.goals : [],
        issues: Array.isArray(raw.issues) ? raw.issues : [],
        gitMetrics: normalizeGitMetrics(raw.gitMetrics as Partial<Project["gitMetrics"]> | undefined),
        lastActive: raw.lastActive ? new Date(raw.lastActive) : new Date(),
        createdDate: raw.createdDate ? new Date(raw.createdDate) : new Date(),
        id: raw.id ?? Date.now(),
        name: raw.name ?? "Untitled Project",
        category: raw.category ?? "General",
        color: raw.color ?? "#00FFB2",
        totalTasks: toFiniteNumber(raw.totalTasks, 0),
        completedTasks: toFiniteNumber(raw.completedTasks, 0),
        features: toFiniteNumber(raw.features, 0),
        bugsFixed: toFiniteNumber(raw.bugsFixed, 0),
        refactors: toFiniteNumber(raw.refactors, 0),
        totalHours: toFiniteNumber(raw.totalHours, 0),
        activeDays: toFiniteNumber(raw.activeDays, 0),
        commits: toFiniteNumber(raw.commits, 0),
        learningPoints: toFiniteNumber(raw.learningPoints, 0),
    } as Project;
}

export function projectToDto(p: Project): ProjectDTO {
    return {
        ...p,
        lastActive: p.lastActive.toISOString(),
        createdDate: p.createdDate.toISOString(),
    };
}

export function extractProjectDto(payload: unknown): ProjectDTO | null {
    const tryObj = (v: unknown): ProjectDTO | null => {
        if (!v || typeof v !== "object") return null;
        const obj = v as Record<string, unknown>;
        return typeof obj.id === "number" && typeof obj.name === "string" ? (obj as unknown as ProjectDTO) : null;
    };

    if (tryObj(payload)) return tryObj(payload);
    if (payload && typeof payload === "object") {
        const obj = payload as Record<string, unknown>;
        const candidates = [
            obj.data,
            obj.body,
            obj.project,
            obj.result,
            (obj.data && typeof obj.data === "object") ? (obj.data as Record<string, unknown>).data : null,
            (obj.body && typeof obj.body === "object") ? (obj.body as Record<string, unknown>).data : null,
            (obj.data && typeof obj.data === "object") ? (obj.data as Record<string, unknown>).body : null,
        ];
        for (const c of candidates) {
            const hit = tryObj(c);
            if (hit) return hit;
        }
    }
    return null;
}
