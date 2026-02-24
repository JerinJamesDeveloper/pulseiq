const { pool } = require('../config/database');

class Analytics {
    static async getOverview() {
        // Get total projects
        const [[{ totalProjects }]] = await pool.query(
            'SELECT COUNT(*) as totalProjects FROM projects'
        );

        // Get total hours
        const [[{ totalHours }]] = await pool.query(
            'SELECT SUM(hoursWorked) as totalHours FROM daily_reports'
        );

        // Get total commits
        const [[{ totalCommits }]] = await pool.query(
            'SELECT SUM(commits) as totalCommits FROM projects'
        );

        // Get total learning points
        const [[{ totalLearningPoints }]] = await pool.query(
            'SELECT SUM(learningPoints) as totalLearningPoints FROM projects'
        );

        // Get total PRs
        const [[{ totalPullRequests }]] = await pool.query(
            'SELECT SUM(pullRequests) as totalPullRequests FROM git_metrics'
        );

        // Get total daily reports
        const [[{ totalDailyReports }]] = await pool.query(
            'SELECT COUNT(*) as totalDailyReports FROM daily_reports'
        );

        // Get total documents
        const [[{ totalDocuments }]] = await pool.query(
            'SELECT COUNT(*) as totalDocuments FROM documentation'
        );

        // Calculate overall productivity (average focus score)
        const [[{ avgFocus }]] = await pool.query(
            'SELECT AVG(focusScore) as avgFocus FROM daily_reports'
        );

        // Get skill distribution from learning entries
        const [skillDistribution] = await pool.query(
            `SELECT category, SUM(timeSpent) as totalTime 
             FROM learning_entries 
             GROUP BY category`
        );

        const skillDist = {
            Backend: 0,
            Frontend: 0,
            DevOps: 0,
            Architecture: 0,
            Business: 0
        };

        skillDistribution.forEach(item => {
            if (skillDist.hasOwnProperty(item.category)) {
                skillDist[item.category] = parseInt(item.totalTime) || 0;
            }
        });

        return {
            totalProjects,
            totalHours: parseInt(totalHours) || 0,
            totalCommits: parseInt(totalCommits) || 0,
            totalLearningPoints: parseInt(totalLearningPoints) || 0,
            totalPullRequests: parseInt(totalPullRequests) || 0,
            totalDailyReports,
            totalDocuments,
            overallProductivity: Math.round(avgFocus * 10) || 0,
            skillDistribution: skillDist
        };
    }

    // Add these methods to the existing Analytics class

static async getProjectAnalytics(projectId) {
    const [project] = await pool.query(`
        SELECT 
            p.*,
            COUNT(DISTINCT le.id) as learningCount,
            COUNT(DISTINCT dr.id) as reportCount,
            COUNT(DISTINCT d.id) as docCount,
            COUNT(DISTINCT g.id) as goalCount,
            AVG(dr.focusScore) as avgFocus,
            SUM(le.timeSpent) as totalLearningTime,
            SUM(CASE WHEN le.category = 'Backend' THEN le.timeSpent ELSE 0 END) as backendTime,
            SUM(CASE WHEN le.category = 'Frontend' THEN le.timeSpent ELSE 0 END) as frontendTime,
            SUM(CASE WHEN le.category = 'DevOps' THEN le.timeSpent ELSE 0 END) as devopsTime,
            SUM(CASE WHEN le.category = 'Architecture' THEN le.timeSpent ELSE 0 END) as architectureTime,
            SUM(CASE WHEN le.category = 'Business' THEN le.timeSpent ELSE 0 END) as businessTime
        FROM projects p
        LEFT JOIN learning_entries le ON p.id = le.projectId
        LEFT JOIN daily_reports dr ON p.id = dr.projectId
        LEFT JOIN documentation d ON p.id = d.projectId
        LEFT JOIN goals g ON p.id = g.projectId
        WHERE p.id = ?
        GROUP BY p.id
    `, [projectId]);

    if (project.length === 0) return null;

    // Get learning trends
    const [learningTrends] = await pool.query(`
        SELECT 
            DATE_FORMAT(dateLogged, '%Y-%m') as month,
            COUNT(*) as count,
            SUM(timeSpent) as totalTime,
            AVG(difficulty) as avgDifficulty
        FROM learning_entries
        WHERE projectId = ?
        GROUP BY DATE_FORMAT(dateLogged, '%Y-%m')
        ORDER BY month DESC
        LIMIT 6
    `, [projectId]);

    // Get productivity trends
    const [productivityTrends] = await pool.query(`
        SELECT 
            date,
            hoursWorked,
            focusScore,
            tasksDone
        FROM daily_reports
        WHERE projectId = ?
        ORDER BY date DESC
        LIMIT 30
    `, [projectId]);

    // Get goal progress
    const [goalProgress] = await pool.query(`
        SELECT 
            category,
            AVG(current / target * 100) as progress
        FROM goals
        WHERE projectId = ?
        GROUP BY category
    `, [projectId]);

    return {
        ...project[0],
        learningTrends,
        productivityTrends,
        goalProgress
    };
}

static async getLearningTrends() {
    const [trends] = await pool.query(`
        SELECT 
            DATE_FORMAT(dateLogged, '%Y-%m') as month,
            category,
            COUNT(*) as count,
            SUM(timeSpent) as totalTime,
            AVG(difficulty) as avgDifficulty
        FROM learning_entries
        WHERE dateLogged >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(dateLogged, '%Y-%m'), category
        ORDER BY month DESC, category
    `);

    return trends;
}

static async getProductivityTimeline(period = 30) {
    const [timeline] = await pool.query(`
        SELECT 
            dr.date,
            AVG(dr.focusScore) as avgFocus,
            SUM(dr.hoursWorked) as totalHours,
            SUM(dr.tasksDone) as totalTasks,
            COUNT(DISTINCT p.id) as activeProjects
        FROM daily_reports dr
        JOIN projects p ON dr.projectId = p.id
        WHERE dr.date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY dr.date
        ORDER BY dr.date
    `, [period]);

    return timeline;
}

static async getSkillDistribution() {
    const [distribution] = await pool.query(`
        SELECT 
            category,
            COUNT(*) as entryCount,
            SUM(timeSpent) as totalTime,
            SUM(difficulty * timeSpent) as weightedScore
        FROM learning_entries
        GROUP BY category
        ORDER BY totalTime DESC
    `);

    return distribution;
}

static async getActivityHeatmap() {
    const [heatmap] = await pool.query(`
        SELECT 
            DAYOFWEEK(date) as dayOfWeek,
            HOUR(createdAt) as hourOfDay,
            COUNT(*) as activityCount
        FROM daily_reports
        WHERE date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
        GROUP BY DAYOFWEEK(date), HOUR(createdAt)
    `);

    return heatmap;
}   
}

module.exports = Analytics;