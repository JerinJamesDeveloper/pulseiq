const LearningEntry = require('../models/LearningEntry');
const Project = require('../models/Project');

const learningController = {
    // GET /api/projects/:projectId/learning
    getProjectLearning: async (req, res, next) => {
        try {
            const project = await Project.findById(req.params.projectId);
            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.projectId} not found`,
                    statusCode: 404
                });
            }

            const entries = await LearningEntry.findByProjectId(req.params.projectId);
            res.json({
                data: entries,
                total: entries.length,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/projects/:projectId/learning/:id
    getLearningById: async (req, res, next) => {
        try {
            const entry = await LearningEntry.findById(req.params.id);
            if (!entry) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Learning entry with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.json({
                data: entry,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/projects/:projectId/learning
    createLearning: async (req, res, next) => {
        try {
            const project = await Project.findById(req.params.projectId);
            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.projectId} not found`,
                    statusCode: 404
                });
            }

            const entryId = await LearningEntry.create(req.params.projectId, req.body);
            const newEntry = await LearningEntry.findById(entryId);
            
            res.status(201).json({
                data: newEntry,
                message: 'Learning entry created successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/projects/:projectId/learning/:id
    updateLearning: async (req, res, next) => {
        try {
            const entry = await LearningEntry.findById(req.params.id);
            if (!entry) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Learning entry with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            await LearningEntry.update(req.params.id, req.body);
            const updatedEntry = await LearningEntry.findById(req.params.id);
            
            res.json({
                data: updatedEntry,
                message: 'Learning entry updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/projects/:projectId/learning/:id
    deleteLearning: async (req, res, next) => {
        try {
            const deleted = await LearningEntry.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Learning entry with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

module.exports = learningController;