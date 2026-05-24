import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJobDetail, getJobBidsDetail, acceptBid, deleteJob } from '@gibens/supabase'
import { getAvatarColor, getInitials, formatCurrency, formatRelative, pricingLabels, statusLabels } from '@gibens/ui'
import type { Job, Bid } from '@gibens/supabase'

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const nav = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!jobId) return
    Promise.all([
      getJobDetail(jobId),
      getJobBidsDetail(jobId),
    ]).then(([{ data: jobData, error: jobErr }, { data: bidsData, error: bidsErr }]) => {
      if (jobErr) console.error('[JobDetail] job error:', jobErr)
      if (bidsErr) console.error('[JobDetail] bids error:', bidsErr)
      setJob(jobData)
      setBids(bidsData || [])
      setLoading(false)
    })
  }, [jobId])

  const handleDelete = async () => {
    if (!jobId || !confirm('Delete this job? This cannot be undone.')) return
    setDeleting(true)
    const { error } = await deleteJob(jobId)
    if (error) { alert('Could not delete: ' + error.message); setDeleting(false) }
    else nav('/jobs', { replace: true })
  }

  const handleAccept = async (bid: Bid) => {
    if (!confirm(`Accept bid of ${formatCurrency(bid.amount)} from this vendor?`)) return
    setAccepting(bid.id)
    const result = await acceptBid(bid.id)
    if (result.success) {
      nav(`/chat/${jobId}`)
    } else {
      alert('Error accepting bid: ' + result.error)
      setAccepting(null)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>
  if (!job) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
      <p style={{ marginBottom: 8 }}>Job not found</p>
      <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#bbb', wordBreak: 'break-all' }}>ID: {jobId}</p>
    </div>
  )

  const status = statusLabels[job.status] || { label: job.status, color: 'gray' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#888' }}>
          <i className="ti ti-arrow-left" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 500, flex: 1 }}>{job.title}</span>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#EEEDFE', color: '#3C3489', fontWeight: 500 }}>
          {status.label}
        </span>
        {(job.status === 'open' || job.status === 'bidding') && (
          <button onClick={handleDelete} disabled={deleting}
            style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 20, cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-trash" />
          </button>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Job info */}
        <div style={{ background: '#f7f7f5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: '#555' }}>{job.description}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-map-pin" /> {job.address_text}
            </span>
            {job.budget && (
              <span style={{ fontSize: 12, color: '#888' }}>Budget: {formatCurrency(job.budget)}</span>
            )}
            <span style={{ fontSize: 12, color: '#888' }}>{formatRelative(job.created_at)}</span>
          </div>
        </div>

        {/* Photos */}
        {job.photo_urls?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Job photos</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {job.photo_urls.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}

        {/* Bids */}
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>
          {bids?.length || 0} bid{bids?.length !== 1 ? 's' : ''} received
        </h2>

        {bids?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#888' }}>
            <i className="ti ti-clock" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
            <p>Waiting for bids from local pros...</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Vendors matching your category are being notified</p>
          </div>
        )}

        {bids?.map((bid: Bid) => {
          const { bg, tc } = getAvatarColor(bid.users?.full_name || '')
          return (
            <div key={bid.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13, flexShrink: 0 }}>
                    {getInitials(bid.users?.full_name || '?')}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 14 }}>{bid.users?.full_name}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                      {bid.users?.vendor_profiles?.avg_rating && (
                        <span style={{ fontSize: 12, color: '#888' }}>
                          <i className="ti ti-star-filled" style={{ color: '#E8A020', fontSize: 12 }} /> {bid.users.vendor_profiles.avg_rating} ({bid.users.vendor_profiles.total_reviews} reviews)
                        </span>
                      )}
                      {bid.users?.vendor_profiles?.is_licensed && <span style={{ fontSize: 11, background: '#EAF3DE', color: '#3B6D11', padding: '1px 6px', borderRadius: 20 }}>Licensed</span>}
                      {bid.users?.vendor_profiles?.is_insured && <span style={{ fontSize: 11, background: '#EAF3DE', color: '#3B6D11', padding: '1px 6px', borderRadius: 20 }}>Insured</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 20, fontWeight: 500, color: '#E8520A' }}>{formatCurrency(bid.amount)}</p>
                  <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{pricingLabels[bid.pricing_type]}</p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, marginBottom: 12 }}>{bid.message}</p>
              {bid.availability && <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}><i className="ti ti-clock" /> {bid.availability}</p>}

              <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', paddingTop: 10, display: 'flex', gap: 8 }}>
                {job.status === 'bidding' || job.status === 'open' ? (
                  <>
                    <button onClick={() => handleAccept(bid)} disabled={!!accepting}
                      style={{ flex: 2, background: '#E8520A', color: '#fff', border: 'none', borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      {accepting === bid.id ? 'Processing...' : 'Accept bid'}
                    </button>
                    <button onClick={() => nav(`/chat/${jobId}?vendor=${bid.vendor_id}`)}
                      style={{ flex: 1, background: 'none', border: '0.5px solid #ccc', borderRadius: 8, padding: 9, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <i className="ti ti-message" /> Chat
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: bid.status === 'accepted' ? '#EAF3DE' : '#f0f0f0', color: bid.status === 'accepted' ? '#3B6D11' : '#888' }}>
                    {bid.status}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
