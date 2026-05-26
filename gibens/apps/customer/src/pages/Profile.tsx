import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, getCustomerReviews } from '@gibens/supabase'
import { getAvatarColor, getInitials, formatRelative } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { ReviewWithUser } from '@gibens/supabase'

export default function Profile() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewWithUser[]>([])

  useEffect(() => {
    if (!user) return
    getCustomerReviews(user.id).then(({ data }) => setReviews((data as ReviewWithUser[]) || []))
  }, [user])

  const handleLogout = async () => {
    await signOut()
    nav('/login')
  }

  if (!user) return null
  const { bg, tc } = getAvatarColor(user.full_name)

  const rows = [
    { icon: 'clipboard-list', label: 'Job history',        action: () => nav('/jobs') },
    { icon: 'map-pin',        label: 'Saved addresses',    action: () => {} },
    { icon: 'credit-card',    label: 'Payment methods',    action: () => {} },
    { icon: 'bell',           label: 'Notifications',      action: () => {} },
    { icon: 'help',           label: 'Help & support',     action: () => {} },
  ]

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '32px 20px 24px', textAlign: 'center', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,82,10,0.12) 0%, transparent 70%), #141414' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 24, margin: '0 auto 12px', border: '2px solid rgba(232,82,10,0.3)', boxShadow: '0 0 20px rgba(232,82,10,0.2)' }}>
          {getInitials(user.full_name)}
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{user.full_name}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Customer account</p>
      </div>

      <div style={{ padding: '8px 20px' }}>
        {rows.map(r => (
          <button key={r.label} onClick={r.action} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', background: 'none', border: 'none', borderBottom: '0.5px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
              <i className={`ti ti-${r.icon}`} style={{ color: '#E8520A', fontSize: 18, width: 20 }} />
              {r.label}
            </span>
            <i className="ti ti-chevron-right" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }} />
          </button>
        ))}

        {/* Reviews */}
        <div style={{ marginTop: 28, borderTop: '0.5px solid rgba(255,255,255,0.07)', paddingTop: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Reviews ({reviews.length})</p>
          {reviews.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '16px 0' }}>No reviews yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{r.users?.full_name || 'Pro'}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{formatRelative(r.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: r.comment ? 6 : 0 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <i key={s} className={s <= r.rating ? 'ti ti-star-filled' : 'ti ti-star'}
                        style={{ fontSize: 14, color: s <= r.rating ? '#E8A020' : 'rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  {r.comment && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleLogout} style={{ width: '100%', marginTop: 20, marginBottom: 20, padding: '12px 0', background: 'rgba(255,107,107,0.08)', border: '0.5px solid rgba(255,107,107,0.3)', borderRadius: 10, color: '#FF6B6B', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
