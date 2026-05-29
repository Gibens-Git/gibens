import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMessages, sendMessage, markMessagesRead, markAllMessageNotifsRead, subscribeToMessages, supabase, uploadJobPhoto } from '@gibens/supabase'
import { getAvatarColor, getInitials, formatTime } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { Message } from '@gibens/supabase'

export default function Chat() {
  const { jobId } = useParams<{ jobId: string }>()
  const nav = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [jobTitle, setJobTitle] = useState('Chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMsgAt = useRef<string>('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!jobId || !user) return

    supabase.from('jobs').select('title').eq('id', jobId).single().then(({ data }) => {
      if (data) setJobTitle(data.title)
    })

    getMessages(jobId).then(({ data }) => {
      if (data) {
        setMessages(data as Message[])
        lastMsgAt.current = data.length > 0 ? data[data.length - 1].created_at : new Date().toISOString()
        markMessagesRead(jobId, user.id).then(() => {})
        markAllMessageNotifsRead(user.id).then(() => {})
      } else {
        lastMsgAt.current = new Date().toISOString()
      }

      // Start polling after initial load so we only fetch genuinely new messages
      pollRef.current = setInterval(async () => {
        const { data: newMsgs } = await supabase
          .from('messages')
          .select('*, users(full_name, avatar_url)')
          .eq('job_id', jobId)
          .gt('created_at', lastMsgAt.current)
          .order('created_at', { ascending: true })

        if (newMsgs?.length) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const fresh = (newMsgs as Message[]).filter(m => !existingIds.has(m.id))
            if (!fresh.length) return prev
            lastMsgAt.current = fresh[fresh.length - 1].created_at
            return [...prev, ...fresh]
          })
          markMessagesRead(jobId, user.id).then(() => {})
          markAllMessageNotifsRead(user.id).then(() => {})
        }
      }, 4000)
    })

    // Realtime subscription — works when messages table is in supabase_realtime publication
    const channel = subscribeToMessages(jobId, (msg) => {
      setMessages(prev => {
        const m = msg as Message
        if (prev.some(p => p.id === m.id)) return prev
        lastMsgAt.current = m.created_at
        return [...prev, m]
      })
      markMessagesRead(jobId, user.id).then(() => {})
      markAllMessageNotifsRead(user.id).then(() => {})
    })

    return () => {
      supabase.removeChannel(channel)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [jobId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || !jobId || !user) return
    const body = text.trim()
    setSendError('')
    setSending(true)
    const { data: msg, error } = await sendMessage(jobId, user.id, body)
    if (error) {
      console.error('[Chat] send error:', error)
      setSendError(error.message || 'Failed to send — check your connection')
    } else {
      setText('')
      if (msg) {
        setMessages(prev => [...prev, msg as Message])
        lastMsgAt.current = (msg as Message).created_at
      }
    }
    setSending(false)
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !jobId || !user) return
    setSendError('')
    setSending(true)
    try {
      const url = await uploadJobPhoto(file, jobId)
      const { data: msg, error } = await sendMessage(jobId, user.id, undefined, url)
      if (error) {
        setSendError('Failed to send photo — ' + (error.message || 'check your connection'))
      } else if (msg) {
        setMessages(prev => [...prev, msg as Message])
        lastMsgAt.current = (msg as Message).created_at
      }
    } catch (err) {
      setSendError('Failed to send photo — ' + (err instanceof Error ? err.message : 'check your connection'))
    }
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff', flexShrink: 0 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#888' }}>
          <i className="ti ti-arrow-left" />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 500, fontSize: 14 }}>Job chat</p>
          <p style={{ fontSize: 12, color: '#888' }}>{jobTitle}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: '#f7f7f5' }}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id
          const { bg, tc } = getAvatarColor(msg.users?.full_name || '')
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {msg.users?.avatar_url ? (
                    <img src={msg.users.avatar_url} alt={msg.users?.full_name || ''} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500 }}>
                      {getInitials(msg.users?.full_name || '?')}
                    </div>
                  )}
                  <span style={{ fontSize: 12, color: '#888' }}>{msg.users?.full_name}</span>
                </div>
              )}
              {msg.photo_url && (
                <img src={msg.photo_url} alt="Shared photo" style={{ maxWidth: 200, borderRadius: 12, marginBottom: 4 }} />
              )}
              {msg.body && (
                <div style={{
                  padding: '10px 14px', borderRadius: 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  background: isMe ? '#0F4C8A' : '#fff',
                  color: isMe ? '#fff' : '#333',
                  fontSize: 14, lineHeight: 1.5,
                  border: isMe ? 'none' : '0.5px solid rgba(0,0,0,0.08)',
                }}>
                  {msg.body}
                </div>
              )}
              <span style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{formatTime(msg.created_at)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <div style={{ background: '#FEE2E2', borderTop: '0.5px solid #FECACA', padding: '8px 16px', fontSize: 12, color: '#B91C1C', flexShrink: 0 }}>
          {sendError}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderTop: '0.5px solid rgba(0,0,0,0.08)', background: '#fff', flexShrink: 0 }}>
        <label style={{ cursor: 'pointer', color: '#888', fontSize: 22 }}>
          <i className="ti ti-photo" />
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        </label>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Type a message..."
          style={{ flex: 1, border: '0.5px solid #ddd', borderRadius: 20, padding: '9px 14px', fontSize: 14, outline: 'none' }} />
        <button onClick={handleSend} disabled={!text.trim() || sending}
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F4C8A', border: 'none', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-send" />
        </button>
      </div>
    </div>
  )
}
