import { useState, useEffect } from 'react'
import { adminGetAllJobs, adminUpdateUserStatus } from '@gibens/supabase'
import { formatDate, formatCurrency, statusLabels, urgencyLabels, CATEGORIES } from '@gibens/ui'
import type { Job } from '@gibens/supabase'

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    adminGetAllJobs().then(({ data }) => { setJobs((data as Job[]) || []); setLoading(false) })
  }, [])

  const statuses = ['all', 'open', 'bidding', 'accepted', 'in_progress', 'completed', 'cancelled']

  const filtered = jobs
    .filter(j => statusFilter === 'all' || j.status === statusFilter)
    .filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.address_text.toLowerCase().includes(search.toLowerCase()))

  const statusBadge = (s: string) => {
    const st = statusLabels[s] || { label: s, color: 'gray' }
    const colors: Record<string, { bg: string; tc: string }> = {
      purple: { bg: '#EEEDFE', tc: '#3C3489' },
      amber:  { bg: '#FAEEDA', tc: '#633806' },
      blue:   { bg: '#E6F1FB', tc: '#0C447C' },
      green:  { bg: '#EAF3DE', tc: '#27500A' },
      gray:   { bg: '#f0f0f0', tc: '#888' },
    }
    const c = colors[st.color] || colors.gray
    return <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: c.bg, color: c.tc }}>{st.label}</span>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Jobs</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{jobs.length} total jobs</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs or address..."
          style={{ border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', outline: 'none', width: 220 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: statusFilter === s ? 'none' : '0.5px solid #ddd', background: statusFilter === s ? '#534AB7' : 'none', color: statusFilter === s ? '#fff' : '#888' }}>
            {(statusLabels[s]?.label || s.charAt(0).toUpperCase() + s.slice(1))} {s !== 'all' && `(${jobs.filter(j => j.status === s).length})`}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading...</p>}

      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        {filtered.map((job, i) => {
          const cat = CATEGORIES.find(c => c.slug === job.category)
          const isOpen = expanded === job.id
          return (
            <div key={job.id} style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
              <div onClick={() => setExpanded(isOpen ? null : job.id)}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 12, padding: '13px 16px', alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>{job.title}</p>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{job.address_text}</p>
                </div>
                <span style={{ color: '#666' }}>{cat?.name || job.category}</span>
                <span style={{ color: '#666' }}>{formatDate(job.created_at)}</span>
                <span style={{ color: '#666' }}>{job.budget ? formatCurrency(job.budget) : 'Open'}</span>
                {statusBadge(job.status)}
              </div>
              {isOpen && (
                <div style={{ background: '#f7f7f5', padding: '12px 16px', borderTop: '0.5px solid rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>{job.description}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888', flexWrap: 'wrap' }}>
                    <span>Urgency: {urgencyLabels[job.urgency]}</span>
                    <span>Bids: {job.bid_count}</span>
                    <span>Customer ID: {job.customer_id.slice(0, 8)}...</span>
                  </div>
                  {job.photo_urls?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      {job.photo_urls.map((url, j) => (
                        <img key={j} src={url} alt="" style={{ width: 70, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !loading && (
          <p style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: 14 }}>No jobs found</p>
        )}
      </div>
    </div>
  )
}
