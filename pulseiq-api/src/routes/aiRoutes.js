const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const aiController = require('../controllers/aiController');

const router = express.Router();

// POST /api/ai/chat
router.post(
    '/chat',
    [
        body('prompt').optional().isString().withMessage('prompt must be a string'),
        body('messages').optional().isArray().withMessage('messages must be an array'),
        body('messages.*.role')
            .optional()
            .isIn(['user', 'assistant', 'system'])
            .withMessage('each message role must be user, assistant or system'),
        body('messages.*.content')
            .optional()
            .isString()
            .withMessage('each message content must be a string')
    ],
    validate,
    aiController.chat
);

module.exports = router;
