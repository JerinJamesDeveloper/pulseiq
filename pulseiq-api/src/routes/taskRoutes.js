const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/taskController');

router.get('/', taskController.getProjectTasks);
router.post('/', taskController.validateCreateTask, taskController.createTask);
router.put('/:id', taskController.validateUpdateTask, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
