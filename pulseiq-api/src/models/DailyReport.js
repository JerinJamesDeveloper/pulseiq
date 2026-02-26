const { pool } = require('../config/database');

class DailyReport {
    static async findByProjectId(projectId) {
        const [reports] = await pool.query(
            'SELECT * FROM daily_reports WHERE projectId = ? ORDER BY date DESC',
            [projectId]
        );
        return reports;
    }

    static async findById(id) {
        const [reports] = await pool.query('SELECT * FROM daily_reports WHERE id = ?', [id]);
        return reports[0] || null;
    }

    static async create(projectId, reportData) {
        const [result] = await pool.query(
            `INSERT INTO daily_reports 
             (projectId, date, hoursWorked, tasksDone, notes, mood, focusScore)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [projectId, reportData.date, reportData.hoursWorked, 
             reportData.tasksDone, reportData.notes || '', 
             reportData.mood, reportData.focusScore]
        );

        // Trigger will handle project updates
        return result.insertId;
    }

    static async update(id, reportData) {
        const updates = [];
        const values = [];
        
        const allowedFields = ['date', 'hoursWorked', 'tasksDone', 'notes', 'mood', 'focusScore'];
        
        for (const field of allowedFields) {
            if (reportData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(reportData[field]);
            }
        }

        if (updates.length === 0) return false;

        values.push(id);
        const [result] = await pool.query(
            `UPDATE daily_reports SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM daily_reports WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = DailyReport;
