const Analytics = require('../models/Analytics');

const analyticsController = {
    // GET /api/analytics/overview
    getOverview: async (req, res, next) => {
        try {
            const overview = await Analytics.getOverview();
            res.json({
                data: overview,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/analytics/project/:projectId
    getProjectAnalytics: async (req, res, next) => {
        try {
            const analytics = await Analytics.getProjectAnalytics(req.params.projectId);
            res.json({
                data: analytics,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/analytics/learning/trends
    getLearningTrends: async (req, res, next) => {
        try {
            const trends = await Analytics.getLearningTrends();
            res.json({
                data: trends,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/analytics/productivity/timeline
    getProductivityTimeline: async (req, res, next) => {
        try {
            const timeline = await Analytics.getProductivityTimeline();
            res.json({
                data: timeline,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = analyticsController;