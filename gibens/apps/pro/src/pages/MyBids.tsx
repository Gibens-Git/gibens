import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVendorBids } from '@gibens/supabase'
import { formatRelative, formatCurrency } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { Bid } from '@gibens/supabase'

export default function MyBids() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getVendorBids(user.id).then(({ data }) => { setBids(data || []); setLoading(false) })
  }, [user])

  const statusConfig: Record<string, { label: string; bg: string; tc: string }> = {
    pending:  { label: 'Pending',       bg: '#FAEEDA', tc: '#633806' },
    accepted: { label: 'Accepted',      bg: '#EAF3DE', tc: '#27500A' },
    declined: { label: 'Not selected',  bg: '#f0f0f0', tc: '#888' },
    withdrawn:{ label: 'Withdrawn',     bg: '#f0f0f0', tc: '#888' },
  }

  return (
    <div>
      <div style={{ padding: '14px 20px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>My bids</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Track your submitted bids</p>
      </div>

      {loading && <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>}

      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bids.map((bid) => {
          const sc = statusConfig[bid.status] || statusConfig.pending
          return (
            <div key={bid.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ flex: 1, marginRight: 10 }}>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>{bid.jobs?.title}</p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{bid.jobs?.address_text} · {formatRelative(bid.created_at)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 18, fontWeight: 500, color: '#0F4C8A' }}>{formatCurrency(bid.amount)}</p>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.tc, fontWeight: 500 }}>{sc.label}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#888' }}>Booking fee: ${bid.booking_fee}</p>
              {bid.status === 'accepted' && (
                <button onClick={() => nav(`/chat/${bid.job_id}`)}
                  style={{ marginTop: 10, width: '100%', background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className="ti ti-message" /> Message customer
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
