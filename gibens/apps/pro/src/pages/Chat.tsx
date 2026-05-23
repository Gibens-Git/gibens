import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMessages, sendMessage, markMessagesRead, subscribeToMessages, supabase, uploadJobPhoto } from '@gibens/supabase'
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
  const [jobTitle, setJobTitle] = useState('Chat')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!jobId || !user) return

    supabase.from('jobs').select('title').eq('id', jobId).single().then(({ data }) => {
      if (data) setJobTitle(data.title)
    })

    getMessages(jobId).then(({ data }) => {
      if (data) setMessages(data as Message[])
      markMessagesRead(jobId, user.id)
    })

    const channel = subscribeToMessages(jobId, (msg) => {
      setMessages(prev => [...prev, msg as Message])
      markMessagesRead(jobId, user.id)
    })

    return () => { supabase.removeChannel(channel) }
  }, [jobId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || !jobId || !user) return
    const body = text.trim()
    setText('')
    setSending(true)
    await sendMessage(jobId, user.id, body)
    setSending(false)
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !jobId || !user) return
    setSending(true)
    const url = await uploadJobPhoto(file, jobId)
    await sendMessage(jobId, user.id, undefined, url)
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
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500 }}>
                    {getInitials(msg.users?.full_name || '?')}
                  </div>
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
                  background: isMe ? '#E8520A' : '#fff',
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
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#E8520A', border: 'none', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-send" />
        </button>
      </div>
    </div>
  )
}
