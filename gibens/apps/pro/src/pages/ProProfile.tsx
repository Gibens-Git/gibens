import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, getVendorProfile, updateVendorProfile, supabase } from '@gibens/supabase'
import { getAvatarColor, getInitials, CATEGORIES } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'

export default function ProProfile() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [vendor, setVendor] = useState<Record<string, unknown> | null>(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newRadius, setNewRadius] = useState('15')
  const [creating, setCreating] = useState(false)
  const [radius, setRadius] = useState(15)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    getVendorProfile(user.id).then(({ data, error }) => {
      if (data) {
        setVendor(data as Record<string, unknown>)
        setRadius((data as Record<string, unknown>).travel_radius_mi as number || 15)
      } else if (error?.code === 'PGRST116' || !data) {
        setProfileMissing(true)
      }
    })
  }, [user])

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newCategory) return
    setCreating(true)
    await supabase.from('vendor_profiles').insert({
      user_id: user.id,
      category: newCategory,
      travel_radius_mi: parseInt(newRadius),
      status: 'pending',
    })
    const { data } = await getVendorProfile(user.id)
    if (data) { setVendor(data as Record<string, unknown>); setRadius(parseInt(newRadius)); setProfileMissing(false) }
    setCreating(false)
  }

  const saveRadius = async () => {
    if (!user) return
    setSaving(true)
    await updateVendorProfile(user.id, { travel_radius_mi: radius })
    setSaving(false)
  }

  if (!user) return null
  const { bg, tc } = getAvatarColor(user.full_name)
  const cat = CATEGORIES.find(c => c.slug === (vendor?.category as string))

  if (profileMissing) return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>Complete your vendor profile</h2>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Choose your service category and travel radius to start receiving job leads.</p>
      <form onSubmit={createProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Your service category *</label>
          <select required value={newCategory} onChange={e => setNewCategory(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }}>
            <option value="">Select a category...</option>
            {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Travel radius: {newRadius} miles</label>
          <input type="range" min="5" max="100" step="5" value={newRadius} onChange={e => setNewRadius(e.target.value)} style={{ width: '100%' }} />
        </div>
        <button type="submit" disabled={creating}
          style={{ background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 500 }}>
          {creating ? 'Creating...' : 'Create profile'}
        </button>
      </form>
      <button onClick={async () => { await signOut(); nav('/login') }}
        style={{ width: '100%', marginTop: 16, padding: '12px 0', background: 'none', border: '0.5px solid #E24B4A', borderRadius: 10, color: '#E24B4A', fontSize: 14, cursor: 'pointer' }}>
        Sign out
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ padding: '24px 20px 20px', textAlign: 'center', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 24, margin: '0 auto 12px' }}>
          {getInitials(user.full_name)}
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>{user.full_name}</h1>
        <p style={{ fontSize: 14, color: '#888', marginTop: 3 }}>{cat?.name || 'Vendor'}</p>
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
          {[
            { icon: 'star', label: `Reviews (${vendor?.total_reviews || 0})` },
            { icon: 'credit-card', label: 'Payout method' },
            { icon: 'shield', label: 'Verification documents' },
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
        </div>

        <button onClick={async () => { await signOut(); nav('/login') }}
          style={{ width: '100%', padding: '12px 0', background: 'none', border: '0.5px solid #E24B4A', borderRadius: 10, color: '#E24B4A', fontSize: 14, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
