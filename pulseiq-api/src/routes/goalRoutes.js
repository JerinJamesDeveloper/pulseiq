const express = require('express');
const router = express.Router({ mergeParams: true });
const goalController = require('../controllers/goalController');

router.get('/', goalController.getProjectGoals);
router.get('/:id', goalController.getGoalById);
router.post('/', goalController.validateGoal, goalController.createGoal);
router.put('/:id', goalController.validateGoal, goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

module.exports = router;