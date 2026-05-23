import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@gibens/supabase'
import { getAvatarColor, getInitials, formatRelative } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'

interface Thread {
  job_id: string
  job_title: string
  other_name: string
  last_message: string
  last_at: string
  unread: number
}

export default function Messages() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])

  useEffect(() => {
    if (!user) return
    // Get jobs the user is part of that have messages
    supabase
      .from('jobs')
      .select('id, title, accepted_vendor, messages(body, photo_url, created_at, is_read, sender_id, users(full_name))')
      .eq('customer_id', user.id)
      .not('messages', 'is', null)
      .order('created_at', { foreignTable: 'messages', ascending: false })
      .then(({ data }) => {
        if (!data) return
        const t = data
          .filter((j: Record<string, unknown>) => (j.messages as unknown[]).length > 0)
          .map((j: Record<string, unknown>) => {
            const msgs = j.messages as Record<string, unknown>[]
            const last = msgs[0]
            const unread = msgs.filter((m: Record<string, unknown>) => !m.is_read && m.sender_id !== user.id).length
            return {
              job_id: j.id as string,
              job_title: j.title as string,
              other_name: (last.users as Record<string, unknown>)?.full_name as string || 'Pro',
              last_message: (last.body as string) || 'Sent a photo',
              last_at: last.created_at as string,
              unread,
            }
          })
        setThreads(t)
      })
  }, [user])

  return (
    <div>
      <div style={{ padding: '14px 20px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Messages</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Chat with your service pros</p>
      </div>

      {threads.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <i className="ti ti-message-circle" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          <p style={{ fontWeight: 500 }}>No messages yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Post a job and chat with vendors after they bid</p>
        </div>
      )}

      {threads.map(t => {
        const { bg, tc } = getAvatarColor(t.other_name)
        return (
          <div key={t.job_id} onClick={() => nav(`/chat/${t.job_id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', cursor: 'pointer' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 16, flexShrink: 0 }}>
              {getInitials(t.other_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, fontSize: 14 }}>{t.other_name}</p>
              <p style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{t.job_title}</p>
              <p style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{t.last_message}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>{formatRelative(t.last_at)}</span>
              {t.unread > 0 && (
                <span style={{ background: '#E8520A', color: '#fff', fontSize: 10, fontWeight: 500, minWidth: 18, height: 18, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {t.unread}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
