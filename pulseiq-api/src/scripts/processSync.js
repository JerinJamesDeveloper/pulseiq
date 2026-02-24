require('dotenv').config();
const SyncService = require('../src/services/syncService');

async function processSync() {
    try {
        console.log('🔄 Processing sync queue...');
        const processed = await SyncService.processSyncQueue();
        console.log(`✅ Processed ${processed} items`);
        
        const status = await SyncService.getSyncStatus();
        console.log('📊 Sync Status:', status);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

processSync();