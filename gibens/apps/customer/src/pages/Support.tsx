import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCustomerJobs } from '@gibens/supabase'
import { useAuth } from '../hooks/useAuth'

type Message = { role: 'user' | 'assistant'; content: string }

const WELCOME: Message = {
  role: 'assistant',
  content: "Hi! I'm the Gibens support assistant. Need a locksmith, plumber, electrician, cleaner — or any other local pro? I can point you in the right direction and help with anything on the platform. What do you need?",
}

export default function Support() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [jobContext, setJobContext] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  useEffect(() => {
    if (!user) return
    getCustomerJobs(user.id).then(({ data }) => {
      if (!data?.length) return
      const ctx = (data as Array<{ title: string; status: string; address_text?: string; category?: string }>)
        .slice(0, 5)
        .map(j => `- "${j.title}" (${j.status})${j.address_text ? ` at ${j.address_text}` : ''}`)
        .join('\n')
      setJobContext(ctx)
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

    const name = (user?.user_metadata?.full_name as string | undefined) || 'a customer'
    const systemPrompt = [
      `You are a friendly and helpful support assistant for Gibens, a local services marketplace that connects customers with skilled professionals (called pros or vendors). You are helping ${name}.`,
      '',
      'IMPORTANT — Service matching:',
      'Gibens has pros available in ALL of these categories: Locksmith, Electrician, Plumber, Painter, Carpenter, Cleaner, HVAC, Landscaper, Handyman, Pest Control, Roofing, Flooring, Tiling, Pool Service, Moving, Appliance Repair, Security Systems, Garage Door, Pressure Washing, Window Cleaning, Personal Trainer, Pet Grooming, Tutoring, Photography, Catering, Mobile Mechanic, Mobile Detailing, Auto Glass, Towing, Auto Painting.',
      '',
      'Whenever a customer describes a problem or task, FIRST check if any of the above categories can solve it, and if so, enthusiastically tell them they can post a job for free on Gibens to get quotes from nearby pros. Examples:',
      '- "I lost my car keys" → Locksmith (key cutting & car key replacement)',
      '- "My car won\'t start" → Mobile Mechanic',
      '- "My pipe is leaking" → Plumber',
      '- "I need my lawn mowed" → Landscaper',
      '- "I want to repaint my living room" → Painter',
      'Never say a service is "outside what Gibens does" without first checking the full category list above.',
      '',
      'Also help with platform questions: posting jobs, understanding bids, accepting a pro, chat, completing jobs, leaving reviews, booking fees, and account issues.',
      jobContext ? `\nTheir recent jobs on Gibens:\n${jobContext}` : '',
      '',
      'Keep replies concise, warm, and practical. When suggesting they post a job, remind them it\'s free and they\'ll get quotes from nearby vetted pros.',
    ].filter(s => s !== undefined).join('\n')

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
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `API error ${res.status}: ${data.error?.message ?? JSON.stringify(data)}` }])
        setLoading(false)
        return
      }
      const reply: string = data.content?.[0]?.text ?? "Sorry, I couldn't get a response. Please try again."
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D0D0D' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: '#141414', flexShrink: 0 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>
          <i className="ti ti-arrow-left" />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Support</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Gibens AI assistant</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,82,10,0.15)', border: '0.5px solid rgba(232,82,10,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-sparkles" style={{ color: '#E8520A', fontSize: 17 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#E8520A' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 14,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              boxShadow: msg.role === 'user' ? '0 0 14px rgba(232,82,10,0.3)' : 'none',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.08)', fontSize: 18, color: 'rgba(255,255,255,0.4)', letterSpacing: 3 }}>
              •••
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 16px 28px', borderTop: '0.5px solid rgba(255,255,255,0.07)', background: '#141414', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '10px 14px', fontSize: 14, resize: 'none', outline: 'none', color: '#fff', maxHeight: 120, overflowY: 'auto', fontFamily: 'inherit' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: input.trim() && !loading ? '#E8520A' : 'rgba(255,255,255,0.08)',
            border: 'none',
            color: input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            flexShrink: 0,
            boxShadow: input.trim() && !loading ? '0 0 14px rgba(232,82,10,0.4)' : 'none',
            transition: 'background 0.15s',
          }}
        >
          <i className="ti ti-send" style={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  )
}
