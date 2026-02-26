const { pool } = require('../config/database');

class LearningEntry {
    static async findByProjectId(projectId) {
        const [entries] = await pool.query(`
            SELECT le.*, JSON_ARRAYAGG(lr.resource) as resources
            FROM learning_entries le
            LEFT JOIN learning_resources lr ON le.id = lr.learningEntryId
            WHERE le.projectId = ?
            GROUP BY le.id
            ORDER BY le.dateLogged DESC
        `, [projectId]);

        return entries.map(entry => ({
            ...entry,
            resources: entry.resources.filter(r => r !== null)
        }));
    }

    static async findById(id) {
        const [entries] = await pool.query(`
            SELECT le.*, JSON_ARRAYAGG(lr.resource) as resources
            FROM learning_entries le
            LEFT JOIN learning_resources lr ON le.id = lr.learningEntryId
            WHERE le.id = ?
            GROUP BY le.id
        `, [id]);

        if (entries.length === 0) return null;
        
        const entry = entries[0];
        entry.resources = entry.resources.filter(r => r !== null);
        return entry;
    }

    static async create(projectId, entryData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO learning_entries 
                 (projectId, concept, category, difficulty, type, confidence, dateLogged, timeSpent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [projectId, entryData.concept, entryData.category, entryData.difficulty,
                 entryData.type, entryData.confidence, entryData.dateLogged, entryData.timeSpent]
            );

            const entryId = result.insertId;

            if (entryData.resources && entryData.resources.length > 0) {
                for (const resource of entryData.resources) {
                    await connection.query(
                        'INSERT INTO learning_resources (learningEntryId, resource) VALUES (?, ?)',
                        [entryId, resource]
                    );
                }
            }

            await connection.commit();
            return entryId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(id, entryData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const updates = [];
            const values = [];
            
            const allowedFields = ['concept', 'category', 'difficulty', 'type', 
                                  'confidence', 'dateLogged', 'timeSpent'];
            
            for (const field of allowedFields) {
                if (entryData[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    values.push(entryData[field]);
                }
            }

            if (updates.length > 0) {
                values.push(id);
                await connection.query(
                    `UPDATE learning_entries SET ${updates.join(', ')} WHERE id = ?`,
                    values
                );
            }

            if (entryData.resources) {
                await connection.query('DELETE FROM learning_resources WHERE learningEntryId = ?', [id]);
                for (const resource of entryData.resources) {
                    await connection.query(
                        'INSERT INTO learning_resources (learningEntryId, resource) VALUES (?, ?)',
                        [id, resource]
                    );
                }
            }

            const hasValidUpdatePayload = updates.length > 0 || entryData.resources !== undefined;

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
        const [result] = await pool.query('DELETE FROM learning_entries WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = LearningEntry;
