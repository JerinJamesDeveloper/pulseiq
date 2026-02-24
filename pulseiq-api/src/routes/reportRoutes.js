const express = require('express');
const router = express.Router({ mergeParams: true });
const { body } = require('express-validator');
const reportController = require('../controllers/reportController');

const reportValidation = [
    body('date').isISO8601().toDate(),
    body('hoursWorked').isFloat({ min: 0, max: 24 }),
    body('tasksDone').isInt({ min: 0 }),
    body('notes').optional().isString(),
    body('mood').isIn(['productive', 'focused', 'tired', 'distracted', 'stressed']),
    body('focusScore').isInt({ min: 1, max: 10 })
];

router.get('/', reportController.getProjectReports);
router.get('/:id', reportController.getReportById);
router.post('/', reportValidation, reportController.createReport);
router.put('/:id', reportValidation, reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;