import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJobDetail, getJobBidsDetail, acceptBid, deleteJob, markJobComplete, createReview, getMyReviewForJob, uploadReviewPhoto } from '@gibens/supabase'
import { getAvatarColor, getInitials, formatCurrency, formatRelative, pricingLabels, statusLabels } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { Job, Bid } from '@gibens/supabase'

const badgeDark: Record<string, { bg: string; color: string }> = {
  purple: { bg: 'rgba(60,52,137,0.3)',  color: '#A29DFF' },
  amber:  { bg: 'rgba(99,56,6,0.3)',    color: '#FFA845' },
  blue:   { bg: 'rgba(12,68,124,0.3)',  color: '#6BB5F5' },
  green:  { bg: 'rgba(39,80,10,0.3)',   color: '#7BC95A' },
  gray:   { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' },
}

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
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([])
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  useEffect(() => {
    if (!jobId) return
    Promise.all([getJobDetail(jobId), getJobBidsDetail(jobId)]).then(([{ data: jobData }, { data: bidsData }]) => {
      setJob(jobData)
      setBids(bidsData || [])
      setLoading(false)
    })
  }, [jobId])

  useEffect(() => {
    if (!jobId || !user || job?.status !== 'completed' || reviewChecked) return
    setReviewChecked(true)
    getMyReviewForJob(jobId, user.id).then(({ data }) => setMyReview(data ?? null))
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
      setJob(prev => prev ? { ...prev, status: 'accepted' } : prev)
      setBids(prev => prev.map(b => b.id === bid.id ? { ...b, status: 'accepted' } : { ...b, status: 'declined' }))
      setAccepting(null)
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
    const reviewKey = `${jobId}-${user.id}`
    const uploadedUrls = await Promise.all(reviewPhotos.map(f => uploadReviewPhoto(f, reviewKey).catch(() => null)))
    const photo_urls = uploadedUrls.filter(Boolean) as string[]
    const { error } = await createReview({
      job_id: jobId,
      reviewer_id: user.id,
      reviewee_id: acceptedBid.vendor_id,
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
      photo_urls: photo_urls.length ? photo_urls : undefined,
    })
    setSubmittingReview(false)
    if (error) { alert('Could not submit review: ' + error.message) }
    else { setReviewDone(true); setMyReview({ id: 'done', rating: reviewRating }) }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: '#0D0D0D', minHeight: '100vh' }}>Loading...</div>
  if (!job) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: '#0D0D0D', minHeight: '100vh' }}>
      <p>Job not found</p>
      <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', wordBreak: 'break-all', marginTop: 8 }}>ID: {jobId}</p>
    </div>
  )

  const status = statusLabels[job.status] || { label: job.status, color: 'gray' }
  const badge = badgeDark[status.color] || badgeDark.gray
  const acceptedBid = bids.find(b => b.status === 'accepted')

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: '#141414' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, flex: 1, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</span>
        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color, fontWeight: 500, flexShrink: 0, border: `0.5px solid ${badge.color}33` }}>
          {status.label}
        </span>
        {(job.status === 'open' || job.status === 'bidding') && (
          <button onClick={handleDelete} disabled={deleting}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 20, cursor: 'pointer', padding: 0 }}>
            <i className="ti ti-trash" />
          </button>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Job info */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)' }}>{job.description}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-map-pin" style={{ color: '#E8520A' }} /> {job.address_text}
            </span>
            {job.budget && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Budget: {formatCurrency(job.budget)}</span>
            )}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{formatRelative(job.created_at)}</span>
          </div>
        </div>

        {/* Mark complete */}
        {(job.status === 'accepted' || job.status === 'in_progress') && (
          <button onClick={handleComplete} disabled={completing} style={{
            width: '100%', background: 'rgba(39,80,10,0.3)', color: '#7BC95A',
            border: '0.5px solid rgba(80,150,30,0.4)', borderRadius: 10, padding: '12px 0',
            fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <i className="ti ti-check" />
            {completing ? 'Marking complete...' : 'Mark job as complete'}
          </button>
        )}

        {/* Photos */}
        {job.photo_urls?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Job photos</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {job.photo_urls.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.1)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Bids heading */}
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          {bids?.length || 0} bid{bids?.length !== 1 ? 's' : ''} received
        </h2>

        {bids?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.35)' }}>
            <i className="ti ti-clock" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.12)' }} />
            <p>Waiting for bids from local pros...</p>
            <p style={{ fontSize: 13, marginTop: 4, color: 'rgba(255,255,255,0.25)' }}>Vendors matching your category are being notified</p>
          </div>
        )}

        {/* Bid cards */}
        {bids?.map((bid: Bid) => {
          const { bg, tc } = getAvatarColor(bid.users?.full_name || '')
          const bidAccepted = bid.status === 'accepted'
          const bidDeclined = bid.status === 'declined'
          return (
            <div key={bid.id} style={{ background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${bidAccepted ? 'rgba(232,82,10,0.35)' : bidDeclined ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: 14, marginBottom: 12, opacity: bidDeclined ? 0.5 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 13, flexShrink: 0 }}>
                    {getInitials(bid.users?.full_name || '?')}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 14, color: '#fff' }}>{bid.users?.full_name}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                      {bid.users?.vendor_profiles?.avg_rating && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                          <i className="ti ti-star-filled" style={{ color: '#E8A020', fontSize: 12 }} /> {bid.users.vendor_profiles.avg_rating} <span style={{ color: 'rgba(255,255,255,0.25)' }}>({bid.users.vendor_profiles.total_reviews})</span>
                        </span>
                      )}
                      {bid.users?.vendor_profiles?.is_licensed && <span style={{ fontSize: 10, background: 'rgba(39,80,10,0.3)', color: '#7BC95A', border: '0.5px solid rgba(80,150,30,0.3)', padding: '1px 6px', borderRadius: 20 }}>Licensed</span>}
                      {bid.users?.vendor_profiles?.is_insured && <span style={{ fontSize: 10, background: 'rgba(39,80,10,0.3)', color: '#7BC95A', border: '0.5px solid rgba(80,150,30,0.3)', padding: '1px 6px', borderRadius: 20 }}>Insured</span>}
                    </div>
                    <button onClick={() => nav(`/vendor/${bid.vendor_id}`)}
                      style={{ background: 'none', border: 'none', padding: 0, marginTop: 4, fontSize: 12, color: '#E8520A', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <i className="ti ti-user" style={{ fontSize: 12 }} /> View profile
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 20, fontWeight: 600, color: '#E8520A' }}>{formatCurrency(bid.amount)}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{pricingLabels[bid.pricing_type]}</p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 12 }}>{bid.message}</p>
              {bid.availability && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}><i className="ti ti-clock" /> {bid.availability}</p>}

              <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', paddingTop: 10, display: 'flex', gap: 8 }}>
                {job.status === 'bidding' || job.status === 'open' ? (
                  <>
                    <button onClick={() => handleAccept(bid)} disabled={!!accepting}
                      style={{ flex: 2, background: '#E8520A', color: '#fff', border: 'none', borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 14px rgba(232,82,10,0.35)' }}>
                      {accepting === bid.id ? 'Processing...' : 'Accept bid'}
                    </button>
                    <button onClick={() => nav(`/chat/${jobId}?vendor=${bid.vendor_id}`)}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 9, fontSize: 13, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <i className="ti ti-message" /> Chat
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: bidAccepted ? 'rgba(232,82,10,0.2)' : 'rgba(255,255,255,0.07)', color: bidAccepted ? '#E8520A' : 'rgba(255,255,255,0.35)', border: `0.5px solid ${bidAccepted ? 'rgba(232,82,10,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                    {bid.status}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {/* Review section */}
        {job.status === 'completed' && acceptedBid && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginTop: 8 }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#fff' }}>
              <i className="ti ti-star" style={{ color: '#E8A020', marginRight: 6 }} />
              Rate {acceptedBid.users?.full_name?.split(' ')[0] || 'the pro'}
            </p>
            {myReview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <i key={s} className={s <= myReview.rating ? 'ti ti-star-filled' : 'ti ti-star'}
                    style={{ fontSize: 20, color: s <= myReview.rating ? '#E8A020' : 'rgba(255,255,255,0.15)' }} />
                ))}
                <span style={{ fontSize: 13, color: '#7BC95A', marginLeft: 4 }}>Already reviewed</span>
              </div>
            ) : reviewDone ? (
              <p style={{ fontSize: 13, color: '#7BC95A', marginTop: 8 }}>
                <i className="ti ti-check" /> Review submitted — thanks!
              </p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>How was your experience?</p>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)}
                      style={{ background: 'none', border: 'none', fontSize: 32, cursor: 'pointer', padding: '0 2px', color: star <= reviewRating ? '#E8A020' : 'rgba(255,255,255,0.15)' }}>
                      <i className={star <= reviewRating ? 'ti ti-star-filled' : 'ti ti-star'} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Leave a comment (optional)..."
                  rows={3}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', fontSize: 13, resize: 'none', boxSizing: 'border-box', outline: 'none', color: '#fff', marginBottom: 12 }}
                />
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Add project photos (optional)</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {reviewPhotos.map((f, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={URL.createObjectURL(f)} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.1)' }} />
                        <button onClick={() => setReviewPhotos(prev => prev.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: -6, right: -6, background: '#E24B4A', border: 'none', borderRadius: '50%', width: 18, height: 18, color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ×
                        </button>
                      </div>
                    ))}
                    {reviewPhotos.length < 5 && (
                      <label style={{ width: 64, height: 64, border: '0.5px dashed rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)' }}>
                        <i className="ti ti-camera" style={{ fontSize: 22 }} />
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) setReviewPhotos(prev => [...prev, file])
                          e.target.value = ''
                        }} />
                      </label>
                    )}
                  </div>
                </div>
                <button onClick={handleReview} disabled={submittingReview} style={{
                  width: '100%', background: '#E8520A', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 0 18px rgba(232,82,10,0.35)',
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
