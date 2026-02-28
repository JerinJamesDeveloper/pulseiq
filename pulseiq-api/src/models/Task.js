const { pool } = require('../config/database');

class Task {
    static async findByProjectId(projectId) {
        const [tasks] = await pool.query(
            'SELECT * FROM tasks WHERE projectId = ? ORDER BY dateCreated DESC',
            [projectId]
        );
        return tasks;
    }

    static async findById(id) {
        const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
        return tasks[0] || null;
    }

    static async create(projectId, taskData) {
        const [result] = await pool.query(
            'INSERT INTO tasks (projectId, title, status) VALUES (?, ?, ?)',
            [projectId, taskData.title, taskData.status || 'todo']
        );
        return result.insertId;
    }

    static async update(id, taskData) {
        const updates = [];
        const values = [];

        const allowedFields = ['title', 'status'];

        for (const field of allowedFields) {
            if (taskData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(taskData[field]);
            }
        }

        if (updates.length === 0) return false;

        values.push(id);
        const [result] = await pool.query(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Task;
