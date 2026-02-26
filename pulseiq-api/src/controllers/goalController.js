const Goal = require('../models/Goal');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

const goalController = {
    // GET /api/projects/:projectId/goals
    getProjectGoals: async (req, res, next) => {
        try {
            const project = await Project.findById(req.params.projectId);
            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.projectId} not found`,
                    statusCode: 404
                });
            }

            const goals = await Goal.findByProjectId(req.params.projectId);
            res.json({
                data: goals,
                total: goals.length,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/projects/:projectId/goals/:id
    getGoalById: async (req, res, next) => {
        try {
            const goal = await Goal.findById(req.params.id);
            if (!goal) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Goal with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.json({
                data: goal,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/projects/:projectId/goals
    createGoal: async (req, res, next) => {
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

            const goalId = await Goal.create(req.params.projectId, req.body);
            const newGoal = await Goal.findById(goalId);
            
            res.status(201).json({
                data: newGoal,
                message: 'Goal created successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/projects/:projectId/goals/:id
    updateGoal: async (req, res, next) => {
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

            const goal = await Goal.findById(req.params.id);
            if (!goal) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Goal with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            const updated = await Goal.update(req.params.id, req.body);
            if (!updated) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'No valid updatable fields provided',
                    statusCode: 400
                });
            }
            const updatedGoal = await Goal.findById(req.params.id);
            
            res.json({
                data: updatedGoal,
                message: 'Goal updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/projects/:projectId/goals/:id
    deleteGoal: async (req, res, next) => {
        try {
            const deleted = await Goal.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Goal with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

module.exports = goalController;
