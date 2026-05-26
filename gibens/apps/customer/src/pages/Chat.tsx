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
    setSending(true)
    try {
      const url = await uploadJobPhoto(file, jobId)
      const { data: msg } = await sendMessage(jobId, user.id, undefined, url)
      if (msg) {
        setMessages(prev => [...prev, msg as Message])
        lastMsgAt.current = (msg as Message).created_at
      }
    } catch (err) {
      setSendError('Failed to send photo — ' + (err instanceof Error ? err.message : String(err)))
    }
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D0D0D' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: '#141414', flexShrink: 0 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 500, fontSize: 14, color: '#fff' }}>Job chat</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{jobTitle}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id
          const { bg, tc } = getAvatarColor(msg.users?.full_name || '')
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500 }}>
                    {getInitials(msg.users?.full_name || '?')}
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{msg.users?.full_name}</span>
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
                  background: isMe ? '#E8520A' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14, lineHeight: 1.5,
                  boxShadow: isMe ? '0 0 14px rgba(232,82,10,0.25)' : 'none',
                }}>
                  {msg.body}
                </div>
              )}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{formatTime(msg.created_at)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <div style={{ background: 'rgba(255,107,107,0.1)', borderTop: '0.5px solid rgba(255,107,107,0.2)', padding: '8px 16px', fontSize: 12, color: '#FF8A8A', flexShrink: 0 }}>
          {sendError}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 20px', borderTop: '0.5px solid rgba(255,255,255,0.07)', background: '#141414', flexShrink: 0 }}>
        <label style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 22 }}>
          <i className="ti ti-photo" />
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        </label>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Type a message..."
          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '9px 14px', fontSize: 14, outline: 'none', color: '#fff' }} />
        <button onClick={handleSend} disabled={!text.trim() || sending}
          style={{ width: 36, height: 36, borderRadius: '50%', background: text.trim() && !sending ? '#E8520A' : 'rgba(255,255,255,0.1)', border: 'none', color: text.trim() && !sending ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: text.trim() && !sending ? '0 0 12px rgba(232,82,10,0.4)' : 'none', transition: 'background 0.15s' }}>
          <i className="ti ti-send" />
        </button>
      </div>
    </div>
  )
}
