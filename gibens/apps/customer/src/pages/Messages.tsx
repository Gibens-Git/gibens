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
    supabase.rpc('get_customer_chat_list', { p_customer_id: user.id }).then(({ data }) => {
      if (!data) return
      setThreads(data.map((r: Record<string, unknown>) => ({
        job_id:       r.job_id as string,
        job_title:    r.job_title as string,
        other_name:   (r.other_name as string) || 'Pro',
        last_message: (r.last_body as string) || 'Sent a photo',
        last_at:      r.last_at as string,
        unread:       Number(r.unread_count),
      })))
    })
  }, [user])

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <div style={{ padding: '14px 20px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: '#141414' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Messages</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Chat with your service pros</p>
      </div>

      {threads.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
          <i className="ti ti-message-circle" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: 'rgba(255,255,255,0.12)' }} />
          <p style={{ fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>No messages yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Post a job and chat with vendors after they bid</p>
        </div>
      )}

      {threads.map(t => {
        const { bg, tc } = getAvatarColor(t.other_name)
        return (
          <div key={t.job_id} onClick={() => nav(`/chat/${t.job_id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          >
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 16, flexShrink: 0 }}>
              {getInitials(t.other_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, fontSize: 14, color: t.unread > 0 ? '#fff' : 'rgba(255,255,255,0.8)' }}>{t.other_name}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{t.job_title}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{t.last_message}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{formatRelative(t.last_at)}</span>
              {t.unread > 0 && (
                <span style={{ background: '#E8520A', color: '#fff', fontSize: 10, fontWeight: 600, minWidth: 18, height: 18, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', boxShadow: '0 0 8px rgba(232,82,10,0.5)' }}>
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
