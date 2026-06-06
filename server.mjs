import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import { z } from 'zod'
import { tool, createAgent } from 'langchain'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 5175)
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY

const calculatorTool = tool(
  ({ expression }) => {
    if (!/^[\d\s+\-*/().,%]+$/.test(expression)) {
      return 'Only basic arithmetic characters are allowed.'
    }

    const normalizedExpression = expression.replaceAll('%', '/100')
    const value = Function(`"use strict"; return (${normalizedExpression})`)()

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 'The expression did not evaluate to a finite number.'
    }

    return String(value)
  },
  {
    name: 'calculator',
    description:
      'Evaluate basic arithmetic expressions. Use this for math, percentages, totals, and comparisons.',
    schema: z.object({
      expression: z.string().describe('A basic arithmetic expression, such as (1250 * 0.18) + 99.'),
    }),
  },
)

const currentTimeTool = tool(
  ({ timeZone }) => {
    const zone = timeZone || 'Asia/Kolkata'
    const date = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: zone,
    }).format(new Date())

    return `${date} (${zone})`
  },
  {
    name: 'current_time',
    description:
      'Get the current date and time. Use this whenever a question asks about now, today, dates, or time zones.',
    schema: z.object({
      timeZone: z.string().optional().describe('An IANA time zone, for example Asia/Kolkata or America/New_York.'),
    }),
  },
)

const textStatsTool = tool(
  ({ text }) => {
    const words = text.trim().split(/\s+/).filter(Boolean)
    const sentences = text.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean)

    return JSON.stringify({
      characters: text.length,
      words: words.length,
      sentences: sentences.length,
      estimatedReadingTimeMinutes: Math.max(1, Math.ceil(words.length / 220)),
    })
  },
  {
    name: 'text_stats',
    description:
      'Analyze text length, word count, sentence count, and estimated reading time.',
    schema: z.object({
      text: z.string().describe('The text to analyze.'),
    }),
  },
)

const tools = [calculatorTool, currentTimeTool, textStatsTool]
const model = apiKey
  ? new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
    })
  : null

const agent = model
  ? createAgent({
      model,
      tools,
      systemPrompt:
        'You are KETONE, a practical AI agent powered by Gemini 2.5 Flash and LangChain. Use tools when they improve accuracy. Mention tool results naturally, not as raw logs, unless the user asks for details.',
    })
  : null

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/tools', (_request, response) => {
  response.json({
    tools: tools.map(({ name, description }) => ({ name, description })),
  })
})

app.post('/api/agent', async (request, response) => {
  if (!agent) {
    response.status(500).json({
      error: 'Missing GEMINI_API_KEY in .env. You can also keep using VITE_GEMINI_API_KEY locally.',
    })
    return
  }

  const parsed = z
    .object({
      messages: z.array(
        z.object({
          role: z.enum(['user', 'model']),
          text: z.string(),
        }),
      ),
    })
    .safeParse(request.body)

  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid chat payload.' })
    return
  }

  try {
    const result = await agent.invoke({
      messages: parsed.data.messages.map((message) => ({
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.text,
      })),
    })

    const lastMessage = result.messages.at(-1)
    const text = Array.isArray(lastMessage?.content)
      ? lastMessage.content
          .map((block) => ('text' in block ? block.text : ''))
          .join('\n')
          .trim()
      : String(lastMessage?.content || '').trim()

    response.json({
      text: text || 'I completed the request, but did not receive a text response.',
    })
  } catch (error) {
    console.error(error)
    response.status(500).json({
      error: error instanceof Error ? error.message : 'The agent could not answer right now.',
    })
  }
})

if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('*', (_request, response) => {
    response.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
} else {
  const { createServer } = await import('vite')
  const vite = await createServer({
    server: {
      hmr: { port: port + 20000 },
      middlewareMode: true,
    },
    appType: 'spa',
  })

  app.use(vite.middlewares)
}

app.listen(port, '127.0.0.1', () => {
  console.log(`Agent server running at http://127.0.0.1:${port}/`)
})
