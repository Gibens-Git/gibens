import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, getVendorProfile, updateVendorProfile, getVendorReviews, uploadAvatar, upsertUser } from '@gibens/supabase'
import { getAvatarColor, getInitials, formatRelative, CATEGORIES } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { ReviewWithUser } from '@gibens/supabase'

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

  return { status, coords, detect }
}

export default function ProProfile() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [vendor, setVendor] = useState<Record<string, unknown> | null>(null)
  const [radius, setRadius] = useState(15)
  const [saving, setSaving] = useState(false)
  const [updatingLoc, setUpdatingLoc] = useState(false)
  const [locUpdated, setLocUpdated] = useState(false)
  const [reviews, setReviews] = useState<ReviewWithUser[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const updateGPS = useGPS()

  useEffect(() => {
    if (!user) return
    setAvatarUrl(user.avatar_url ?? null)
    getVendorProfile(user.id).then(({ data, error }) => {
      if (data) {
        setVendor(data as Record<string, unknown>)
        setRadius((data as Record<string, unknown>).travel_radius_mi as number || 15)
      } else if (error?.code === 'PGRST116' || !data) {
        nav('/setup')
      }
    })
    getVendorReviews(user.id).then(({ data }) => setReviews((data as ReviewWithUser[]) || []))
  }, [user])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(file, user.id)
      await upsertUser(user.id, { avatar_url: url })
      setAvatarUrl(url + '?t=' + Date.now())
    } catch (err) {
      console.error('Avatar upload failed:', err)
    }
    setUploadingAvatar(false)
  }

  const saveRadius = async () => {
    if (!user) return
    setSaving(true)
    await updateVendorProfile(user.id, { travel_radius_mi: radius })
    setSaving(false)
  }

  const handleUpdateLocation = async () => {
    if (!user || !updateGPS.coords) return
    setUpdatingLoc(true)
    await updateVendorProfile(user.id, { location: `POINT(${updateGPS.coords.lon} ${updateGPS.coords.lat})` })
    setUpdatingLoc(false)
    setLocUpdated(true)
  }

  if (!user) return null
  const { bg, tc } = getAvatarColor(user.full_name)
  const cat = CATEGORIES.find(c => c.slug === (vendor?.category as string))

  return (
    <div>
      <div style={{ padding: '24px 20px 20px', textAlign: 'center', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-block', margin: '0 auto 12px' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.full_name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0F4C8A', display: 'block' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 24 }}>
              {getInitials(user.full_name)}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: '#0F4C8A', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            <i className={`ti ti-${uploadingAvatar ? 'loader-2' : 'camera'}`} style={{ fontSize: 11, color: '#fff' }} />
          </div>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={uploadingAvatar} />
        </label>

        <h1 style={{ fontSize: 18, fontWeight: 500 }}>{user.full_name}</h1>
        <p style={{ fontSize: 14, color: '#888', marginTop: 3 }}>{cat?.name || 'Vendor'}</p>
        {uploadingAvatar && <p style={{ fontSize: 12, color: '#0F4C8A', marginTop: 6 }}>Uploading photo...</p>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {vendor?.is_licensed && <span style={{ fontSize: 12, background: '#EAF3DE', color: '#3B6D11', padding: '3px 10px', borderRadius: 20 }}>Licensed</span>}
          {vendor?.is_insured && <span style={{ fontSize: 12, background: '#EAF3DE', color: '#3B6D11', padding: '3px 10px', borderRadius: 20 }}>Insured</span>}
          {vendor?.is_id_verified && <span style={{ fontSize: 12, background: '#EAF3DE', color: '#3B6D11', padding: '3px 10px', borderRadius: 20 }}>ID Verified</span>}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Service settings</p>

        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Travel radius: <strong>{radius} miles</strong></p>
            <input type="range" min="5" max="100" step="5" value={radius} onChange={e => setRadius(parseInt(e.target.value))} style={{ width: '100%', marginBottom: 8 }} />
            <button onClick={saveRadius} disabled={saving}
              style={{ background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save radius'}
            </button>
          </div>

          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Service location</p>
            {locUpdated ? (
              <p style={{ fontSize: 13, color: '#2E7D4F' }}><i className="ti ti-check" /> Location updated</p>
            ) : updateGPS.status === 'done' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#3B6D11', flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-map-pin" /> Location detected
                </span>
                <button onClick={handleUpdateLocation} disabled={updatingLoc}
                  style={{ background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
                  {updatingLoc ? 'Saving...' : 'Save location'}
                </button>
              </div>
            ) : (
              <button onClick={updateGPS.detect} disabled={updateGPS.status === 'loading'}
                style={{ background: updateGPS.status === 'error' ? '#FEF3C7' : '#f4f4f2', border: updateGPS.status === 'error' ? '0.5px solid #FCD34D' : '0.5px solid #ccc', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: updateGPS.status === 'error' ? '#92400E' : '#555' }}>
                <i className="ti ti-map-pin" />
                {updateGPS.status === 'loading' ? 'Detecting...' : updateGPS.status === 'error' ? 'Retry location detect' : 'Update my location'}
              </button>
            )}
          </div>

          {[
            { icon: 'credit-card', label: 'Payout method' },
            { icon: 'bell', label: 'Notifications' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <i className={`ti ti-${r.icon}`} style={{ color: '#0F4C8A', fontSize: 18 }} />
                {r.label}
              </span>
              <i className="ti ti-chevron-right" style={{ color: '#ccc', fontSize: 16 }} />
            </div>
          ))}
          <div onClick={() => nav('/credentials')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <i className="ti ti-license" style={{ color: '#0F4C8A', fontSize: 18 }} />
              License &amp; insurance
              {!vendor?.credentials_submitted && (
                <span style={{ fontSize: 10, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Required</span>
              )}
              {vendor?.credentials_submitted && (
                <span style={{ fontSize: 10, background: '#EAF3DE', color: '#3B6D11', padding: '2px 8px', borderRadius: 20 }}>On file</span>
              )}
            </span>
            <i className="ti ti-chevron-right" style={{ color: '#ccc', fontSize: 16 }} />
          </div>
        </div>

        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Reviews ({reviews.length})</p>
        {reviews.length === 0 ? (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '16px 0', marginBottom: 16 }}>No reviews yet</p>
        ) : (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{r.users?.full_name || 'Customer'}</span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{formatRelative(r.created_at)}</span>
                </div>
                <div style={{ display: 'flex', gap: 2, marginBottom: r.comment ? 6 : 0 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <i key={s} className={s <= r.rating ? 'ti ti-star-filled' : 'ti ti-star'}
                      style={{ fontSize: 14, color: s <= r.rating ? '#E8A020' : '#ddd' }} />
                  ))}
                </div>
                {r.comment && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <button onClick={async () => { await signOut(); nav('/login') }}
          style={{ width: '100%', padding: '12px 0', background: 'none', border: '0.5px solid #E24B4A', borderRadius: 10, color: '#E24B4A', fontSize: 14, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
