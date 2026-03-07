const Task = require('../models/Task');
const Project = require('../models/Project');
const { pool } = require('../config/database');
const { body, validationResult } = require('express-validator');

const taskValidationRules = [
    body('title').optional().isLength({ min: 1, max: 200 }),
    body('description').optional({ nullable: true }).isString().isLength({ max: 5000 }),
    body('type').optional({ nullable: true }).isIn(['feature', 'bug', 'improvement', 'research']),
    body('status').optional().isIn(['todo', 'in-progress', 'completed']),
    body('priority').optional({ nullable: true }).isIn(['low', 'medium', 'high', 'critical']),
    body('storyPoints').optional({ nullable: true }).isInt({ min: 0 }),
    body('complexityScore').optional({ nullable: true }).isInt({ min: 0 }),
    body('createdBy').optional({ nullable: true }).isInt({ min: 0 }),
    body('assignedTo').optional({ nullable: true }).isInt({ min: 0 }),
    body('reviewerId').optional({ nullable: true }).isInt({ min: 0 }),
    body('sprintId').optional({ nullable: true }).isInt({ min: 0 }),
    body('milestoneId').optional({ nullable: true }).isInt({ min: 0 }),
    body('estimatedHours').optional({ nullable: true }).isFloat({ min: 0 }),
    body('actualHours').optional({ nullable: true }).isFloat({ min: 0 }),
    body('commitCount').optional({ nullable: true }).isInt({ min: 0 }),
    body('linesAdded').optional({ nullable: true }).isInt({ min: 0 }),
    body('linesRemoved').optional({ nullable: true }).isInt({ min: 0 }),
    body('filesChanged').optional({ nullable: true }).isInt({ min: 0 }),
    body('branchName').optional({ nullable: true }).isString().isLength({ max: 255 }),
    body('pullRequestId').optional({ nullable: true }).isString().isLength({ max: 255 }),
    body('riskLevel').optional({ nullable: true }).isIn(['low', 'medium', 'high']),
    body('impactLevel').optional({ nullable: true }).isIn(['low', 'medium', 'high']),
    body('startDate').optional({ nullable: true }).isISO8601(),
    body('dueDate').optional({ nullable: true }).isISO8601(),
    body('completedAt').optional({ nullable: true }).isISO8601(),
];

const taskController = {
    validateCreateTask: [
        body('title').exists().isLength({ min: 1, max: 200 }),
        ...taskValidationRules,
    ],

    validateUpdateTask: taskValidationRules,

    // GET /api/projects/:projectId/tasks
    getProjectTasks: async (req, res, next) => {
        try {
            const project = await Project.findById(req.params.projectId);
            if (!project) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Project with id ${req.params.projectId} not found`,
                    statusCode: 404
                });
            }

            const tasks = await Task.findByProjectId(req.params.projectId);
            res.json({
                data: tasks,
                total: tasks.length,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/projects/:projectId/tasks
    createTask: async (req, res, next) => {
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

            const taskId = await Task.create(req.params.projectId, req.body);
            const newTask = await Task.findById(taskId);

            res.status(201).json({
                data: newTask,
                message: 'Task created successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/projects/:projectId/tasks/:id
    updateTask: async (req, res, next) => {
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

            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Task with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }

            // Get the old actualHours before update
            const oldActualHours = task.actualHours || 0;

            await Task.update(req.params.id, req.body);
            const updatedTask = await Task.findById(req.params.id);

            // Calculate total hours from tasks and issues for this project
            if (req.body.actualHours !== undefined) {
                const newActualHours = req.body.actualHours || 0;
                const hoursDiff = newActualHours - oldActualHours;

                if (hoursDiff !== 0) {
                    // Get total timeSpent from issues for this project
                    const [issues] = await pool.query(
                        'SELECT COALESCE(SUM(timeSpent), 0) as totalIssueTime FROM issues WHERE projectId = ?',
                        [task.projectId]
                    );
                    const totalIssueTime = issues[0]?.totalIssueTime || 0;

                    // Get total actualHours from all tasks for this project
                    const [taskHours] = await pool.query(
                        'SELECT COALESCE(SUM(actualHours), 0) as totalTaskHours FROM tasks WHERE projectId = ?',
                        [task.projectId]
                    );
                    const totalTaskHours = taskHours[0]?.totalTaskHours || 0;

                    // Update project totalHours = task actualHours + issue timeSpent
                    const newTotalHours = parseFloat(totalTaskHours) + parseFloat(totalIssueTime);
                    await pool.query(
                        'UPDATE projects SET totalHours = ? WHERE id = ?',
                        [newTotalHours, task.projectId]
                    );
                }
            }

            res.json({
                data: updatedTask,
                message: 'Task updated successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/projects/:projectId/tasks/:id
    deleteTask: async (req, res, next) => {
        try {
            const deleted = await Task.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Task with id ${req.params.id} not found`,
                    statusCode: 404
                });
            }
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

module.exports = taskController;
