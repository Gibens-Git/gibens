import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCustomerJobs } from '@gibens/supabase'
import { formatRelative, statusLabels, CATEGORIES } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { Job } from '@gibens/supabase'

const badgeDark: Record<string, { bg: string; color: string; border: string }> = {
  purple: { bg: 'rgba(60,52,137,0.25)',  color: '#A29DFF', border: 'rgba(100,90,200,0.25)' },
  amber:  { bg: 'rgba(99,56,6,0.3)',     color: '#FFA845', border: 'rgba(160,100,20,0.25)' },
  blue:   { bg: 'rgba(12,68,124,0.25)',  color: '#6BB5F5', border: 'rgba(30,100,200,0.25)' },
  green:  { bg: 'rgba(39,80,10,0.3)',    color: '#7BC95A', border: 'rgba(80,150,30,0.25)'  },
  gray:   { bg: 'rgba(255,255,255,0.07)',color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
}

export default function MyJobs() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getCustomerJobs(user.id).then(({ data }) => { setJobs(data || []); setLoading(false) })
  }, [user])

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <div style={{ padding: '14px 20px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: '#141414' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>My jobs</h1>
      </div>

      {loading && <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading...</div>}

      {!loading && jobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
          <i className="ti ti-clipboard-list" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: 'rgba(255,255,255,0.15)' }} />
          <p style={{ fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>No jobs yet</p>
          <button onClick={() => nav('/post-job')} style={{
            marginTop: 16, background: '#E8520A', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 22px', fontSize: 14, cursor: 'pointer',
            boxShadow: '0 0 18px rgba(232,82,10,0.35)',
          }}>
            Post your first job
          </button>
        </div>
      )}

      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {jobs.map((job) => {
          const st = statusLabels[job.status] || { label: job.status, color: 'gray' }
          const badge = badgeDark[st.color] || badgeDark.gray
          const cat = CATEGORIES.find(c => c.slug === job.category)
          return (
            <div key={job.id} onClick={() => nav(`/jobs/${job.id}`)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(232,82,10,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <p style={{ fontWeight: 500, fontSize: 14, flex: 1, marginRight: 10, color: '#fff' }}>{job.title}</p>
                <span style={{
                  fontSize: 10, padding: '3px 9px', borderRadius: 20,
                  background: badge.bg, color: badge.color,
                  border: `0.5px solid ${badge.border}`,
                  fontWeight: 500, flexShrink: 0,
                }}>{st.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                <span>{cat?.name || job.category}</span>
                <span>{formatRelative(job.created_at)}</span>
              </div>
              {job.bid_count > 0 && (
                <p style={{ fontSize: 12, color: '#E8520A', marginTop: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-gavel" /> {job.bid_count} bid{job.bid_count > 1 ? 's' : ''} received
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
