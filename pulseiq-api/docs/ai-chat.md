# AI Chat API Integration

This document describes the new AI chat endpoint added to the PulseIQ REST API. The feature communicates with the [OpenRouter](https://openrouter.ai/) API to provide conversational responses from an AI model.

## Environment Setup

To use the endpoint, the server must be configured with an OpenRouter API key.

1. Copy the `.env.example` file at the project root to `.env`.
2. Set the following variables:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   # optional, default is gpt-4o-mini
   OPENROUTER_MODEL=gpt-4o-mini
   ```
3. Restart the server if it is running.

> **Note:** The key will not be sent to clients; it is used server-side when making requests to OpenRouter.

## Endpoint Details

### `POST /api/ai/chat`

Sends a chat/completion request to an AI model via OpenRouter.

#### Request Body

Only one of the following is required:

- `prompt` (string) – a simple user prompt.
- `messages` (array) – an array in OpenAI chat format (`{role,content}` objects).

Optional fields:

- `model` (string) – override the default model configured by `OPENROUTER_MODEL`.

Example payloads:

```json
{ "prompt": "Write a haiku about code." }
```

```json
{
  "messages": [
    {"role":"system","content":"You are a helpful assistant."},
    {"role":"user","content":"Tell me a joke."}
  ]
}
```

#### Validation

- `prompt` must be a string if present.
- `messages` must be an array of objects with `role` (`user`, `assistant`, `system`) and `content` (string).
- At least one of `prompt` or a non-empty `messages` array must be provided.

Invalid requests return `400 Bad Request` with details about the error.

#### Response

On success, the server responds with a `200 OK` and a JSON body:

```json
{
  "data": { /* raw OpenRouter response */ },
  "message": "Success",
  "timestamp": "2026-02-26T..."
}
```

The `data` field contains the `choices`, `usage`, and other properties returned by the OpenRouter API.

Errors from the OpenRouter service are propagated with an appropriate HTTP status code and message.

## Server Implementation Overview

- **Controller:** `src/controllers/aiController.js` handles input validation and calls the service.
- **Service:** `src/services/aiService.js` constructs the request payload and calls OpenRouter via the official `@openrouter/sdk` client.
- **Routes:** `src/routes/aiRoutes.js` defines the `/chat` route and applies request validators.
- **App configuration:** `src/app.js` mounts routes under `/api/ai`.

## Testing the Endpoint

Use `curl`, Postman, or any HTTP client to POST to `/api/ai/chat` with valid data. Example:

```bash
curl -X POST http://localhost:3001/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Hello, AI!"}'
```

## Additional Notes

- The Express server must be running for the endpoint to function.
- The feature does not store any chat history; all state is maintained by the client.
- Response latency depends on the OpenRouter API.

---

For any questions regarding integrating or extending this endpoint, see the code comments or reach out to the development team.
