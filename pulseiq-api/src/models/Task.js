const { pool } = require('../config/database');

const TASK_FIELDS = [
    'title',
    'description',
    'type',
    'status',
    'priority',
    'storyPoints',
    'complexityScore',
    'createdBy',
    'assignedTo',
    'reviewerId',
    'sprintId',
    'milestoneId',
    'estimatedHours',
    'actualHours',
    'commitCount',
    'linesAdded',
    'linesRemoved',
    'filesChanged',
    'branchName',
    'pullRequestId',
    'riskLevel',
    'impactLevel',
    'startDate',
    'dueDate',
    'completedAt'
];

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

    static buildCreatePayload(projectId, taskData = {}) {
        const fields = ['projectId'];
        const placeholders = ['?'];
        const values = [projectId];

        for (const field of TASK_FIELDS) {
            if (taskData[field] !== undefined) {
                fields.push(field);
                placeholders.push('?');
                values.push(taskData[field]);
            }
        }

        if (!fields.includes('status')) {
            fields.push('status');
            placeholders.push('?');
            values.push('todo');
        }

        return { fields, placeholders, values };
    }

    static buildUpdatePayload(taskData = {}) {
        const updates = [];
        const values = [];

        for (const field of TASK_FIELDS) {
            if (taskData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(taskData[field]);
            }
        }

        return { updates, values };
    }

    static async create(projectId, taskData) {
        const { fields, placeholders, values } = this.buildCreatePayload(projectId, taskData);
        const [result] = await pool.query(
            `INSERT INTO tasks (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
            values
        );
        return result.insertId;
    }

    static async update(id, taskData) {
        const { updates, values } = this.buildUpdatePayload(taskData);

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
