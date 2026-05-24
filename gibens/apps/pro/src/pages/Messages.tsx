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
    // Query via bids — vendor sees jobs they've bid on that have messages
    supabase
      .from('bids')
      .select('job_id, jobs(id, title, messages(body, photo_url, created_at, is_read, sender_id, users(full_name)))')
      .eq('vendor_id', user.id)
      .then(({ data }) => {
        if (!data) return
        const t: Thread[] = []
        for (const bid of data as Record<string, unknown>[]) {
          const job = bid.jobs as Record<string, unknown> | null
          if (!job) continue
          const msgs = (job.messages as Record<string, unknown>[]) || []
          if (msgs.length === 0) continue
          const sorted = [...msgs].sort((a, b) =>
            new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
          )
          const last = sorted[0]
          const unread = sorted.filter(m => !m.is_read && m.sender_id !== user.id).length
          t.push({
            job_id: job.id as string,
            job_title: job.title as string,
            other_name: (last.users as Record<string, unknown>)?.full_name as string || 'Customer',
            last_message: (last.body as string) || 'Sent a photo',
            last_at: last.created_at as string,
            unread,
          })
        }
        // Sort threads newest first
        t.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime())
        setThreads(t)
      })
  }, [user])

  return (
    <div>
      <div style={{ padding: '14px 20px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Messages</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Chat with your customers</p>
      </div>

      {threads.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <i className="ti ti-message-circle" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          <p style={{ fontWeight: 500 }}>No messages yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Messages from customers will appear here</p>
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
