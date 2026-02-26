const DailyReport = require('../models/DailyReport');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

const reportController = {
    // GET /api/projects/:projectId/reports
    getProjectReports: async (req, res, next) => {
        try {
            const project = await Project.findById(req.params.projectId);
            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.projectId} not found`,
                    statusCode: 404
                });
            }

            const reports = await DailyReport.findByProjectId(req.params.projectId);
            res.json({
                data: reports,
                total: reports.length,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/projects/:projectId/reports/:id
    getReportById: async (req, res, next) => {
        try {
            const report = await DailyReport.findById(req.params.id);
            if (!report) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Daily report with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.json({
                data: report,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/projects/:projectId/reports
    createReport: async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Invalid input data',
                    statusCode: 400,
                    details: errors.array()
                });
            }

            const project = await Project.findById(req.params.projectId);
            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.projectId} not found`,
                    statusCode: 404
                });
            }

            const reportId = await DailyReport.create(req.params.projectId, req.body);
            const newReport = await DailyReport.findById(reportId);
            
            res.status(201).json({
                data: newReport,
                message: 'Daily report created successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/projects/:projectId/reports/:id
    updateReport: async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Invalid input data',
                    statusCode: 400,
                    details: errors.array()
                });
            }

            const report = await DailyReport.findById(req.params.id);
            if (!report) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Daily report with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            const updated = await DailyReport.update(req.params.id, req.body);
            if (!updated) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'No valid updatable fields provided',
                    statusCode: 400
                });
            }
            const updatedReport = await DailyReport.findById(req.params.id);
            
            res.json({
                data: updatedReport,
                message: 'Daily report updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/projects/:projectId/reports/:id
    deleteReport: async (req, res, next) => {
        try {
            const deleted = await DailyReport.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Daily report with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

module.exports = reportController;
