import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCustomerJobs } from '@gibens/supabase'
import { formatRelative, statusLabels, CATEGORIES } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { Job } from '@gibens/supabase'

export default function MyJobs() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getCustomerJobs(user.id).then(({ data }) => { setJobs(data || []); setLoading(false) })
  }, [user])

  const bgColors: Record<string, string> = { purple: '#EEEDFE', amber: '#FAEEDA', blue: '#E6F1FB', green: '#EAF3DE', gray: '#f0f0f0' }
  const txColors: Record<string, string> = { purple: '#3C3489', amber: '#633806', blue: '#0C447C', green: '#27500A', gray: '#888' }

  return (
    <div>
      <div style={{ padding: '14px 20px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>My jobs</h1>
      </div>
      {loading && <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>}
      {!loading && jobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <i className="ti ti-clipboard-list" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          <p style={{ fontWeight: 500 }}>No jobs yet</p>
          <button onClick={() => nav('/post-job')} style={{ marginTop: 16, background: '#E8520A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
            Post your first job
          </button>
        </div>
      )}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {jobs.map((job) => {
          const st = statusLabels[job.status] || { label: job.status, color: 'gray' }
          const cat = CATEGORIES.find(c => c.slug === job.category)
          return (
            <div key={job.id} onClick={() => nav(`/jobs/${job.id}`)}
              style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 14, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <p style={{ fontWeight: 500, fontSize: 14, flex: 1, marginRight: 10 }}>{job.title}</p>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: bgColors[st.color], color: txColors[st.color], fontWeight: 500, flexShrink: 0 }}>{st.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888' }}>
                <span>{cat?.name || job.category}</span>
                <span>{formatRelative(job.created_at)}</span>
              </div>
              {job.bid_count > 0 && (
                <p style={{ fontSize: 12, color: '#E8520A', marginTop: 6, fontWeight: 500 }}>
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
