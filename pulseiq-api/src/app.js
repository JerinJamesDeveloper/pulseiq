const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const learningRoutes = require('./routes/learningRoutes');
const reportRoutes = require('./routes/reportRoutes');
const docRoutes = require('./routes/docRoutes');
const goalRoutes = require('./routes/goalRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Test database connection
testConnection();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger); // custom request/response logger

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/learning', learningRoutes);
app.use('/api/projects/:projectId/reports', reportRoutes);
app.use('/api/projects/:projectId/docs', docRoutes);
app.use('/api/projects/:projectId/goals', goalRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`,
        statusCode: 404
    });
});

// Error handler
app.use(errorHandler);

module.exports = app;