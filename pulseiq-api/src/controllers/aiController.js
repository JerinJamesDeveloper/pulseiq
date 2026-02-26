const aiService = require('../services/aiService');

const aiController = {
    // POST /api/ai/chat
    chat: async (req, res, next) => {
        try {
            const { prompt, messages, model } = req.body;

            // at least one of prompt or messages should be provided
            if (!prompt && (!messages || messages.length === 0)) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Either `prompt` or non‑empty `messages` array must be supplied',
                    statusCode: 400
                });
            }

            const aiResponse = await aiService.chat({ prompt, messages, model });

            res.json({
                data: aiResponse,
                message: 'Success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = aiController;
