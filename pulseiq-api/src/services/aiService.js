const API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'gpt-4o-mini';
const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

let openrouterClientPromise = null;

async function getOpenRouterClient() {
    if (!openrouterClientPromise) {
        openrouterClientPromise = import('@openrouter/sdk').then((sdkModule) => {
            const OpenRouter =
                sdkModule?.OpenRouter ||
                sdkModule?.default?.OpenRouter ||
                sdkModule?.default;

            if (typeof OpenRouter !== 'function') {
                throw new Error('Unable to initialize OpenRouter SDK from module exports');
            }

            return new OpenRouter({
                apiKey: API_KEY,
                serverURL: BASE_URL
            });
        });
    }

    return openrouterClientPromise;
}

class AIService {
    /**
     * Send a chat/completion request to the OpenRouter API.
     * Accepts either a `prompt` string or a full `messages` array.
     *
     * @param {Object} options
     * @param {string} [options.prompt] - simple user prompt
     * @param {Array<{role:string,content:string}>} [options.messages] - message history
     * @param {string} [options.model] - optional model override
     */
    static async chat({ prompt, messages, model }) {
        if (!API_KEY) {
            const err = new Error('OPENROUTER_API_KEY is not configured');
            err.statusCode = 500;
            throw err;
        }

        const payload = {
            chatGenerationParams: {
                model: model || DEFAULT_MODEL,
                messages: messages || [{ role: 'user', content: prompt }]
            }
        };
        try {
            const openrouter = await getOpenRouterClient();
            return await openrouter.chat.send(payload);
        } catch (err) {
            const statusCode = err?.status || err?.statusCode || 502;
            const message = err?.message || 'Unknown OpenRouter SDK error';
            const causeCode = err?.cause?.code ? ` (${err.cause.code})` : '';
            const causeMessage = err?.cause?.message ? `: ${err.cause.message}` : '';
            const error = new Error(`OpenRouter SDK request failed: ${message}${causeCode}${causeMessage}`);
            error.statusCode = statusCode;
            throw error;
        }
    }
}

module.exports = AIService;
