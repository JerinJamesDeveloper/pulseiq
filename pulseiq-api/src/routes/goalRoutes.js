const express = require('express');
const router = express.Router({ mergeParams: true });
const { body } = require('express-validator');
const goalController = require('../controllers/goalController');

const goalValidation = [
    body('title').isLength({ min: 1, max: 200 }),
    body('target').isFloat({ min: 0.01 }),
    body('current').isFloat({ min: 0 }).optional(),
    body('category').isIn(['Learning', 'Quality', 'Delivery', 'Performance', 'DevOps'])
];

router.get('/', goalController.getProjectGoals);
router.get('/:id', goalController.getGoalById);
router.post('/', goalValidation, goalController.createGoal);
router.put('/:id', goalValidation, goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

module.exports = router;