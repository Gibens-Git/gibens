import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVendorProfile, supabase } from '@gibens/supabase'
import { getAvatarColor, getInitials, formatCurrency } from '@gibens/ui'
import type { VendorProfile as VP } from '@gibens/supabase'

export default function VendorProfile() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const nav = useNavigate()
  const [vendor, setVendor] = useState<VP | null>(null)

  useEffect(() => {
    if (!vendorId) return
    getVendorProfile(vendorId).then(({ data }) => setVendor(data))
  }, [vendorId])

  if (!vendor) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>

  const { bg, tc } = getAvatarColor(vendor.users?.full_name || '')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#888' }}><i className="ti ti-arrow-left" /></button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Vendor profile</span>
      </div>

      <div style={{ padding: '20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 22 }}>
            {getInitials(vendor.users?.full_name || '?')}
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 500 }}>{vendor.users?.full_name}</h1>
            <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{vendor.category} · {vendor.avg_rating} ★</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {vendor.is_licensed && <span style={{ fontSize: 11, background: '#EAF3DE', color: '#3B6D11', padding: '2px 8px', borderRadius: 20 }}>Licensed</span>}
              {vendor.is_insured && <span style={{ fontSize: 11, background: '#EAF3DE', color: '#3B6D11', padding: '2px 8px', borderRadius: 20 }}>Insured</span>}
              {vendor.is_id_verified && <span style={{ fontSize: 11, background: '#EAF3DE', color: '#3B6D11', padding: '2px 8px', borderRadius: 20 }}>ID Verified</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Rating', val: vendor.avg_rating || '—' },
            { label: 'Jobs done', val: vendor.total_jobs },
            { label: 'Rate', val: vendor.base_rate ? `$${vendor.base_rate}/hr` : '—' },
          ].map(s => (
            <div key={s.label} style={{ background: '#f7f7f5', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 500 }}>{s.val}</p>
              <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {vendor.bio && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>About</p>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{vendor.bio}</p>
          </div>
        )}

        <button onClick={() => nav('/post-job')} style={{ width: '100%', background: '#E8520A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          Request a bid from this vendor
        </button>
      </div>
    </div>
  )
}
