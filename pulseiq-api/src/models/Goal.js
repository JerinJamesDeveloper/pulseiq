const { pool } = require('../config/database');

class Goal {
    static async findByProjectId(projectId) {
        const [goals] = await pool.query(
            'SELECT * FROM goals WHERE projectId = ? ORDER BY createdAt DESC',
            [projectId]
        );
        return goals.map(this.normalizeGoal);
    }

    static async findById(id) {
        const [goals] = await pool.query('SELECT * FROM goals WHERE id = ?', [id]);
        return this.normalizeGoal(goals[0]) || null;
    }

    static async create(projectId, goalData) {
        const [result] = await pool.query(
            `INSERT INTO goals (projectId, title, target, current, category, comments, status, hoursSpent, issueIds, reportIds, taskIds)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                projectId,
                goalData.title,
                goalData.target,
                goalData.current || 0,
                goalData.category,
                goalData.comments || null,
                goalData.status || 'todo',
                goalData.hoursSpent || 0,
                JSON.stringify(goalData.issueIds || []),
                JSON.stringify(goalData.reportIds || []),
                JSON.stringify(goalData.taskIds || [])
            ]
        );
        return result.insertId;
    }

    static async update(id, goalData) {
        const updates = [];
        const values = [];

        const allowedFields = ['title', 'target', 'current', 'category', 'comments', 'status', 'hoursSpent', 'issueIds', 'reportIds', 'taskIds'];

        for (const field of allowedFields) {
            if (goalData[field] !== undefined) {
                updates.push(`${field} = ?`);
                if (['issueIds', 'reportIds', 'taskIds'].includes(field)) {
                    values.push(JSON.stringify(goalData[field]));
                } else {
                    values.push(goalData[field]);
                }
            }
        }

        if (updates.length === 0) return false;

        values.push(id);
        const [result] = await pool.query(
            `UPDATE goals SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM goals WHERE id = ?', [id]);
        return result.affectedRows > 0;
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
}

module.exports = Goal;
