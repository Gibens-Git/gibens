import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJobDetail, getJobBidsDetail, acceptBid, deleteJob, markJobComplete, createReview, getMyReviewForJob } from '@gibens/supabase'
import { getAvatarColor, getInitials, formatCurrency, formatRelative, pricingLabels, statusLabels } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { Job, Bid } from '@gibens/supabase'

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const nav = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [myReview, setMyReview] = useState<{ id: string; rating: number } | null>(null)
  const [reviewChecked, setReviewChecked] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

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

  useEffect(() => {
    if (!jobId || !user || job?.status !== 'completed' || reviewChecked) return
    setReviewChecked(true)
    getMyReviewForJob(jobId, user.id).then(({ data }) => {
      setMyReview(data ?? null)
    })
  }, [jobId, user, job?.status, reviewChecked])

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

  const handleComplete = async () => {
    if (!jobId || !confirm('Mark this job as complete?')) return
    setCompleting(true)
    await markJobComplete(jobId)
    setJob(prev => prev ? { ...prev, status: 'completed' } : prev)
    setCompleting(false)
    setReviewChecked(false)
  }

  const handleReview = async () => {
    if (!jobId || !user) return
    const acceptedBid = bids.find(b => b.status === 'accepted')
    if (!acceptedBid) return
    setSubmittingReview(true)
    const { error } = await createReview({
      job_id: jobId,
      reviewer_id: user.id,
      reviewee_id: acceptedBid.vendor_id,
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
    })
    setSubmittingReview(false)
    if (error) {
      alert('Could not submit review: ' + error.message)
    } else {
      setReviewDone(true)
      setMyReview({ id: 'done', rating: reviewRating })
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
  const acceptedBid = bids.find(b => b.status === 'accepted')

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

        {(job.status === 'accepted' || job.status === 'in_progress') && (
          <button onClick={handleComplete} disabled={completing} style={{
            width: '100%', background: '#2E7D4F', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <i className="ti ti-check" />
            {completing ? 'Marking complete...' : 'Mark job as complete'}
          </button>
        )}

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

        {job.status === 'completed' && acceptedBid && (
          <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 16, marginTop: 8 }}>
            <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>
              <i className="ti ti-star" style={{ color: '#E8A020', marginRight: 6 }} />
              Rate {acceptedBid.users?.full_name?.split(' ')[0] || 'the pro'}
            </p>
            {myReview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <i key={s} className={s <= myReview.rating ? 'ti ti-star-filled' : 'ti ti-star'}
                    style={{ fontSize: 20, color: s <= myReview.rating ? '#E8A020' : '#ddd' }} />
                ))}
                <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>Already reviewed</span>
              </div>
            ) : reviewDone ? (
              <p style={{ fontSize: 13, color: '#2E7D4F', marginTop: 8 }}>
                <i className="ti ti-check" /> Review submitted — thanks!
              </p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>How was your experience?</p>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)}
                      style={{ background: 'none', border: 'none', fontSize: 32, cursor: 'pointer', padding: '0 2px', color: star <= reviewRating ? '#E8A020' : '#ddd' }}>
                      <i className={star <= reviewRating ? 'ti ti-star-filled' : 'ti ti-star'} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Leave a comment (optional)..."
                  rows={3}
                  style={{ width: '100%', border: '0.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 13, resize: 'none', boxSizing: 'border-box', outline: 'none' }}
                />
                <button onClick={handleReview} disabled={submittingReview} style={{
                  marginTop: 10, width: '100%', background: '#E8520A', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}>
                  {submittingReview ? 'Submitting...' : 'Submit review'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
