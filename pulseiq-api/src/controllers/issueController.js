const Issue = require('../models/Issue');
const Project = require('../models/Project');
const GitHubService = require('../services/githubService');
const { pool } = require('../config/database');
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

            if (!project.git_repo) {
                return res.status(400).json({
                    error: 'Configuration Error',
                    message: 'Project git_repo is not configured. Configure repository URL before creating GitHub issues.',
                    statusCode: 400
                });
            }

            const githubIssue = await GitHubService.createIssue(project.git_repo, req.body);
            
            // Add githubNumber to the issue data before saving to database
            const issueData = {
                ...req.body,
                githubNumber: githubIssue.number
            };
            
            const issueId = await Issue.create(req.params.projectId, issueData);
            const newIssue = await Issue.findById(issueId);

            // Recalculate project totalHours when issue is created with timeSpent
            if (req.body.timeSpent > 0) {
                const [issues] = await pool.query(
                    'SELECT COALESCE(SUM(timeSpent), 0) as totalIssueTime FROM issues WHERE projectId = ?',
                    [req.params.projectId]
                );
                const totalIssueTime = issues[0]?.totalIssueTime || 0;

                const [taskHours] = await pool.query(
                    'SELECT COALESCE(SUM(actualHours), 0) as totalTaskHours FROM tasks WHERE projectId = ?',
                    [req.params.projectId]
                );
                const totalTaskHours = taskHours[0]?.totalTaskHours || 0;

                const newTotalHours = parseFloat(totalTaskHours) + parseFloat(totalIssueTime);
                await pool.query(
                    'UPDATE projects SET totalHours = ? WHERE id = ?',
                    [newTotalHours, req.params.projectId]
                );
            }

            res.status(201).json({
                data: {
                    ...newIssue,
                    github: {
                        id: githubIssue.id,
                        number: githubIssue.number,
                        url: githubIssue.html_url
                    }
                },
                message: 'Issue created successfully in PulseIQ and GitHub',
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

            // Sync the update to GitHub if the issue has a GitHub reference
            if (issue.githubNumber) {
                try {
                    const project = await Project.findById(issue.projectId);
                    if (project && project.git_repo) {
                        await GitHubService.updateIssue(project.git_repo, issue.githubNumber, req.body);
                    }
                } catch (githubError) {
                    // Log the error but don't fail the request - local update succeeded
                    console.error('Failed to sync issue to GitHub:', githubError.message);
                }
            }

            // Recalculate project totalHours when issue timeSpent is updated
            if (req.body.timeSpent !== undefined) {
                // Get total timeSpent from all issues for this project
                const [issues] = await pool.query(
                    'SELECT COALESCE(SUM(timeSpent), 0) as totalIssueTime FROM issues WHERE projectId = ?',
                    [issue.projectId]
                );
                const totalIssueTime = issues[0]?.totalIssueTime || 0;

                // Get total actualHours from all tasks for this project
                const [taskHours] = await pool.query(
                    'SELECT COALESCE(SUM(actualHours), 0) as totalTaskHours FROM tasks WHERE projectId = ?',
                    [issue.projectId]
                );
                const totalTaskHours = taskHours[0]?.totalTaskHours || 0;

                // Update project totalHours = task actualHours + issue timeSpent
                const newTotalHours = parseFloat(totalTaskHours) + parseFloat(totalIssueTime);
                await pool.query(
                    'UPDATE projects SET totalHours = ? WHERE id = ?',
                    [newTotalHours, issue.projectId]
                );
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
