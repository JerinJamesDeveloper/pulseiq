const { pool } = require('../config/database');
const LearningEntry = require('./LearningEntry');
const DailyReport = require('./DailyReport');
const Documentation = require('./Documentation');
const Goal = require('./Goal');

class Project {
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

        // Fetch related data for each project
        for (let project of projects) {
            // Parse techStack from JSON string to array
            try {
                project.techStack = project.techStack ? JSON.parse(project.techStack) : [];
                // Filter out null values
                project.techStack = project.techStack.filter(t => t !== null);
            } catch (e) {
                // If parsing fails, initialize as empty array
                project.techStack = [];
            }

            // Get weekly hours
            const [weekly] = await pool.query(
                'SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday FROM weekly_hours WHERE projectId = ? ORDER BY weekStartDate DESC LIMIT 1',
                [project.id]
            );
            project.weeklyHours = weekly.length ?
                [weekly[0].monday, weekly[0].tuesday, weekly[0].wednesday, weekly[0].thursday, weekly[0].friday, weekly[0].saturday, weekly[0].sunday] :
                [0, 0, 0, 0, 0, 0, 0];

            // Get monthly hours (last 15 days)
            const [monthly] = await pool.query(
                'SELECT hours FROM daily_hours WHERE projectId = ? ORDER BY date DESC LIMIT 15',
                [project.id]
            );
            project.monthlyHours = monthly.map(m => m.hours).reverse();

            // Get git metrics
            const [gitMetrics] = await pool.query(
                'SELECT pullRequests, mergedPRs, codeReviews, languages FROM git_metrics WHERE projectId = ?',
                [project.id]
            );

            // Get commit messages
            const [commitMessages] = await pool.query(
                'SELECT message FROM commit_messages WHERE projectId = ? ORDER BY createdAt DESC LIMIT 10',
                [project.id]
            );

            // Get commits by day (last week pattern)
            const [commitsByDay] = await pool.query(
                'SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday FROM commits_by_day WHERE projectId = ? ORDER BY weekStartDate DESC LIMIT 1',
                [project.id]
            );

            // Get commit trend (last 15 days)
            const [commitTrend] = await pool.query(
                'SELECT commitCount FROM commit_trend WHERE projectId = ? ORDER BY date DESC LIMIT 15',
                [project.id]
            );

            // Parse languages if it's a string
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

            // Fetch nested resources in parallel
            try {
                const [learning, reports, docs, goals] = await Promise.all([
                    LearningEntry.findByProjectId(project.id),
                    DailyReport.findByProjectId(project.id),
                    Documentation.findByProjectId(project.id),
                    Goal.findByProjectId(project.id)
                ]);
                project.learningEntries = learning || [];
                project.dailyReports = reports || [];
                project.documentation = docs || [];
                project.goals = goals || [];
            } catch (e) {
                console.error(`Error fetching resources for project ${project.id}:`, e);
                project.learningEntries = [];
                project.dailyReports = [];
                project.documentation = [];
                project.goals = [];
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

        // Parse techStack from JSON string to array
        try {
            project.techStack = project.techStack ? JSON.parse(project.techStack) : [];
            // Filter out null values
            project.techStack = project.techStack.filter(t => t !== null);
        } catch (e) {
            // If parsing fails, initialize as empty array
            project.techStack = [];
        }

        // Get weekly hours
        const [weekly] = await pool.query(
            'SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday FROM weekly_hours WHERE projectId = ? ORDER BY weekStartDate DESC LIMIT 1',
            [project.id]
        );
        project.weeklyHours = weekly.length ?
            [weekly[0].monday, weekly[0].tuesday, weekly[0].wednesday, weekly[0].thursday, weekly[0].friday, weekly[0].saturday, weekly[0].sunday] :
            [0, 0, 0, 0, 0, 0, 0];

        // Get monthly hours (last 15 days)
        const [monthly] = await pool.query(
            'SELECT hours FROM daily_hours WHERE projectId = ? ORDER BY date DESC LIMIT 15',
            [project.id]
        );
        project.monthlyHours = monthly.map(m => m.hours).reverse();

        // Get git metrics
        const [gitMetrics] = await pool.query(
            'SELECT pullRequests, mergedPRs, codeReviews, languages FROM git_metrics WHERE projectId = ?',
            [project.id]
        );

        // Get commit messages
        const [commitMessages] = await pool.query(
            'SELECT message FROM commit_messages WHERE projectId = ? ORDER BY createdAt DESC LIMIT 10',
            [project.id]
        );

        // Get commits by day (last week pattern)
        const [commitsByDay] = await pool.query(
            'SELECT monday, tuesday, wednesday, thursday, friday, saturday, sunday FROM commits_by_day WHERE projectId = ? ORDER BY weekStartDate DESC LIMIT 1',
            [project.id]
        );

        // Get commit trend (last 15 days)
        const [commitTrend] = await pool.query(
            'SELECT commitCount FROM commit_trend WHERE projectId = ? ORDER BY date DESC LIMIT 15',
            [project.id]
        );

        // Parse languages if it's a string
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

        // Fetch nested resources in parallel
        try {
            const [learning, reports, docs, goals] = await Promise.all([
                LearningEntry.findByProjectId(project.id),
                DailyReport.findByProjectId(project.id),
                Documentation.findByProjectId(project.id),
                Goal.findByProjectId(project.id)
            ]);
            project.learningEntries = learning || [];
            project.dailyReports = reports || [];
            project.documentation = docs || [];
            project.goals = goals || [];
        } catch (e) {
            console.error(`Error fetching resources for project ${project.id}:`, e);
            project.learningEntries = [];
            project.dailyReports = [];
            project.documentation = [];
            project.goals = [];
        }

        return project;
    }

    static async create(projectData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert project
            const [result] = await connection.query(
                `INSERT INTO projects (name, category, color, totalTasks, completedTasks, 
                                       features, bugsFixed, refactors, totalHours, activeDays, 
                                       lastActive, commits, learningPoints)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
                [projectData.name, projectData.category, projectData.color,
                projectData.totalTasks || 0, projectData.completedTasks || 0,
                projectData.features || 0, projectData.bugsFixed || 0,
                projectData.refactors || 0, projectData.totalHours || 0,
                projectData.activeDays || 0, projectData.commits || 0,
                projectData.learningPoints || 0]
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

            // Initialize git metrics
            await connection.query(
                `INSERT INTO git_metrics (projectId, pullRequests, mergedPRs, codeReviews, languages)
                 VALUES (?, 0, 0, 0, '{}')`,
                [projectId]
            );

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

            // Build update query dynamically
            const updates = [];
            const values = [];

            const allowedFields = ['name', 'category', 'color', 'totalTasks', 'completedTasks',
                'features', 'bugsFixed', 'refactors', 'totalHours', 'activeDays',
                'commits', 'learningPoints'];

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

            await connection.commit();
            return true;
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