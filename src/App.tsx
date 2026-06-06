import { FormEvent, useRef, useState } from 'react'

const MODEL_NAME = 'gemini-2.5-flash'

const navItems = [
  { icon: 'new', label: 'New chat', active: true },
  { icon: 'search', label: 'Search chats' },
  { icon: 'folder', label: 'Projects' },
  { icon: 'library', label: 'Library' },
  { icon: 'apps', label: 'Apps' },
  { icon: 'spark', label: 'Codex' },
  { icon: 'more', label: 'More' },
]

const promptChips = [
  { icon: 'image', label: 'Calculate' },
  { icon: 'pen', label: 'Analyze text' },
  { icon: 'globe', label: 'Current time' },
]

type ChatMessage = {
  id: string
  role: 'user' | 'model'
  text: string
}

function Icon({ name }: { name: string }) {
  if (name === 'new') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5h7v7" />
        <path d="M18 13v6H5V6h6" />
        <path d="M11 13 19 5" />
      </svg>
    )
  }

  if (name === 'search') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
      </svg>
    )
  }

  if (name === 'folder') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7h7l2 3h9v9H3z" />
      </svg>
    )
  }

  if (name === 'library') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h4v14H4z" />
        <path d="M10 5h4v14h-4z" />
        <path d="m16 5 4 1v13l-4-1z" />
      </svg>
    )
  }

  if (name === 'apps') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    )
  }

  if (name === 'spark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 2.1 4.9L19 10l-4.9 2.1L12 17l-2.1-4.9L5 10l4.9-2.1z" />
        <path d="m5 15 1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
      </svg>
    )
  }

  if (name === 'image') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="3" />
        <circle cx="9" cy="10" r="2" />
        <path d="m7 17 4-4 3 3 2-2 2 3" />
      </svg>
    )
  }

  if (name === 'pen') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 19 4-1 10-10-3-3L6 15z" />
        <path d="m14 7 3 3" />
      </svg>
    )
  }

  if (name === 'globe') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c3 3 3 15 0 18" />
        <path d="M12 3c-3 3-3 15 0 18" />
      </svg>
    )
  }

  if (name === 'send') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12 14-7-4 14-3-6z" />
        <path d="m12 13 7-8" />
      </svg>
    )
  }

  if (name === 'upgrade') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 2.2 6 5.8 3-5.8 3L12 21l-2.2-6L4 12l5.8-3z" />
      </svg>
    )
  }

  if (name === 'panel') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M14 5v14" />
      </svg>
    )
  }

  return <span className="dots" aria-hidden="true">...</span>
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function sendMessage(text: string) {
    const trimmed = text.trim()

    if (!trimmed || isSending) {
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setInput('')
    setError('')
    setIsSending(true)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: nextMessages }),
      })

      const data = (await response.json()) as { text?: string; error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'The agent could not answer right now.')
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'model',
          text: data.text || 'I completed the request, but did not receive a text response.',
        },
      ])
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'Gemini could not answer right now.'
      setError(message)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(input)
  }

  function handleChipClick(label: string) {
    const prompt =
      label === 'Calculate'
        ? 'Use your calculator tool: what is 18% of 1250 plus 99?'
        : label === 'Analyze text'
          ? 'Use your text stats tool on this text: LangChain gives an app a model plus tools, so it can reason and act.'
          : 'Use your current time tool. What time is it now in Asia/Kolkata?'

    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <div className="chat-shell">
      <aside className="sidebar" aria-label="Chat navigation">
        <div className="sidebar-top">
          <div className="brand-mark" aria-label="KETONE">K</div>
          <button className="icon-button" type="button" aria-label="Toggle sidebar">
            <Icon name="panel" />
          </button>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={item.active ? 'nav-item active' : 'nav-item'}
              type="button"
              key={item.label}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="recents" type="button">
          <span>Recents</span>
          <span aria-hidden="true">&gt;</span>
        </button>

        <div className="sidebar-footer">
          <span className="footer-dot" />
          <span>LangChain agent</span>
        </div>
      </aside>

      <main className="conversation">
        <header className="topbar">
          <button className="model-button" type="button">
            <span>KETONE</span>
            <span aria-hidden="true">v</span>
          </button>

          <div className="top-actions">
            <button className="upgrade" type="button">
              <Icon name="upgrade" />
              <span>{MODEL_NAME} + tools</span>
            </button>
            <button className="ghost-circle" type="button" aria-label="Profile menu">
              <span>K</span>
            </button>
          </div>
        </header>

        <section className={messages.length ? 'chat-area active-chat' : 'chat-area'} aria-label="Chat">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h1>What&apos;s on your mind today?</h1>
              <p className="key-notice">
                LangChain agent with calculator, current time, and text stats tools.
              </p>
            </div>
          ) : (
            <div className="messages" aria-live="polite">
              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="message-avatar">
                    {message.role === 'user' ? 'You' : 'K'}
                  </div>
                  <div className="message-body">
                    {message.text.split('\n').map((line, index) => (
                      <p key={`${message.id}-${index}`}>{line || '\u00a0'}</p>
                    ))}
                  </div>
                </article>
              ))}

              {isSending ? (
                <article className="message model">
                  <div className="message-avatar">K</div>
                  <div className="message-body thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </article>
              ) : null}
            </div>
          )}

          <div className="composer-wrap">
            {error ? <p className="error-message">{error}</p> : null}

            <form className="composer" onSubmit={handleSubmit}>
              <button className="plus" type="button" aria-label="Attach file">+</button>
              <input
                ref={inputRef}
                aria-label="Message KETONE"
                disabled={isSending}
                onChange={(event) => setInput(event.target.value)}
                placeholder={isSending ? 'KETONE is thinking' : 'Ask anything'}
                value={input}
              />
              <button className="send" type="submit" aria-label="Send message" disabled={isSending || !input.trim()}>
                <Icon name="send" />
              </button>
            </form>

            {messages.length === 0 ? (
              <div className="quick-actions" aria-label="Suggested actions">
                {promptChips.map((chip) => (
                  <button
                    type="button"
                    className="chip"
                    key={chip.label}
                    onClick={() => handleChipClick(chip.label)}
                  >
                    <Icon name={chip.icon} />
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
