const Project = require('../models/Project');
const { validationResult } = require('express-validator');

const projectController = {
    // GET /api/projects/dashboard
    getDashboardData: async (req, res, next) => {
        try {
            const dashboard = await Project.getDashboardData();
            res.json({
                data: dashboard,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/projects
    getAllProjects: async (req, res, next) => {
        try {
            const projects = await Project.findAll();
            res.json({
                data: projects,
                total: projects.length,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/projects/:id
    getProjectById: async (req, res, next) => {
        try {
            if (req.query.refreshGit === 'true') {
                await Project.refreshGitMetricsFromRepo(req.params.id);
            }

            const project = await Project.findById(req.params.id);
            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.json({
                data: project,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/projects/:id/git-metrics
    getProjectGitMetrics: async (req, res, next) => {
        try {
            const refresh = req.query.refresh !== 'false';
            const project = await Project.findById(req.params.id);

            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            if (!project.git_repo) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Project git_repo is not configured',
                    statusCode: 400
                });
            }

            if (refresh) {
                await Project.refreshGitMetricsFromRepo(req.params.id);
            }

            const refreshedProject = await Project.findById(req.params.id);
            res.json({
                data: {
                    projectId: Number(req.params.id),
                    gitRepo: refreshedProject.git_repo,
                    gitMetrics: refreshedProject.gitMetrics
                },
                message: refresh ? 'Git metrics refreshed from GitHub' : 'Git metrics fetched',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/projects
    createProject: async (req, res, next) => {
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

            const projectId = await Project.create(req.body);
            const newProject = await Project.findById(projectId);
            
            res.status(201).json({
                data: newProject,
                message: 'Project created successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/projects/:id
    updateProject: async (req, res, next) => {
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

            const exists = await Project.findById(req.params.id);
            if (!exists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            const updated = await Project.update(req.params.id, req.body);
            if (!updated) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'No valid updatable fields provided',
                    statusCode: 400
                });
            }
            const updatedProject = await Project.findById(req.params.id);
            
            res.json({
                data: updatedProject,
                message: 'Project updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // PATCH /api/projects/:id
    patchProject: async (req, res, next) => {
        try {
            const exists = await Project.findById(req.params.id);
            if (!exists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            const updated = await Project.update(req.params.id, req.body);
            if (!updated) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'No valid updatable fields provided',
                    statusCode: 400
                });
            }
            const patchedProject = await Project.findById(req.params.id);
            
            res.json({
                data: patchedProject,
                message: 'Project updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/projects/:id
    deleteProject: async (req, res, next) => {
        try {
            const deleted = await Project.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

module.exports = projectController;
