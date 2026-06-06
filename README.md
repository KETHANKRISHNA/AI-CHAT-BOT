# AI Chat Bot

A React and Express AI chat app powered by LangChain and Google Gemini. The app includes a ChatGPT-style interface named KETONE and a small tool-using agent backend.

## Features

- Gemini 2.5 Flash chat responses
- LangChain agent with tool calling
- Calculator tool for arithmetic and percentages
- Current time tool with time zone support
- Text statistics tool for word, sentence, character, and reading-time analysis
- React frontend served through Vite in development
- Express API backend

## Tech Stack

- React
- TypeScript
- Vite
- Express
- LangChain
- Google Gemini API

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```

Start the local development server:

```bash
npm run dev
```

Open the app:

```text
http://127.0.0.1:5175/
```

## Available Scripts

```bash
npm run dev
```

Runs the Express server and Vite development middleware.

```bash
npm run build
```

Builds the TypeScript and Vite production bundle.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run preview
```

Runs the server in preview mode.

## API

`POST /api/agent`

Sends chat messages to the LangChain agent.

`GET /api/tools`

Returns the available agent tools.

## Environment Variables

| Name | Description |
| --- | --- |
| `GEMINI_API_KEY` | Google AI Studio API key used by the Gemini model |
| `PORT` | Optional server port. Defaults to `5175` |

## Notes

- Keep `.env` private and do not commit real API keys.
- The example environment file is available at `.env.example`.
