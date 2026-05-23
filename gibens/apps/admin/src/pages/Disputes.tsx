import { useState, useEffect } from 'react'
import { adminGetDisputes, adminResolveDispute } from '@gibens/supabase'
import { formatDate, formatRelative } from '@gibens/ui'

interface DisputeRow {
  id: string
  type: string
  description: string
  status: string
  resolution: string | null
  created_at: string
  updated_at: string
  jobs: { title: string } | null
  users: { full_name: string } | null
}

export default function Disputes() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')
  const [filter, setFilter] = useState('open')

  useEffect(() => {
    adminGetDisputes().then(({ data }) => { setDisputes((data as DisputeRow[]) || []); setLoading(false) })
  }, [])

  const resolve = async (id: string, status: 'resolved' | 'closed') => {
    if (!resolution.trim()) { alert('Enter a resolution note first'); return }
    await adminResolveDispute(id, resolution, status)
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status, resolution } : d))
    setResolving(null)
    setResolution('')
  }

  const statuses = ['open', 'under_review', 'resolved', 'closed']
  const typeColors: Record<string, { bg: string; tc: string }> = {
    payment:  { bg: '#FCEBEB', tc: '#791F1F' },
    no_show:  { bg: '#FAEEDA', tc: '#633806' },
    quality:  { bg: '#E6F1FB', tc: '#0C447C' },
    fraud:    { bg: '#FCEBEB', tc: '#501313' },
    other:    { bg: '#f0f0f0', tc: '#888' },
  }

  const filtered = disputes.filter(d => filter === 'all' || d.status === filter)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Disputes</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
          {disputes.filter(d => d.status === 'open').length} open · {disputes.length} total
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', ...statuses].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: filter === s ? 'none' : '0.5px solid #ddd', background: filter === s ? '#534AB7' : 'none', color: filter === s ? '#fff' : '#888' }}>
            {s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
            {s !== 'all' && ` (${disputes.filter(d => d.status === s).length})`}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(d => {
          const tc = typeColors[d.type] || typeColors.other
          const isResolving = resolving === d.id
          return (
            <div key={d.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: tc.bg, color: tc.tc }}>
                      {d.type.replace('_', ' ')}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: d.status === 'open' ? '#FCEBEB' : '#EAF3DE', color: d.status === 'open' ? '#791F1F' : '#27500A' }}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{formatRelative(d.created_at)}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{d.jobs?.title || 'Unknown job'}</p>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Reported by: {d.users?.full_name || 'Unknown'}</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{d.description}</p>
                {d.resolution && (
                  <div style={{ marginTop: 10, background: '#EAF3DE', borderRadius: 6, padding: '8px 12px' }}>
                    <p style={{ fontSize: 11, color: '#3B6D11', fontWeight: 500, marginBottom: 2 }}>Resolution</p>
                    <p style={{ fontSize: 13, color: '#27500A' }}>{d.resolution}</p>
                  </div>
                )}
              </div>
              {(d.status === 'open' || d.status === 'under_review') && (
                <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', padding: '12px 16px', background: '#fafafa' }}>
                  {isResolving ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea value={resolution} onChange={e => setResolution(e.target.value)}
                        placeholder="Describe how this was resolved..."
                        style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 13, minHeight: 70, resize: 'none', fontFamily: 'inherit' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => resolve(d.id, 'resolved')}
                          style={{ flex: 1, background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 13, cursor: 'pointer' }}>
                          Mark resolved
                        </button>
                        <button onClick={() => resolve(d.id, 'closed')}
                          style={{ flex: 1, background: '#888', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 13, cursor: 'pointer' }}>
                          Close without action
                        </button>
                        <button onClick={() => { setResolving(null); setResolution('') }}
                          style={{ padding: '8px 12px', background: 'none', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setResolving(d.id)}
                        style={{ fontSize: 13, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#534AB7', color: '#fff', cursor: 'pointer' }}>
                        Resolve dispute
                      </button>
                      <button style={{ fontSize: 13, padding: '7px 14px', borderRadius: 8, border: '0.5px solid #ddd', background: 'none', cursor: 'pointer', color: '#666' }}>
                        Contact reporter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            <i className="ti ti-check" style={{ fontSize: 40, display: 'block', marginBottom: 10 }} />
            <p>No {filter === 'all' ? '' : filter} disputes</p>
          </div>
        )}
      </div>
    </div>
  )
}
