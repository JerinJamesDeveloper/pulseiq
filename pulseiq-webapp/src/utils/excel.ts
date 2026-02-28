import * as XLSX from "xlsx";
import { type ProjectDTO } from "../api";
import { toFiniteNumber, normalizeWeeklyHours } from "./converters";
import { WEEKLY_LABELS } from "../constants";

export function downloadProjectExcel(dto: ProjectDTO): Blob {
    const wb = XLSX.utils.book_new();
    const raw = dto as unknown as Record<string, unknown>;
    const projectName = typeof raw.name === "string" ? raw.name : `project-${raw.id ?? "data"}`;

    const summary = [{
        id: raw.id ?? "",
        name: raw.name ?? "",
        category: raw.category ?? "",
        color: raw.color ?? "",
        totalTasks: toFiniteNumber(raw.totalTasks, 0),
        completedTasks: toFiniteNumber(raw.completedTasks, 0),
        features: toFiniteNumber(raw.features, 0),
        bugsFixed: toFiniteNumber(raw.bugsFixed, 0),
        refactors: toFiniteNumber(raw.refactors, 0),
        totalHours: toFiniteNumber(raw.totalHours, 0),
        activeDays: toFiniteNumber(raw.activeDays, 0),
        commits: toFiniteNumber(raw.commits, 0),
        learningPoints: toFiniteNumber(raw.learningPoints, 0),
        git_repo: raw.git_repo ?? "",
        lastActive: raw.lastActive ?? "",
        createdDate: raw.createdDate ?? "",
        updatedAt: raw.updatedAt ?? "",
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Project");

    const techStack = Array.isArray(raw.techStack) ? raw.techStack.map((tech, i) => ({ index: i + 1, tech })) : [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(techStack), "TechStack");

    const weekly = normalizeWeeklyHours(raw.weeklyHours).map((hours, i) => ({ day: WEEKLY_LABELS[i], hours }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(weekly), "WeeklyHours");

    const monthlyHours = Array.isArray(raw.monthlyHours) ? raw.monthlyHours : [];
    const monthly = monthlyHours.map((hours, i) => ({ dayIndex: i + 1, hours: toFiniteNumber(hours, 0) }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthly), "MonthlyHours");

    const learningEntries = Array.isArray(raw.learningEntries) ? raw.learningEntries : [];
    const learning = learningEntries.map((e) => {
        const row = e as Record<string, unknown>;
        return {
            projectId: raw.id ?? "",
            projectName: raw.name ?? "",
            id: row.id ?? "",
            concept: row.concept ?? "",
            category: row.category ?? "",
            difficulty: toFiniteNumber(row.difficulty, 0),
            type: row.type ?? "",
            confidence: row.confidence ?? "",
            dateLogged: row.dateLogged ?? "",
            timeSpent: toFiniteNumber(row.timeSpent, 0),
            resources: Array.isArray(row.resources) ? row.resources.join(", ") : "",
        };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(learning), "LearningEntries");

    const documentation = Array.isArray(raw.documentation)
        ? (raw.documentation as Record<string, unknown>[]).map((doc) => ({
            projectId: raw.id ?? "",
            projectName: raw.name ?? "",
            id: doc.id ?? "",
            date: doc.date ?? "",
            title: doc.title ?? "",
            content: doc.content ?? "",
            status: doc.status ?? "",
            sections: toFiniteNumber(doc.sections, 0),
            wordCount: toFiniteNumber(doc.wordCount, 0),
        }))
        : [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(documentation), "Documentation");

    const reports = Array.isArray(raw.dailyReports)
        ? (raw.dailyReports as Record<string, unknown>[]).map((report) => ({
            projectId: raw.id ?? "",
            projectName: raw.name ?? "",
            id: report.id ?? "",
            date: report.date ?? "",
            hoursWorked: toFiniteNumber(report.hoursWorked, 0),
            tasksDone: toFiniteNumber(report.tasksDone, 0),
            notes: report.notes ?? "",
            mood: report.mood ?? "",
            focusScore: toFiniteNumber(report.focusScore, 0),
        }))
        : [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reports), "DailyReports");

    const goals = Array.isArray(raw.goals)
        ? (raw.goals as Record<string, unknown>[]).map((goal) => ({
            projectId: raw.id ?? "",
            projectName: raw.name ?? "",
            id: goal.id ?? "",
            title: goal.title ?? "",
            category: goal.category ?? "",
            target: toFiniteNumber(goal.target, 0),
            current: toFiniteNumber(goal.current, 0),
        }))
        : [];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goals), "Goals");

    const gitMetrics = (raw.gitMetrics && typeof raw.gitMetrics === "object") ? raw.gitMetrics as Record<string, unknown> : {};
    const git = [{
        pullRequests: toFiniteNumber(gitMetrics.pullRequests, 0),
        mergedPRs: toFiniteNumber(gitMetrics.mergedPRs, 0),
        codeReviews: toFiniteNumber(gitMetrics.codeReviews, 0),
        commitsByDay: Array.isArray(gitMetrics.commitsByDay) ? gitMetrics.commitsByDay.join(", ") : "",
        commitTrend: Array.isArray(gitMetrics.commitTrend) ? gitMetrics.commitTrend.join(", ") : "",
        commitMessages: Array.isArray(gitMetrics.commitMessages) ? gitMetrics.commitMessages.join(" | ") : "",
        languages: gitMetrics.languages ? JSON.stringify(gitMetrics.languages) : "",
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(git), "GitMetrics");

    const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    const fileName = `${String(projectName).replace(/[^\w.-]+/g, "_")}-export.xlsx`;
    const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return blob;
}
