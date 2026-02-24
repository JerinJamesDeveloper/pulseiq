const Documentation = require('../models/Documentation');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

const docController = {
    // GET /api/projects/:projectId/docs
    getProjectDocs: async (req, res, next) => {
        try {
            const project = await Project.findById(req.params.projectId);
            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.projectId} not found`,
                    statusCode: 404
                });
            }

            const docs = await Documentation.findByProjectId(req.params.projectId);
            res.json({
                data: docs,
                total: docs.length,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/projects/:projectId/docs/:id
    getDocById: async (req, res, next) => {
        try {
            const doc = await Documentation.findById(req.params.id);
            if (!doc) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Document with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.json({
                data: doc,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/projects/:projectId/docs
    createDoc: async (req, res, next) => {
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

            const docId = await Documentation.create(req.params.projectId, req.body);
            const newDoc = await Documentation.findById(docId);
            
            res.status(201).json({
                data: newDoc,
                message: 'Document created successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/projects/:projectId/docs/:id
    updateDoc: async (req, res, next) => {
        try {
            const doc = await Documentation.findById(req.params.id);
            if (!doc) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Document with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            await Documentation.update(req.params.id, req.body);
            const updatedDoc = await Documentation.findById(req.params.id);
            
            res.json({
                data: updatedDoc,
                message: 'Document updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/projects/:projectId/docs/:id
    deleteDoc: async (req, res, next) => {
        try {
            const deleted = await Documentation.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Document with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

module.exports = docController;