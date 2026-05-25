import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVendorBids, createReview, supabase } from '@gibens/supabase'
import { formatRelative, formatCurrency } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { Bid } from '@gibens/supabase'

type ReviewForm = { rating: number; comment: string; submitting: boolean; done: boolean }

export default function MyBids() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewedJobIds, setReviewedJobIds] = useState<Set<string>>(new Set())
  const [openForms, setOpenForms] = useState<Record<string, ReviewForm>>({})

  useEffect(() => {
    if (!user) return
    getVendorBids(user.id).then(({ data }) => { setBids(data || []); setLoading(false) })
    supabase.from('reviews').select('job_id').eq('reviewer_id', user.id)
      .then(({ data }) => { if (data) setReviewedJobIds(new Set(data.map(r => r.job_id))) })
  }, [user])

  const openForm = (bidId: string) =>
    setOpenForms(prev => ({ ...prev, [bidId]: { rating: 5, comment: '', submitting: false, done: false } }))

  const closeForm = (bidId: string) =>
    setOpenForms(prev => { const next = { ...prev }; delete next[bidId]; return next })

  const setFormField = (bidId: string, field: Partial<ReviewForm>) =>
    setOpenForms(prev => ({ ...prev, [bidId]: { ...prev[bidId], ...field } }))

  const submitReview = async (bid: Bid) => {
    if (!user || !bid.jobs?.customer_id) return
    const form = openForms[bid.id]
    if (!form) return
    setFormField(bid.id, { submitting: true })
    const { error } = await createReview({
      job_id: bid.job_id,
      reviewer_id: user.id,
      reviewee_id: bid.jobs.customer_id,
      rating: form.rating,
      comment: form.comment.trim() || undefined,
    })
    if (error) {
      setFormField(bid.id, { submitting: false })
      alert('Could not submit review: ' + error.message)
    } else {
      setFormField(bid.id, { submitting: false, done: true })
      setReviewedJobIds(prev => new Set([...prev, bid.job_id]))
    }
  }

  const statusConfig: Record<string, { label: string; bg: string; tc: string }> = {
    pending:   { label: 'Pending',      bg: '#FAEEDA', tc: '#633806' },
    accepted:  { label: 'Accepted',     bg: '#EAF3DE', tc: '#27500A' },
    declined:  { label: 'Not selected', bg: '#f0f0f0', tc: '#888' },
    withdrawn: { label: 'Withdrawn',    bg: '#f0f0f0', tc: '#888' },
  }

  return (
    <div>
      <div style={{ padding: '14px 20px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>My bids</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Track your submitted bids</p>
      </div>

      {loading && <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>}

      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bids.map((bid) => {
          const sc = statusConfig[bid.status] || statusConfig.pending
          const isCompleted = bid.jobs?.status === 'completed'
          const alreadyReviewed = reviewedJobIds.has(bid.job_id)
          const form = openForms[bid.id]

          return (
            <div key={bid.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ flex: 1, marginRight: 10 }}>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>{bid.jobs?.title}</p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{bid.jobs?.address_text} · {formatRelative(bid.created_at)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 18, fontWeight: 500, color: '#0F4C8A' }}>{formatCurrency(bid.amount)}</p>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.tc, fontWeight: 500 }}>{sc.label}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#888' }}>Booking fee: ${bid.booking_fee}</p>

              {(bid.status === 'pending' || bid.status === 'accepted') && (
                <button onClick={() => nav(`/chat/${bid.job_id}`)}
                  style={{ marginTop: 10, width: '100%', background: bid.status === 'accepted' ? '#0F4C8A' : 'none', color: bid.status === 'accepted' ? '#fff' : '#0F4C8A', border: bid.status === 'accepted' ? 'none' : '0.5px solid #0F4C8A', borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className="ti ti-message" /> {bid.status === 'accepted' ? 'Message customer' : 'Chat with customer'}
                </button>
              )}

              {isCompleted && bid.status === 'accepted' && (
                <div style={{ marginTop: 10, borderTop: '0.5px solid rgba(0,0,0,0.07)', paddingTop: 10 }}>
                  {alreadyReviewed || form?.done ? (
                    <p style={{ fontSize: 13, color: '#2E7D4F' }}>
                      <i className="ti ti-check" /> Customer reviewed
                    </p>
                  ) : !form ? (
                    <button onClick={() => openForm(bid.id)} style={{
                      width: '100%', background: 'none', border: '0.5px solid #E8A020',
                      color: '#B37400', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <i className="ti ti-star" /> Review this customer
                    </button>
                  ) : (
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Rate the customer</p>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => setFormField(bid.id, { rating: star })}
                            style={{ background: 'none', border: 'none', fontSize: 30, cursor: 'pointer', padding: '0 2px', color: star <= form.rating ? '#E8A020' : '#ddd' }}>
                            <i className={star <= form.rating ? 'ti ti-star-filled' : 'ti ti-star'} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={form.comment}
                        onChange={e => setFormField(bid.id, { comment: e.target.value })}
                        placeholder="Leave a comment (optional)..."
                        rows={2}
                        style={{ width: '100%', border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: 13, resize: 'none', boxSizing: 'border-box', outline: 'none', marginBottom: 8 }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => submitReview(bid)} disabled={form.submitting} style={{
                          flex: 2, background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        }}>
                          {form.submitting ? 'Submitting...' : 'Submit'}
                        </button>
                        <button onClick={() => closeForm(bid.id)} style={{
                          flex: 1, background: 'none', border: '0.5px solid #ccc', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer', color: '#888',
                        }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
