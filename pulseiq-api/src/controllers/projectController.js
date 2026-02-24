const Project = require('../models/Project');
const { validationResult } = require('express-validator');

const projectController = {
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
            const exists = await Project.findById(req.params.id);
            if (!exists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            await Project.update(req.params.id, req.body);
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

            await Project.update(req.params.id, req.body);
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