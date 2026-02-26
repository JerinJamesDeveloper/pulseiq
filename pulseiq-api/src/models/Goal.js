const { pool } = require('../config/database');

class Goal {
    static async findByProjectId(projectId) {
        const [goals] = await pool.query(
            'SELECT * FROM goals WHERE projectId = ? ORDER BY createdAt DESC',
            [projectId]
        );
        return goals;
    }

    static async findById(id) {
        const [goals] = await pool.query('SELECT * FROM goals WHERE id = ?', [id]);
        return goals[0] || null;
    }

    static async create(projectId, goalData) {
        const [result] = await pool.query(
            `INSERT INTO goals (projectId, title, target, current, category)
             VALUES (?, ?, ?, ?, ?)`,
            [projectId, goalData.title, goalData.target, goalData.current || 0, goalData.category]
        );
        return result.insertId;
    }

    static async update(id, goalData) {
        const updates = [];
        const values = [];
        
        const allowedFields = ['title', 'target', 'current', 'category'];
        
        for (const field of allowedFields) {
            if (goalData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(goalData[field]);
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
}

module.exports = Goal;
