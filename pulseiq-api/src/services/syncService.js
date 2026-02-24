const { pool } = require('../config/database');
const Project = require('../models/Project');
const LearningEntry = require('../models/LearningEntry');
const DailyReport = require('../models/DailyReport');
const Documentation = require('../models/Documentation');
const Goal = require('../models/Goal');

class SyncService {
    // Add operation to sync queue
    static async addToQueue(entityType, operation, payload, entityId = null) {
        const [result] = await pool.query(
            `INSERT INTO sync_queue (entityType, entityId, operation, payload)
             VALUES (?, ?, ?, ?)`,
            [entityType, entityId, operation, JSON.stringify(payload)]
        );
        return result.insertId;
    }

    // Process pending sync operations
    static async processSyncQueue() {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get pending operations
            const [pending] = await connection.query(
                `SELECT * FROM sync_queue 
                 WHERE status = 'pending' 
                 ORDER BY createdAt ASC 
                 LIMIT 10`
            );

            for (const item of pending) {
                try {
                    // Update status to processing
                    await connection.query(
                        'UPDATE sync_queue SET status = ? WHERE id = ?',
                        ['processing', item.id]
                    );

                    // Process based on entity type and operation
                    await this.processSyncItem(item);

                    // Mark as completed
                    await connection.query(
                        'UPDATE sync_queue SET status = ? WHERE id = ?',
                        ['completed', item.id]
                    );
                } catch (error) {
                    // Increment retry count
                    await connection.query(
                        `UPDATE sync_queue 
                         SET status = ?, retryCount = retryCount + 1 
                         WHERE id = ?`,
                        [item.retryCount >= 2 ? 'failed' : 'pending', item.id]
                    );
                    console.error(`Failed to sync item ${item.id}:`, error);
                }
            }

            await connection.commit();
            return pending.length;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Process individual sync item
    static async processSyncItem(item) {
        const payload = JSON.parse(item.payload);

        switch (item.entityType) {
            case 'project':
                await this.syncProject(item.operation, payload, item.entityId);
                break;
            case 'learning':
                await this.syncLearning(item.operation, payload, item.entityId);
                break;
            case 'report':
                await this.syncReport(item.operation, payload, item.entityId);
                break;
            case 'doc':
                await this.syncDocumentation(item.operation, payload, item.entityId);
                break;
            case 'goal':
                await this.syncGoal(item.operation, payload, item.entityId);
                break;
        }
    }

    static async syncProject(operation, payload, entityId) {
        switch (operation) {
            case 'CREATE':
                await Project.create(payload);
                break;
            case 'UPDATE':
                await Project.update(entityId, payload);
                break;
            case 'DELETE':
                await Project.delete(entityId);
                break;
        }
    }

    static async syncLearning(operation, payload, entityId) {
        const { projectId, ...data } = payload;
        switch (operation) {
            case 'CREATE':
                await LearningEntry.create(projectId, data);
                break;
            case 'UPDATE':
                await LearningEntry.update(entityId, data);
                break;
            case 'DELETE':
                await LearningEntry.delete(entityId);
                break;
        }
    }

    static async syncReport(operation, payload, entityId) {
        const { projectId, ...data } = payload;
        switch (operation) {
            case 'CREATE':
                await DailyReport.create(projectId, data);
                break;
            case 'UPDATE':
                await DailyReport.update(entityId, data);
                break;
            case 'DELETE':
                await DailyReport.delete(entityId);
                break;
        }
    }

    static async syncDocumentation(operation, payload, entityId) {
        const { projectId, ...data } = payload;
        switch (operation) {
            case 'CREATE':
                await Documentation.create(projectId, data);
                break;
            case 'UPDATE':
                await Documentation.update(entityId, data);
                break;
            case 'DELETE':
                await Documentation.delete(entityId);
                break;
        }
    }

    static async syncGoal(operation, payload, entityId) {
        const { projectId, ...data } = payload;
        switch (operation) {
            case 'CREATE':
                await Goal.create(projectId, data);
                break;
            case 'UPDATE':
                await Goal.update(entityId, data);
                break;
            case 'DELETE':
                await Goal.delete(entityId);
                break;
        }
    }

    // Get sync status
    static async getSyncStatus() {
        const [stats] = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count,
                MIN(createdAt) as oldestItem,
                MAX(createdAt) as newestItem
            FROM sync_queue
            GROUP BY status
        `);

        return stats;
    }

    // Clear old sync records
    static async cleanOldRecords(days = 7) {
        const [result] = await pool.query(
            `DELETE FROM sync_queue 
             WHERE status IN ('completed', 'failed') 
             AND createdAt < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [days]
        );
        return result.affectedRows;
    }
}

module.exports = SyncService;