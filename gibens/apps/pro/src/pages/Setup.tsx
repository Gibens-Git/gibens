import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@gibens/supabase'
import { CATEGORIES } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'

function useGPS() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)

  const detect = () => {
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setStatus('done') },
      err => { setStatus(err.code === 1 ? 'denied' as 'error' : 'error') },
      { timeout: 10000 }
    )
  }

  const setManual = (lat: number, lon: number) => { setCoords({ lat, lon }); setStatus('done') }

  return { status, coords, detect, setManual }
}

export default function Setup() {
  const nav = useNavigate()
  const { user, loading } = useAuth()
  const [category, setCategory] = useState('')
  const [radius, setRadius] = useState('15')
  const [manualAddress, setManualAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const gps = useGPS()

  useEffect(() => { if (gps.status === 'done') setError('') }, [gps.status])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  if (!user) { nav('/login'); return null }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gps.coords) { setError('Please set your location — it is required to receive job leads.'); return }
    setSaving(true)
    const { data: existingUser } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
    if (!existingUser) {
      await supabase.from('users').insert({ id: user.id, role: 'vendor', full_name: user.full_name, phone: user.phone || null })
    }
    await supabase.from('vendor_profiles').insert({
      user_id: user.id,
      category,
      travel_radius_mi: parseInt(radius),
      status: 'pending',
      location: `POINT(${gps.coords.lon} ${gps.coords.lat})`,
    })
    nav('/credentials')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0F4C8A' }}>
      <div style={{ marginBottom: 28 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 226 56" height="36" fill="none">
          <defs><linearGradient id="lb-setup" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6535"/><stop offset="1" stopColor="#D94A06"/>
          </linearGradient></defs>
          <rect width="56" height="56" rx="13" fill="url(#lb-setup)"/>
          <path transform="translate(28,28)" d="M11.3,-11.3 A16,16 0 1,0 16,0 L4,0"
            fill="none" stroke="white" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="70" y="28" dominantBaseline="middle"
            fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
            fontSize="28" fontWeight="800" letterSpacing="-1">
            <tspan fill="#E8520A">g</tspan><tspan fill="#ffffff">ibens</tspan>
          </text>
          <rect x="172" y="16" width="46" height="24" rx="12" fill="rgba(255,255,255,0.2)"/>
          <text x="195" y="28" dominantBaseline="middle" textAnchor="middle"
            fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
            fontSize="13" fontWeight="600" fill="rgba(255,255,255,0.9)">Pro</text>
        </svg>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 15 }}>Set up your vendor profile</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Your service category *</label>
            <select required value={category} onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }}>
              <option value="">Select your category...</option>
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Travel radius: {radius} miles</label>
            <input type="range" min="5" max="100" step="5" value={radius} onChange={e => setRadius(e.target.value)} style={{ width: '100%' }} />
          </div>

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
                  {gps.status === 'loading' ? 'Detecting...' : gps.status === 'error' ? 'Retry GPS' : 'Use my GPS location'}
                </button>
                {gps.status === 'error' && (
                  <p style={{ fontSize: 12, color: '#E24B4A', margin: 0 }}>Location access was denied. Please enter your address below.</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#bbb', fontSize: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#eee' }} />
                  or enter address
                  <div style={{ flex: 1, height: 1, background: '#eee' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" value={manualAddress} onChange={e => setManualAddress(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), geocodeAddress())}
                    placeholder="e.g. 860 5th Ave, San Diego CA"
                    style={{ flex: 1, padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 14 }} />
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
          <button type="submit" disabled={saving}
            style={{ background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 500, marginTop: 4 }}>
            {saving ? 'Saving...' : 'Continue to credentials'}
          </button>
        </form>
      </div>
    </div>
  )
}
