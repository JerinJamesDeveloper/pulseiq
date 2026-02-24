const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/overview', analyticsController.getOverview);
router.get('/project/:projectId', analyticsController.getProjectAnalytics);
router.get('/learning/trends', analyticsController.getLearningTrends);
router.get('/productivity/timeline', analyticsController.getProductivityTimeline);

module.exports = router;