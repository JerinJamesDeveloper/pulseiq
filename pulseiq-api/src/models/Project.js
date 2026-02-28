const { pool } = require('../config/database');
const GitHubService = require('../services/githubService');

class Project {
    static toNonNegativeNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) && num >= 0 ? num : 0;
    }

    static normalizeGitMetrics(gitMetrics = {}) {
        const commitsByDay = Array.isArray(gitMetrics.commitsByDay)
            ? gitMetrics.commitsByDay.slice(0, 7)
            : [
                gitMetrics.commitsByDay?.monday,
                gitMetrics.commitsByDay?.tuesday,
                gitMetrics.commitsByDay?.wednesday,
                gitMetrics.commitsByDay?.thursday,
                gitMetrics.commitsByDay?.friday,
                gitMetrics.commitsByDay?.saturday,
                gitMetrics.commitsByDay?.sunday
            ];

        const normalizedTrend = Array.isArray(gitMetrics.commitTrend)
            ? gitMetrics.commitTrend.slice(-15)
            : [];

        return {
            pullRequests: this.toNonNegativeNumber(gitMetrics.pullRequests),
            mergedPRs: this.toNonNegativeNumber(gitMetrics.mergedPRs),
            codeReviews: this.toNonNegativeNumber(gitMetrics.codeReviews),
            languages: gitMetrics.languages && typeof gitMetrics.languages === 'object' ? gitMetrics.languages : {},
            commitMessages: Array.isArray(gitMetrics.commitMessages)
                ? gitMetrics.commitMessages.filter(message => typeof message === 'string' && message.trim() !== '').slice(0, 50)
                : [],
            commitsByDay: [
                this.toNonNegativeNumber(commitsByDay[0]),
                this.toNonNegativeNumber(commitsByDay[1]),
                this.toNonNegativeNumber(commitsByDay[2]),
                this.toNonNegativeNumber(commitsByDay[3]),
                this.toNonNegativeNumber(commitsByDay[4]),
                this.toNonNegativeNumber(commitsByDay[5]),
                this.toNonNegativeNumber(commitsByDay[6])
            ],
            commitTrend: normalizedTrend
        };
    }

    static toMysqlDate(value) {
        const date = value ? new Date(value) : new Date();
        if (Number.isNaN(date.getTime())) {
            return new Date().toISOString().slice(0, 10);
        }
        return date.toISOString().slice(0, 10);
    }

    static toResourceArray(value) {
        if (Array.isArray(value)) {
            return value.filter(item => item !== null);
        }

        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed.filter(item => item !== null) : [];
            } catch (e) {
                return [];
            }
        }

        return [];
    }

    static getDocumentationSections(content) {
        if (typeof content !== 'string') return 0;
        const trimmed = content.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\n\s*\n/).filter(Boolean).length;
    }

    static getWordCount(content) {
        if (typeof content !== 'string') return 0;
        const trimmed = content.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).length;
    }

    static async enrichProject(project) {
        try {
            project.techStack = project.techStack ? JSON.parse(project.techStack) : [];
            project.techStack = project.techStack.filter(t => t !== null);
        } catch (e) {
            project.techStack = [];
        }

        const [weekly] = await pool.query(
            'SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday, weekStartDate FROM weekly_hours WHERE projectId = ? ORDER BY weekStartDate DESC LIMIT 1',
            [project.id]
        );
        project.weeklyHours = weekly.length ?
            [weekly[0].monday, weekly[0].tuesday, weekly[0].wednesday, weekly[0].thursday, weekly[0].friday, weekly[0].saturday, weekly[0].sunday] :
            [0, 0, 0, 0, 0, 0, 0];

        const [monthly] = await pool.query(
            'SELECT hours FROM daily_hours WHERE projectId = ? ORDER BY date DESC LIMIT 15',
            [project.id]
        );
        project.monthlyHours = monthly.map(m => m.hours).reverse();

        const [gitMetrics] = await pool.query(
            'SELECT pullRequests, mergedPRs, codeReviews, languages FROM git_metrics WHERE projectId = ?',
            [project.id]
        );

        const [commitMessages] = await pool.query(
            'SELECT message FROM commit_messages WHERE projectId = ? ORDER BY createdAt DESC LIMIT 10',
            [project.id]
        );

        const [commitsByDay] = await pool.query(
            'SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday FROM commits_by_day WHERE projectId = ? ORDER BY weekStartDate DESC LIMIT 1',
            [project.id]
        );

        const [commitTrend] = await pool.query(
            'SELECT commitCount FROM commit_trend WHERE projectId = ? ORDER BY date DESC LIMIT 15',
            [project.id]
        );

        let languages = {};
        if (gitMetrics[0]?.languages) {
            try {
                languages = typeof gitMetrics[0].languages === 'string'
                    ? JSON.parse(gitMetrics[0].languages)
                    : gitMetrics[0].languages;
            } catch (e) {
                languages = {};
            }
        }

        project.gitMetrics = {
            pullRequests: gitMetrics[0]?.pullRequests || 0,
            mergedPRs: gitMetrics[0]?.mergedPRs || 0,
            codeReviews: gitMetrics[0]?.codeReviews || 0,
            commitMessages: commitMessages.map(c => c.message),
            languages: languages,
            commitsByDay: commitsByDay.length ?
                [commitsByDay[0].monday, commitsByDay[0].tuesday, commitsByDay[0].wednesday,
                commitsByDay[0].thursday, commitsByDay[0].friday, commitsByDay[0].saturday, commitsByDay[0].sunday] :
                [0, 0, 0, 0, 0, 0, 0],
            commitTrend: commitTrend.map(c => c.commitCount).reverse()
        };

        const [learningEntries] = await pool.query(`
            SELECT le.id, le.concept, le.category, le.difficulty, le.type, le.confidence, le.dateLogged, le.timeSpent,
                   JSON_ARRAYAGG(lr.resource) as resources
            FROM learning_entries le
            LEFT JOIN learning_resources lr ON le.id = lr.learningEntryId
            WHERE le.projectId = ?
            GROUP BY le.id
            ORDER BY le.dateLogged DESC
        `, [project.id]);
        project.learningEntries = learningEntries.map(entry => ({
            id: entry.id,
            concept: entry.concept,
            category: entry.category,
            difficulty: entry.difficulty,
            type: entry.type,
            confidence: entry.confidence,
            dateLogged: entry.dateLogged,
            timeSpent: entry.timeSpent,
            resources: this.toResourceArray(entry.resources)
        }));

        const [documentation] = await pool.query(
            'SELECT id, date, title, content, status FROM documentation WHERE projectId = ? ORDER BY date DESC',
            [project.id]
        );
        project.documentation = documentation.map(doc => ({
            id: doc.id,
            date: doc.date,
            title: doc.title,
            content: doc.content,
            status: doc.status,
            sections: this.getDocumentationSections(doc.content),
            wordCount: this.getWordCount(doc.content)
        }));

        const [dailyReports] = await pool.query(
            'SELECT id, date, hoursWorked, tasksDone, notes, mood, focusScore FROM daily_reports WHERE projectId = ? ORDER BY date DESC',
            [project.id]
        );
        project.dailyReports = dailyReports.map(report => ({
            id: report.id,
            date: report.date,
            hoursWorked: report.hoursWorked,
            tasksDone: report.tasksDone,
            notes: report.notes,
            mood: report.mood,
            focusScore: report.focusScore
        }));

        const [goals] = await pool.query(
            'SELECT * FROM goals WHERE projectId = ? ORDER BY createdAt DESC',
            [project.id]
        );
        project.goals = goals.map(this.normalizeGoal);

        const [issues] = await pool.query(
            'SELECT id, projectId, title, description, status, priority, dateCreated FROM issues WHERE projectId = ? ORDER BY dateCreated DESC',
            [project.id]
        );
        project.issues = issues;

        const [tasks] = await pool.query(
            'SELECT * FROM tasks WHERE projectId = ? ORDER BY dateCreated DESC',
            [project.id]
        );
        project.tasks = tasks;
    }

    static normalizeGoal(goal) {
        if (!goal) return null;
        try {
            goal.issueIds = typeof goal.issueIds === 'string' ? JSON.parse(goal.issueIds) : (goal.issueIds || []);
            goal.reportIds = typeof goal.reportIds === 'string' ? JSON.parse(goal.reportIds) : (goal.reportIds || []);
            goal.taskIds = typeof goal.taskIds === 'string' ? JSON.parse(goal.taskIds) : (goal.taskIds || []);
        } catch (e) {
            goal.issueIds = [];
            goal.reportIds = [];
            goal.taskIds = [];
        }
        return goal;
    }

    static async upsertGitSnapshot(connection, projectId, gitMetrics = {}) {
        const normalized = this.normalizeGitMetrics(gitMetrics);

        await connection.query(
            `INSERT INTO git_metrics (projectId, pullRequests, mergedPRs, codeReviews, languages)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                pullRequests = VALUES(pullRequests),
                mergedPRs = VALUES(mergedPRs),
                codeReviews = VALUES(codeReviews),
                languages = VALUES(languages)`,
            [
                projectId,
                normalized.pullRequests,
                normalized.mergedPRs,
                normalized.codeReviews,
                JSON.stringify(normalized.languages)
            ]
        );

        await connection.query('DELETE FROM commit_messages WHERE projectId = ?', [projectId]);
        for (const message of normalized.commitMessages) {
            await connection.query(
                'INSERT INTO commit_messages (projectId, message) VALUES (?, ?)',
                [projectId, message]
            );
        }

        await connection.query('DELETE FROM commits_by_day WHERE projectId = ?', [projectId]);
        await connection.query(
            `INSERT INTO commits_by_day (projectId, weekStartDate, monday, tuesday, wednesday, thursday, friday, saturday, sunday)
             VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?)`,
            [projectId, ...normalized.commitsByDay]
        );

        await connection.query('DELETE FROM commit_trend WHERE projectId = ?', [projectId]);
        if (normalized.commitTrend.length > 0) {
            const today = new Date();
            for (let i = 0; i < normalized.commitTrend.length; i++) {
                const item = normalized.commitTrend[i];
                const commitCount = this.toNonNegativeNumber(
                    typeof item === 'object' && item !== null ? item.commitCount : item
                );

                const date = (typeof item === 'object' && item !== null && item.date)
                    ? this.toMysqlDate(item.date)
                    : this.toMysqlDate(new Date(today.getTime() - (normalized.commitTrend.length - 1 - i) * 86400000));

                await connection.query(
                    'INSERT INTO commit_trend (projectId, date, commitCount) VALUES (?, ?, ?)',
                    [projectId, date, commitCount]
                );
            }
        }
    }

    // Get all projects with all related data
    static async findAll() {
        const [projects] = await pool.query(`
SELECT p.*, 
       CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(ts.technology)), ']') as techStack
FROM projects p
LEFT JOIN tech_stack ts ON p.id = ts.projectId
GROUP BY p.id
ORDER BY p.createdDate DESC;
    `);

        for (let project of projects) {
            try {
                project.techStack = project.techStack ? JSON.parse(project.techStack) : [];
                project.techStack = project.techStack.filter(t => t !== null);
            } catch (e) {
                project.techStack = [];
            }
        }

        return projects;
    }
    static async findById(id) {
        const [projects] = await pool.query(`
        SELECT p.*, 
               CONCAT('[', GROUP_CONCAT(DISTINCT JSON_QUOTE(ts.technology)), ']') as techStack
        FROM projects p
        LEFT JOIN tech_stack ts ON p.id = ts.projectId
        WHERE p.id = ?
        GROUP BY p.id
    `, [id]);

        if (projects.length === 0) return null;

        const project = projects[0];
        await this.enrichProject(project);

        return project;
    }

    static async refreshGitMetricsFromRepo(projectId) {
        const [rows] = await pool.query('SELECT git_repo FROM projects WHERE id = ?', [projectId]);
        if (!rows.length) {
            return null;
        }

        const gitRepo = rows[0].git_repo;
        if (!gitRepo) {
            const error = new Error('Project git_repo is not configured');
            error.statusCode = 400;
            throw error;
        }

        const metrics = await GitHubService.fetchRepositoryMetrics(gitRepo);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(
                'UPDATE projects SET commits = ? WHERE id = ?',
                [this.toNonNegativeNumber(metrics.commits), projectId]
            );
            await this.upsertGitSnapshot(connection, projectId, metrics);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return metrics;
    }

    static async create(projectData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const commitsValue = projectData.commits !== undefined
                ? this.toNonNegativeNumber(projectData.commits)
                : this.toNonNegativeNumber(projectData.gitMetrics?.commits);

            // Insert project
            const [result] = await connection.query(
                `INSERT INTO projects (name, category, color, totalTasks, completedTasks, 
                                       features, bugsFixed, refactors, totalHours, activeDays, 
                                       lastActive, commits, learningPoints, git_repo)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
                [projectData.name, projectData.category, projectData.color,
                projectData.totalTasks || 0, projectData.completedTasks || 0,
                projectData.features || 0, projectData.bugsFixed || 0,
                projectData.refactors || 0, projectData.totalHours || 0,
                projectData.activeDays || 0, commitsValue,
                projectData.learningPoints || 0, projectData.git_repo || null]
            );

            const projectId = result.insertId;

            // Insert tech stack
            if (projectData.techStack && projectData.techStack.length > 0) {
                for (const tech of projectData.techStack) {
                    await connection.query(
                        'INSERT INTO tech_stack (projectId, technology) VALUES (?, ?)',
                        [projectId, tech]
                    );
                }
            }

            // Initialize weekly hours
            await connection.query(
                `INSERT INTO weekly_hours (projectId, weekStartDate, monday, tuesday, wednesday, 
                                          thursday, friday, saturday, sunday)
                 VALUES (?, CURDATE(), 0, 0, 0, 0, 0, 0, 0)`,
                [projectId]
            );

            await this.upsertGitSnapshot(connection, projectId, projectData.gitMetrics || {});

            await connection.commit();
            return projectId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(id, projectData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            if (projectData.commits === undefined && projectData.gitMetrics?.commits !== undefined) {
                projectData.commits = this.toNonNegativeNumber(projectData.gitMetrics.commits);
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            const allowedFields = ['name', 'category', 'color', 'totalTasks', 'completedTasks',
                'features', 'bugsFixed', 'refactors', 'totalHours', 'activeDays',
                'commits', 'learningPoints', 'git_repo'];

            for (const field of allowedFields) {
                if (projectData[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    values.push(projectData[field]);
                }
            }

            if (updates.length > 0) {
                values.push(id);
                await connection.query(
                    `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
                    values
                );
            }

            // Update tech stack if provided
            if (projectData.techStack) {
                await connection.query('DELETE FROM tech_stack WHERE projectId = ?', [id]);
                for (const tech of projectData.techStack) {
                    await connection.query(
                        'INSERT INTO tech_stack (projectId, technology) VALUES (?, ?)',
                        [id, tech]
                    );
                }
            }

            if (projectData.gitMetrics) {
                await this.upsertGitSnapshot(connection, id, projectData.gitMetrics);
            }

            const hasValidUpdatePayload = updates.length > 0 || projectData.techStack !== undefined || projectData.gitMetrics !== undefined;

            await connection.commit();
            return hasValidUpdatePayload;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // Add these methods to the existing Project class

    static async getProjectSummary(projectId) {
        const [summary] = await pool.query(`
        SELECT 
            p.*,
            COUNT(DISTINCT le.id) as totalLearningEntries,
            COUNT(DISTINCT dr.id) as totalReports,
            COUNT(DISTINCT d.id) as totalDocs,
            COUNT(DISTINCT g.id) as totalGoals,
            SUM(le.timeSpent) as totalLearningTime,
            AVG(dr.focusScore) as avgFocusScore
        FROM projects p
        LEFT JOIN learning_entries le ON p.id = le.projectId
        LEFT JOIN daily_reports dr ON p.id = dr.projectId
        LEFT JOIN documentation d ON p.id = d.projectId
        LEFT JOIN goals g ON p.id = g.projectId
        WHERE p.id = ?
        GROUP BY p.id
    `, [projectId]);

        return summary[0] || null;
    }

    static async getProjectTimeline(projectId) {
        const [timeline] = await pool.query(`
        SELECT 
            DATE(date) as date,
            SUM(hoursWorked) as hours,
            AVG(focusScore) as focus,
            COUNT(*) as activities
        FROM daily_reports
        WHERE projectId = ?
        GROUP BY DATE(date)
        ORDER BY date DESC
        LIMIT 30
    `, [projectId]);

        return timeline;
    }

    static async updateProjectMetrics(projectId, metrics) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Update git metrics
            await connection.query(`
            UPDATE git_metrics 
            SET pullRequests = pullRequests + ?,
                mergedPRs = mergedPRs + ?,
                codeReviews = codeReviews + ?
            WHERE projectId = ?
        `, [metrics.pullRequests || 0, metrics.mergedPRs || 0, metrics.codeReviews || 0, projectId]);

            // Add commit messages
            if (metrics.commitMessages && metrics.commitMessages.length > 0) {
                for (const message of metrics.commitMessages) {
                    await connection.query(
                        'INSERT INTO commit_messages (projectId, message) VALUES (?, ?)',
                        [projectId, message]
                    );
                }
            }

            // Update commit trend
            const today = new Date().toISOString().split('T')[0];
            await connection.query(`
            INSERT INTO commit_trend (projectId, date, commitCount)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE commitCount = commitCount + ?
        `, [projectId, today, metrics.commits || 0, metrics.commits || 0]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Project;
