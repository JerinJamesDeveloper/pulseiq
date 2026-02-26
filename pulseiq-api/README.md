# PulseIQ API

This repository contains a REST API for the PulseIQ application.  It uses Express and MySQL for data storage.

## Setup

1. Copy `.env.example` to `.env` and supply your configuration values (especially `OPENROUTER_API_KEY` if you want to use the AI chat feature).
2. Install dependencies: `npm install`.
3. Start the server in development: `npm run dev`.

## New AI Chat Endpoint

A new route has been added to interact with an OpenRouter-powered AI model.

- **Endpoint:** `POST /api/ai/chat`
- **Request body:**
  - Either a simple `prompt` string, *or* a `messages` array in the OpenAI chat format:
    ```json
    {
      "prompt": "Hello there"
    }
    // or
    {
      "messages": [
        {"role": "user", "content": "Tell me a joke"}
      ]
    }
    ```
  - Optional `model` to override the default (defaults to `gpt-4o-mini` or the value of `OPENROUTER_MODEL`).
- **Response:** The raw JSON returned by OpenRouter (including `choices`, `usage`, etc.), wrapped under a `data` property.

Validations are applied on input; if neither `prompt` nor `messages` are provided a `400` error is returned.

The request is handled in `src/controllers/aiController.js` with the API call abstracted in `src/services/aiService.js`.

## Git Metrics In Project Endpoints

Project API now supports reading/writing Git metrics as part of project payloads.

- Doc: `docs/git-metrics.md`

## Environment Variables

See `.env.example` for the full list.  At minimum, the AI feature requires:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=gpt-4o-mini  # optional
```


---

Other routes and functionality remain unchanged from earlier versions.
