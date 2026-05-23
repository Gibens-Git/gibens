import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getJobDetail, createBid, getBookingFeePreview } from '@gibens/supabase'
import { pricingLabels, urgencyLabels, getBookingFee, formatCurrency } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { Job } from '@gibens/supabase'

export default function SubmitBid() {
  const { jobId } = useParams<{ jobId: string }>()
  const nav = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [form, setForm] = useState({ amount: '', message: '', pricing_type: 'fixed_incl', availability: 'Today (same day)', est_duration: 'Under 1 hour' })
  const [fee, setFee] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!jobId) return
    getJobDetail(jobId).then(({ data }) => setJob(data))
  }, [jobId])

  const updateFee = async (amount: string) => {
    const n = parseFloat(amount)
    if (!isNaN(n) && n > 0) {
      const { fee: f } = getBookingFee(n)
      setFee(f)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !jobId) return
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) { setError('Enter a valid bid amount'); return }
    setLoading(true); setError('')
    const { data, error: err } = await createBid({
      job_id: jobId,
      vendor_id: user.id,
      amount,
      booking_fee: fee,
      message: form.message,
      pricing_type: form.pricing_type as 'fixed_incl' | 'fixed_excl' | 'hourly' | 'estimate',
      availability: form.availability,
      est_duration: form.est_duration,
    })
    if (err) { setError(err.message); setLoading(false) }
    else nav('/bids')
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (k === 'amount') updateFee(e.target.value)
  }

  const amount = parseFloat(form.amount) || 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#888' }}><i className="ti ti-arrow-left" /></button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Submit a bid</span>
      </div>

      {job && (
        <div style={{ background: '#E8F0FB', padding: '12px 20px', borderBottom: '0.5px solid #B5D4F4' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#0C447C' }}>{job.title}</p>
          <p style={{ fontSize: 12, color: '#185FA5', marginTop: 2 }}>{job.address_text} · {urgencyLabels[job.urgency]}</p>
          <p style={{ fontSize: 13, color: '#555', marginTop: 6, lineHeight: 1.5 }}>{job.description}</p>
          {job.photo_urls?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {job.photo_urls.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: 60, height: 50, objectFit: 'cover', borderRadius: 6 }} />
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Your bid amount *</label>
          <div style={{ display: 'flex' }}>
            <span style={{ padding: '10px 12px', background: '#f5f5f5', border: '0.5px solid #ccc', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 14, color: '#666' }}>$</span>
            <input type="number" required min="1" value={form.amount} onChange={set('amount')}
              style={{ flex: 1, padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: '0 8px 8px 0', fontSize: 14 }}
              placeholder="0.00" />
          </div>
        </div>

        {/* Fee tiers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[{ range: 'Under $100', fee: 5 }, { range: '$100–$199', fee: 10 }, { range: '$200+', fee: 20 }].map(t => {
            const active = t.fee === fee && amount > 0
            return (
              <div key={t.fee} style={{ border: `0.5px solid ${active ? '#EF9F27' : '#e0e0e0'}`, borderRadius: 8, padding: 10, textAlign: 'center', background: active ? '#FAEEDA' : 'transparent' }}>
                <p style={{ fontSize: 11, color: active ? '#633806' : '#888' }}>{t.range}</p>
                <p style={{ fontSize: 18, fontWeight: 500, color: active ? '#412402' : '#333' }}>${t.fee}</p>
                <p style={{ fontSize: 10, color: active ? '#854F0B' : '#aaa' }}>{active ? 'your tier' : 'booking fee'}</p>
              </div>
            )
          })}
        </div>

        {amount > 0 && (
          <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#633806' }}>Lead booking fee for this bid</p>
              <p style={{ fontSize: 11, color: '#854F0B', marginTop: 2 }}>Charged only when customer accepts</p>
            </div>
            <p style={{ fontSize: 20, fontWeight: 500, color: '#412402' }}>${fee}</p>
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Pricing type *</label>
          <select value={form.pricing_type} onChange={set('pricing_type')}
            style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14 }}>
            {Object.entries(pricingLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Your message to the customer *</label>
          <textarea required value={form.message} onChange={set('message')}
            style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14, minHeight: 90, resize: 'none' }}
            placeholder="Introduce yourself, describe your approach, and why they should pick you..." />
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Availability</label>
          <select value={form.availability} onChange={set('availability')}
            style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14 }}>
            {['Today (same day)', 'Tomorrow morning', 'Tomorrow afternoon', 'This week — flexible'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Estimated duration</label>
          <select value={form.est_duration} onChange={set('est_duration')}
            style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: 8, fontSize: 14 }}>
            {['Under 1 hour', '1–2 hours', 'Half day', 'Full day', 'Multiple days'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {amount > 0 && (
          <div style={{ background: '#f7f7f5', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#888' }}>Your bid to customer</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#888' }}>Lead booking fee</span>
              <span style={{ fontWeight: 500, color: '#633806' }}>−${fee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '0.5px solid #e0e0e0' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>You receive</span>
              <span style={{ fontWeight: 500, color: '#0F4C8A' }}>{formatCurrency(Math.max(0, amount - fee))}</span>
            </div>
          </div>
        )}

        {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}

        <button type="submit" disabled={loading}
          style={{ background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <i className="ti ti-send" />
          {loading ? 'Submitting...' : `Submit bid${amount > 0 ? ` — ${formatCurrency(amount)} to customer` : ''}`}
        </button>
        <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>
          The booking fee is only charged when the customer accepts your bid.
        </p>
      </form>
    </div>
  )
}
