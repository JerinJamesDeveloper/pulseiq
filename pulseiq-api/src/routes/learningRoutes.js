const express = require('express');
const router = express.Router({ mergeParams: true });
const { body } = require('express-validator');
const learningController = require('../controllers/learningController');

const learningValidation = [
    body('concept').isLength({ min: 1, max: 200 }),
    body('category').isIn(['Backend', 'Frontend', 'DevOps', 'Architecture', 'Business']),
    body('difficulty').isInt({ min: 1, max: 5 }),
    body('type').isIn(['New concept', 'Mistake learned', 'Deepened knowledge', 'Optimization']),
    body('confidence').isIn(['Low', 'Medium', 'High']),
    body('dateLogged').isISO8601().toDate(),
    body('timeSpent').isFloat({ min: 0 }),
    body('resources').isArray().optional()
];

router.get('/', learningController.getProjectLearning);
router.get('/:id', learningController.getLearningById);
router.post('/', learningValidation, learningController.createLearning);
router.put('/:id', learningValidation, learningController.updateLearning);
router.delete('/:id', learningController.deleteLearning);

module.exports = router;