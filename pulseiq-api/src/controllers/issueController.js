const Issue = require('../models/Issue');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

const issueController = {
    // GET /api/projects/:projectId/issues
    getProjectIssues: async (req, res, next) => {
        try {
            const project = await Project.findById(req.params.projectId);
            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.projectId} not found`,
                    statusCode: 404
                });
            }

            const issues = await Issue.findByProjectId(req.params.projectId);
            res.json({
                data: issues,
                total: issues.length,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/projects/:projectId/issues/:id
    getIssueById: async (req, res, next) => {
        try {
            const issue = await Issue.findById(req.params.id);
            if (!issue) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Issue with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            res.json({
                data: issue,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/projects/:projectId/issues
    createIssue: async (req, res, next) => {
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

            const issueId = await Issue.create(req.params.projectId, req.body);
            const newIssue = await Issue.findById(issueId);

            res.status(201).json({
                data: newIssue,
                message: 'Issue created successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/projects/:projectId/issues/:id
    updateIssue: async (req, res, next) => {
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

            const issue = await Issue.findById(req.params.id);
            if (!issue) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Issue with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            const updated = await Issue.update(req.params.id, req.body);
            if (!updated) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'No valid updatable fields provided',
                    statusCode: 400
                });
            }

            const updatedIssue = await Issue.findById(req.params.id);
            res.json({
                data: updatedIssue,
                message: 'Issue updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/projects/:projectId/issues/:id
    deleteIssue: async (req, res, next) => {
        try {
            const deleted = await Issue.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Issue with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

module.exports = issueController;
