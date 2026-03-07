const { pool } = require('../config/database');

class Issue {
    static async findByProjectId(projectId) {
        const [issues] = await pool.query(
            'SELECT * FROM issues WHERE projectId = ? ORDER BY dateCreated DESC',
            [projectId]
        );
        return issues;
    }

    static async findById(id) {
        const [issues] = await pool.query('SELECT * FROM issues WHERE id = ?', [id]);
        return issues[0] || null;
    }

    static async create(projectId, issueData) {
        const [result] = await pool.query( 
            `INSERT INTO issues (projectId, title, description, status, priority, githubNumber, timeSpent)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [projectId, issueData.title, issueData.description, issueData.status, issueData.priority, issueData.githubNumber || null, issueData.timeSpent || 0]
        );
        return result.insertId;
    }

    static async update(id, issueData) {
        const updates = [];
        const values = [];

        const allowedFields = ['title', 'description', 'status', 'priority', 'timeSpent'];

        for (const field of allowedFields) {
            if (issueData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(issueData[field]);
            }
        }

        if (updates.length === 0) return false;

        values.push(id);
        const [result] = await pool.query(
            `UPDATE issues SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM issues WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Issue;
