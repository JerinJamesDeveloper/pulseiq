const app = require('./src/app');
require('dotenv').config();
const SyncService = require('./src/services/syncService');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/api/health`);
});

// Run sync every 5 minutes (in production)
if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
        try {
            const processed = await SyncService.processSyncQueue();
            if (processed > 0) {
                console.log(`✅ Synced ${processed} items from queue`);
            }
        } catch (error) {
            console.error('❌ Sync error:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes

    // Clean old records daily
    setInterval(async () => {
        try {
            const cleaned = await SyncService.cleanOldRecords();
            console.log(`🧹 Cleaned ${cleaned} old sync records`);
        } catch (error) {
            console.error('❌ Cleanup error:', error);
        }
    }, 24 * 60 * 60 * 1000); // 24 hours
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

module.exports = server;