import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, supabase } from '@gibens/supabase'
import { CATEGORIES } from '@gibens/ui'

function useGPS() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)

  const detect = () => {
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setStatus('done') },
      () => setStatus('error'),
      { timeout: 10000 }
    )
  }

  const setManual = (lat: number, lon: number) => {
    setCoords({ lat, lon })
    setStatus('done')
  }

  return { status, coords, detect, setManual }
}

export default function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', category: '', radius: '15' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const gps = useGPS()

  const geocodeAddress = async () => {
    if (!manualAddress.trim()) return
    setGeocoding(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualAddress)}&format=json&limit=1`)
      const data = await res.json()
      if (data?.[0]) {
        gps.setManual(parseFloat(data[0].lat), parseFloat(data[0].lon))
      } else {
        setError('Address not found — try a more specific address or city.')
      }
    } catch {
      setError('Could not look up address. Check your connection and try again.')
    }
    setGeocoding(false)
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gps.coords) { setError('Please detect your location — it is required to receive job leads.'); return }
    setLoading(true); setError('')
    const { data, error: err } = await signUp(form.email, form.password, form.name, 'vendor')
    if (err) { setError(err.message); setLoading(false); return }

    if (data.session && data.user) {
      await supabase.from('users').insert({ id: data.user.id, role: 'vendor', full_name: form.name, phone: form.phone || null })
      await supabase.from('vendor_profiles').insert({
        user_id: data.user.id,
        category: form.category,
        travel_radius_mi: parseInt(form.radius),
        status: 'pending',
        location: `POINT(${gps.coords.lon} ${gps.coords.lat})`,
      })
      nav('/')
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0F4C8A' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <i className="ti ti-mail-check" style={{ fontSize: 48, color: '#0F4C8A', display: 'block', marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.5 }}>
          We sent a confirmation link to <strong>{form.email}</strong>.<br />
          Click it to activate your vendor account, then come back and sign in.
        </p>
        <button onClick={() => nav('/login')} style={{ marginTop: 24, background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15, cursor: 'pointer' }}>
          Go to sign in
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0F4C8A' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: '#fff' }}>Gibens <span style={{ opacity: 0.7, fontSize: 16, background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 20 }}>Pro</span></h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 15 }}>Join as a service provider</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full name', key: 'name', type: 'text', placeholder: 'Ricardo Castillo' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+1 (619) 555-0100' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} required={f.key !== 'phone'} value={(form as Record<string,string>)[f.key]} onChange={set(f.key)}
                style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }} placeholder={f.placeholder} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Your service category</label>
            <select required value={form.category} onChange={set('category')}
              style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }}>
              <option value="">Select your category...</option>
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Travel radius: {form.radius} miles</label>
            <input type="range" min="5" max="100" step="5" value={form.radius} onChange={set('radius')} style={{ width: '100%' }} />
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>
              Your location <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            {gps.status === 'done' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EAF3DE', borderRadius: 8, padding: '10px 12px' }}>
                <i className="ti ti-map-pin" style={{ color: '#3B6D11', fontSize: 16 }} />
                <span style={{ fontSize: 13, color: '#3B6D11', flex: 1 }}>Location set</span>
                <button type="button" onClick={gps.detect}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: '#3B6D11', cursor: 'pointer', textDecoration: 'underline' }}>
                  Re-detect
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button type="button" onClick={gps.detect} disabled={gps.status === 'loading'}
                  style={{ width: '100%', background: '#f4f4f2', border: '0.5px solid #ccc', borderRadius: 10, padding: '10px 14px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#555' }}>
                  <i className={gps.status === 'loading' ? 'ti ti-loader' : 'ti ti-map-pin'} />
                  {gps.status === 'loading' ? 'Detecting...' : 'Use my GPS location'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#bbb', fontSize: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#eee' }} />
                  or enter address
                  <div style={{ flex: 1, height: 1, background: '#eee' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={e => setManualAddress(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), geocodeAddress())}
                    placeholder="e.g. 860 5th Ave, San Diego CA"
                    style={{ flex: 1, padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 14, outline: 'none' }}
                  />
                  <button type="button" onClick={geocodeAddress} disabled={geocoding || !manualAddress.trim()}
                    style={{ background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 10, padding: '0 14px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {geocoding ? '...' : 'Find'}
                  </button>
                </div>
              </div>
            )}
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 5 }}>Used to match you with nearby job leads</p>
          </div>

          {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 500, marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create vendor account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' }}>
          Already have an account? <Link to="/login" style={{ color: '#0F4C8A', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
