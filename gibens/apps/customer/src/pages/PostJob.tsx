import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createJob, uploadJobPhoto, supabase } from '@gibens/supabase'
import { CATEGORIES, urgencyLabels } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from '../hooks/useLocation'

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 12px',
  background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: 8, fontSize: 14, color: '#fff', outline: 'none',
}

export default function PostJob() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { location, loading: locLoading, error: locError } = useLocation()

  const [form, setForm] = useState({
    category: params.get('category') || '',
    title: '',
    description: '',
    address_text: '',
    budget: '',
    urgency: 'flexible',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos(p => [...p, ...files].slice(0, 5))
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(p => [...p, ev.target?.result as string].slice(0, 5))
      reader.readAsDataURL(f)
    })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setError('Not signed in — please reload and try again.'); return }
    setLoading(true); setError('')

    try {
      let coords = location
      if (!coords) {
        if (!form.address_text) { setError('Please enter a service address so we can locate the job.'); setLoading(false); return }
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address_text)}&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const results = await res.json()
        if (results.length > 0) {
          coords = { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) }
        } else {
          setError("Couldn't find that address — try adding a city or zip code.")
          setLoading(false); return
        }
      }

      const tempId = crypto.randomUUID()
      const photoUrls: string[] = []
      for (const photo of photos) {
        const url = await uploadJobPhoto(photo, tempId)
        photoUrls.push(url)
      }

      const { data, error: err } = await createJob({
        customer_id: user.id,
        category: form.category,
        title: form.title,
        description: form.description,
        address_text: form.address_text,
        lat: coords.lat,
        lon: coords.lon,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        urgency: form.urgency,
        photo_urls: photoUrls,
      })

      if (err) throw err

      supabase.auth.getSession().then(({ data: { session } }) => {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-vendors`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: data.id }),
        }).catch(() => {})
      })

      nav(`/jobs/${data.id}`)
    } catch (err: unknown) {
      setError((err as Error).message || 'Something went wrong — please try again.')
      setLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.7px' }

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: '#141414' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Post a job</span>
      </div>

      <form onSubmit={submit} style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Service category *</label>
          <select required value={form.category} onChange={set('category')}
            style={{ ...inp, appearance: 'none' }}>
            <option value="">Select a category...</option>
            {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Job title *</label>
          <input required value={form.title} onChange={set('title')} style={inp} placeholder="e.g. Leaking kitchen pipe" />
        </div>

        <div>
          <label style={labelStyle}>Description *</label>
          <textarea required value={form.description} onChange={set('description')}
            style={{ ...inp, minHeight: 90, resize: 'none' }}
            placeholder="Describe the job in detail. More detail = better bids." />
        </div>

        <div>
          <label style={labelStyle}>Service address *</label>
          <input required value={form.address_text} onChange={set('address_text')} style={inp}
            placeholder="123 Main St, National City, CA" />
          <p style={{ fontSize: 11, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4,
            color: location ? '#7BC95A' : locLoading ? 'rgba(255,255,255,0.4)' : 'rgba(255,165,50,0.8)' }}>
            <i className={`ti ti-${location ? 'map-pin-check' : locLoading ? 'loader-2' : 'map-pin-exclamation'}`} style={{ fontSize: 13 }} />
            {location ? 'GPS location detected — your address will be pinned precisely'
              : locLoading ? 'Detecting your GPS location…'
              : 'GPS unavailable — we\'ll use your address to locate the job'}
          </p>
        </div>

        <div>
          <label style={labelStyle}>When do you need it?</label>
          <select value={form.urgency} onChange={set('urgency')} style={{ ...inp, appearance: 'none' }}>
            {Object.entries(urgencyLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Budget (optional)</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ padding: '11px 12px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>$</span>
            <input type="number" value={form.budget} onChange={set('budget')} min="0"
              style={{ ...inp, borderRadius: '0 8px 8px 0', flex: 1 }}
              placeholder="Leave blank for open bids" />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Photos (optional, up to 5)</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {previews.map((p, i) => (
              <div key={i} style={{ width: 70, height: 70, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '0.5px solid rgba(255,255,255,0.1)' }}>
                <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            {photos.length < 5 && (
              <label style={{ width: 70, height: 70, border: '0.5px dashed rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 24, background: 'rgba(255,255,255,0.04)' }}>
                <i className="ti ti-camera" />
                <input type="file" accept="image/*" multiple onChange={addPhoto} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} style={{
          background: loading ? '#c4440a' : '#E8520A', color: '#fff', border: 'none', borderRadius: 12,
          padding: 14, fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: loading ? 0.8 : 1,
          boxShadow: loading ? 'none' : '0 0 24px rgba(232,82,10,0.38)',
        }}>
          <i className={`ti ti-${loading ? 'loader-2' : 'send'}`} />
          {loading ? 'Posting…' : 'Post job — get bids from local pros'}
        </button>

        {error && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '0.5px solid rgba(255,107,107,0.2)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <i className="ti ti-alert-circle" style={{ color: '#FF6B6B', fontSize: 16, flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: '#FF8A8A', fontSize: 13, lineHeight: 1.4 }}>{error}</p>
          </div>
        )}
      </form>
    </div>
  )
}
