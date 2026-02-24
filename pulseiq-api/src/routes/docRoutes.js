const express = require('express');
const router = express.Router({ mergeParams: true });
const { body } = require('express-validator');
const docController = require('../controllers/docController');

const docValidation = [
    body('title').isLength({ min: 1, max: 200 }),
    body('content').isLength({ min: 1 }),
    body('status').isIn(['draft', 'in-progress', 'complete']),
    body('date').isISO8601().toDate()
];

router.get('/', docController.getProjectDocs);
router.get('/:id', docController.getDocById);
router.post('/', docValidation, docController.createDoc);
router.put('/:id', docValidation, docController.updateDoc);
router.delete('/:id', docController.deleteDoc);

module.exports = router;