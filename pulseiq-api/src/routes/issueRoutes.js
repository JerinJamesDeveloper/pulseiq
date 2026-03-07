const express = require('express');
const router = express.Router({ mergeParams: true });
const { body } = require('express-validator');
const issueController = require('../controllers/issueController');

const issueValidation = [
    body('title').isLength({ min: 1, max: 200 }),
    body('description').isLength({ min: 1 }),
    body('status').isIn(['open', 'in-progress', 'resolved', 'closed']),
    body('priority').isIn(['low', 'medium', 'high', 'critical']),
    body('timeSpent').optional().isFloat({ min: 0 })
];

router.get('/', issueController.getProjectIssues);
router.get('/:id', issueController.getIssueById);
router.post('/', issueValidation, issueController.createIssue);
router.put('/:id', issueValidation, issueController.updateIssue);
router.delete('/:id', issueController.deleteIssue);

module.exports = router;
