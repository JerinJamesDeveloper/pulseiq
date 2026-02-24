const { pool } = require('../config/database');

class Documentation {
    static async findByProjectId(projectId) {
        const [docs] = await pool.query(
            'SELECT * FROM documentation WHERE projectId = ? ORDER BY date DESC',
            [projectId]
        );
        return docs;
    }

    static async findById(id) {
        const [docs] = await pool.query('SELECT * FROM documentation WHERE id = ?', [id]);
        return docs[0] || null;
    }

    static async create(projectId, docData) {
        const [result] = await pool.query(
            `INSERT INTO documentation (projectId, title, content, status, date)
             VALUES (?, ?, ?, ?, ?)`,
            [projectId, docData.title, docData.content, docData.status, docData.date]
        );
        return result.insertId;
    }

    static async update(id, docData) {
        const updates = [];
        const values = [];
        
        const allowedFields = ['title', 'content', 'status', 'date'];
        
        for (const field of allowedFields) {
            if (docData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(docData[field]);
            }
        }

        if (updates.length === 0) return true;

        values.push(id);
        const [result] = await pool.query(
            `UPDATE documentation SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM documentation WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Documentation;