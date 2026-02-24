require('dotenv').config();
const { pool } = require('../src/config/database');

async function seedDatabase() {
    try {
        console.log('🌱 Seeding database...');

        // Insert sample projects
        const projects = [
            ['NeuralCart', 'E-Commerce', '#00FFB2', 84, 61, 22, 18, 9, 198],
            ['DevOps Pipeline', 'DevOps', '#FF6B6B', 45, 32, 15, 8, 5, 156],
            ['Mobile App', 'Mobile App', '#4ECDC4', 67, 45, 28, 12, 7, 234]
        ];

        for (const project of projects) {
            const [result] = await pool.query(
                `INSERT INTO projects (name, category, color, totalTasks, completedTasks, 
                                      features, bugsFixed, refactors, commits)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                project
            );
            console.log(`✅ Created project: ${project[0]} with ID: ${result.insertId}`);
        }

        console.log('✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Seeding error:', error);
    } finally {
        await pool.end();
    }
}

seedDatabase();