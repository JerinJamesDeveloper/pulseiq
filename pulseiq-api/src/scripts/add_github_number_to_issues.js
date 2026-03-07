const { pool } = require('../config/database');

async function addGithubNumberAndTimeSpentColumns() {
    try {
        // Get existing columns
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'pulseiq' 
            AND TABLE_NAME = 'issues'
        `);

        const existingColumns = columns.map(c => c.COLUMN_NAME);

        // Add githubNumber if it doesn't exist
        if (!existingColumns.includes('githubNumber')) {
            await pool.query(`
                ALTER TABLE issues ADD COLUMN githubNumber INT NULL
            `);
            console.log('Added githubNumber column to issues table.');
        } else {
            console.log('Column githubNumber already exists.');
        }

        // Add timeSpent if it doesn't exist
        if (!existingColumns.includes('timeSpent')) {
            await pool.query(`
                ALTER TABLE issues ADD COLUMN timeSpent DECIMAL(10,2) DEFAULT 0
            `);
            console.log('Added timeSpent column to issues table.');
        } else {
            console.log('Column timeSpent already exists.');
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Error running migration:', error.message);
    } finally {
        process.exit(0);
    }
}

addGithubNumberAndTimeSpentColumns();

