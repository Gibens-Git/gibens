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

  const handleLogout = async () => {
    await signOut()
    nav('/login')
  }

  useEffect(() => {
    if (!user) return
    getCustomerReviews(user.id).then(({ data }) => setReviews((data as ReviewWithUser[]) || []))
  }, [user])

  if (!user) return null
  const { bg, tc } = getAvatarColor(user.full_name)

  const rows = [
    { icon: 'clipboard-list', label: 'Job history', action: () => nav('/jobs') },
    { icon: 'map-pin', label: 'Saved addresses', action: () => {} },
    { icon: 'credit-card', label: 'Payment methods', action: () => {} },
    { icon: 'bell', label: 'Notifications', action: () => {} },
    { icon: 'help', label: 'Help & support', action: () => {} },
  ]

  return (
    <div>
      <div style={{ padding: '28px 20px 20px', textAlign: 'center', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 24, margin: '0 auto 12px' }}>
          {getInitials(user.full_name)}
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>{user.full_name}</h1>
        <p style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Customer account</p>
      </div>

      <div style={{ padding: '8px 20px' }}>
        {rows.map(r => (
          <button key={r.label} onClick={r.action} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '0.5px solid rgba(0,0,0,0.07)', background: 'none', border: 'none', borderBottom: '0.5px solid rgba(0,0,0,0.07)', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <i className={`ti ti-${r.icon}`} style={{ color: '#E8520A', fontSize: 18 }} />
              {r.label}
            </span>
            <i className="ti ti-chevron-right" style={{ color: '#ccc', fontSize: 16 }} />
          </button>
        ))}
        <div style={{ marginTop: 24, borderTop: '0.5px solid rgba(0,0,0,0.07)', paddingTop: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Reviews ({reviews.length})</p>
          {reviews.length === 0 ? (
            <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '16px 0' }}>No reviews yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background: '#f7f7f5', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{r.users?.full_name || 'Pro'}</span>
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
        </div>
        <button onClick={handleLogout} style={{ width: '100%', marginTop: 20, padding: '12px 0', background: 'none', border: '0.5px solid #E24B4A', borderRadius: 10, color: '#E24B4A', fontSize: 14, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
