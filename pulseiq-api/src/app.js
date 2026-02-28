const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

if (process.env.DEV_INSECURE_TLS === 'true') {
    // Dev-only escape hatch for environments with HTTPS interception.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.warn('[security] DEV_INSECURE_TLS=true: TLS certificate verification is disabled.');
}

const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const learningRoutes = require('./routes/learningRoutes');
const reportRoutes = require('./routes/reportRoutes');
const docRoutes = require('./routes/docRoutes');
const goalRoutes = require('./routes/goalRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Test database connection
testConnection();

// Middleware
app.use(helmet());
// app.use(cors({
//     origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
// }));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const shouldLogApiTraffic = process.env.LOG_API_REQUESTS === 'true' || process.env.NODE_ENV !== 'production';
if (shouldLogApiTraffic) {
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api')) {
            return next();
        }

        const startedAt = Date.now();
        let responseBody;

        const originalJson = res.json.bind(res);
        res.json = (payload) => {
            responseBody = payload;
            return originalJson(payload);
        };

        const originalSend = res.send.bind(res);
        res.send = (payload) => {
            if (responseBody === undefined) {
                responseBody = payload;
            }
            return originalSend(payload);
        };

        res.on('finish', () => {
            console.log('[api:req]', {
                method: req.method,
                path: req.originalUrl,
                query: req.query,
                body: req.body
            });

            console.log('[api:res]', {
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: Date.now() - startedAt,
                body: responseBody
            });
        });

        next();
    });
}

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
app.use('/api/ai', aiRoutes);

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
