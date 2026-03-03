const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');

// Validation rules
const projectValidation = [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('category').isIn(['E-Commerce', 'SaaS Tool', 'DevOps', 'Mobile App', 'API Service', 'Data Pipeline', 'ML/AI', 'Open Source', 'LIMS development']),
    body('color').matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid hex color'),
    body('techStack').isArray().optional(),
    body('totalTasks').isInt({ min: 0 }).optional(),
    body('git_repo').optional().isString().withMessage('git_repo must be a string')
];

// Routes
router.get('/', projectController.getAllProjects);
router.get('/dashboard', projectController.getDashboardData);
router.get('/:id/git-metrics', projectController.getProjectGitMetrics);
router.get('/:id', projectController.getProjectById);
router.post('/', projectValidation, projectController.createProject);
router.put('/:id', projectValidation, projectController.updateProject);
router.patch('/:id', projectController.patchProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
