import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVendorBids } from '@gibens/supabase'
import { useAuth } from '../hooks/useAuth'

type Message = { role: 'user' | 'assistant'; content: string }

const WELCOME: Message = {
  role: 'assistant',
  content: "Hi! I'm the Gibens support assistant for pros. Ask me anything about the job feed, submitting bids, earnings, completing jobs, or how the platform works — happy to help.",
}

export default function Support() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [bidContext, setBidContext] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  useEffect(() => {
    if (!user) return
    getVendorBids(user.id).then(({ data }) => {
      if (!data?.length) return
      const ctx = (data as Array<{ amount: number; status: string; jobs?: { title?: string; status?: string; address_text?: string } }>)
        .slice(0, 5)
        .map(b => `- "${b.jobs?.title ?? 'Untitled'}" — bid $${b.amount} (bid: ${b.status}, job: ${b.jobs?.status ?? '?'})`)
        .join('\n')
      setBidContext(ctx)
    })
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    if (!apiKey) {
      alert('Support chat is not configured. Please contact support@gibens.com.')
      return
    }
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const name = (user?.user_metadata?.full_name as string | undefined) || 'a pro'
    const systemPrompt = [
      'You are a friendly and helpful support assistant for Gibens, a home services marketplace. You are helping a service professional (pro/vendor) who uses the platform to find and complete jobs.',
      `You are helping ${name}.`,
      bidContext ? `\nTheir recent bids:\n${bidContext}` : '',
      '\nHelp with: how the job feed works, submitting and managing bids, booking fees, earnings and payouts, completing jobs, leaving reviews, profile verification (license, insurance), and platform questions. Keep answers concise and friendly.',
    ].filter(Boolean).join('\n')

    // Skip the hardcoded WELCOME message — only send the real conversation
    const apiMessages = newMessages.slice(1)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: apiMessages,
        }),
      })
      const data = await res.json()
      const reply: string = data.content?.[0]?.text ?? "Sorry, I couldn't get a response. Please try again."
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again or email support@gibens.com.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff', flexShrink: 0 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-arrow-left" />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 500 }}>Support</p>
          <p style={{ fontSize: 12, color: '#888' }}>Gibens AI assistant</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EAF1FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-sparkles" style={{ color: '#0F4C8A', fontSize: 18 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#0F4C8A' : '#f0f0ee',
              color: msg.role === 'user' ? '#fff' : '#1a1a1a',
              fontSize: 14,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: '#f0f0ee', fontSize: 18, color: '#999', letterSpacing: 2 }}>
              •••
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 16px 28px', borderTop: '0.5px solid rgba(0,0,0,0.08)', background: '#fff', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          style={{ flex: 1, border: '0.5px solid #ddd', borderRadius: 20, padding: '10px 14px', fontSize: 14, resize: 'none', outline: 'none', background: '#f9f9f9', maxHeight: 120, overflowY: 'auto', fontFamily: 'inherit' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: input.trim() && !loading ? '#0F4C8A' : '#eee',
            border: 'none',
            color: input.trim() && !loading ? '#fff' : '#bbb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          <i className="ti ti-send" style={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  )
}
