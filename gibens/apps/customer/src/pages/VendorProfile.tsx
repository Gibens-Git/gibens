import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVendorProfile, getVendorReviews } from '@gibens/supabase'
import { getAvatarColor, getInitials, formatRelative } from '@gibens/ui'
import type { VendorProfile as VP, ReviewWithUser } from '@gibens/supabase'

export default function VendorProfile() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const nav = useNavigate()
  const [vendor, setVendor] = useState<VP | null>(null)
  const [reviews, setReviews] = useState<ReviewWithUser[]>([])

  useEffect(() => {
    if (!vendorId) return
    getVendorProfile(vendorId).then(({ data }) => setVendor(data))
    getVendorReviews(vendorId).then(({ data }) => setReviews((data as ReviewWithUser[]) || []))
  }, [vendorId])

  if (!vendor) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: '#0D0D0D', minHeight: '100vh' }}>Loading...</div>

  const { bg, tc } = getAvatarColor(vendor.users?.full_name || '')

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', background: '#141414' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Vendor profile</span>
      </div>

      <div style={{ padding: '24px 20px' }}>
        {/* Vendor header */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            {vendor.users?.avatar_url ? (
              <img src={vendor.users.avatar_url} alt={vendor.users?.full_name || ''} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(232,82,10,0.25)', flexShrink: 0, display: 'block' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 22, border: '2px solid rgba(232,82,10,0.25)', flexShrink: 0 }}>
                {getInitials(vendor.users?.full_name || '?')}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{vendor.users?.full_name}</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                {vendor.category} · <span style={{ color: '#E8A020' }}>★</span> {vendor.avg_rating}
              </p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {vendor.is_licensed && <span style={{ fontSize: 10, background: 'rgba(39,80,10,0.3)', color: '#7BC95A', border: '0.5px solid rgba(80,150,30,0.3)', padding: '2px 8px', borderRadius: 20 }}>Licensed</span>}
                {vendor.is_insured && <span style={{ fontSize: 10, background: 'rgba(39,80,10,0.3)', color: '#7BC95A', border: '0.5px solid rgba(80,150,30,0.3)', padding: '2px 8px', borderRadius: 20 }}>Insured</span>}
                {vendor.is_id_verified && <span style={{ fontSize: 10, background: 'rgba(39,80,10,0.3)', color: '#7BC95A', border: '0.5px solid rgba(80,150,30,0.3)', padding: '2px 8px', borderRadius: 20 }}>ID Verified</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: vendor.bio ? 14 : 0 }}>
            {[
              { label: 'Rating',   val: vendor.avg_rating || '—' },
              { label: 'Jobs done',val: vendor.total_jobs },
              { label: 'Rate',     val: vendor.base_rate ? `$${vendor.base_rate}/hr` : '—' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10, textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{s.val}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {vendor.bio && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{vendor.bio}</p>
          )}
        </div>

        <button onClick={() => nav('/post-job')} style={{ width: '100%', background: '#E8520A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 24, boxShadow: '0 0 24px rgba(232,82,10,0.38)' }}>
          Request a bid from this vendor
        </button>

        <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
          Reviews ({reviews.length})
        </p>
        {reviews.length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>No reviews yet</p>
        ) : (
          reviews.map(r => (
            <div key={r.id} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{r.users?.full_name || 'Customer'}</span>
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
          ))
        )}
      </div>
    </div>
  )
}
