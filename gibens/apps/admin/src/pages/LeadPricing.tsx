import { useState, useEffect } from 'react'
import { adminGetLeadFees, adminUpdateLeadFee } from '@gibens/supabase'
import { supabase } from '@gibens/supabase'
import { formatCurrency, formatDate } from '@gibens/ui'

interface Tier {
  id: number
  min_amount: number
  max_amount: number | null
  fee: number
  label: string
}

interface Payment {
  booking_fee: number
  created_at: string
  jobs: { title: string } | null
  vendor_id: string
}

export default function LeadPricing() {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState({ totalMonth: 0, totalAll: 0, count: 0 })

  useEffect(() => {
    adminGetLeadFees().then(({ data }) => setTiers((data as Tier[]) || []))
    supabase.from('bids').select('booking_fee, created_at, jobs(title), vendor_id').eq('status', 'accepted').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => {
        if (!data) return
        setPayments(data as Payment[])
        const now = Date.now()
        const month = data.filter(b => now - new Date(b.created_at).getTime() < 30 * 86400000).reduce((s, b) => s + b.booking_fee, 0)
        const all = data.reduce((s, b) => s + b.booking_fee, 0)
        setStats({ totalMonth: month, totalAll: all, count: data.length })
      })
  }, [])

  const save = async (id: number) => {
    const val = parseFloat(editVal)
    if (isNaN(val) || val < 0) { alert('Enter a valid fee amount'); return }
    setSaving(true)
    await adminUpdateLeadFee(id, val)
    setTiers(prev => prev.map(t => t.id === id ? { ...t, fee: val } : t))
    setEditing(null)
    setSaving(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Lead pricing</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Set the booking fee charged to vendors when a customer accepts their bid</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Revenue this month', val: formatCurrency(stats.totalMonth) },
          { label: 'Total fee revenue', val: formatCurrency(stats.totalAll) },
          { label: 'Accepted bids', val: stats.count },
        ].map(s => (
          <div key={s.label} style={{ background: '#EEEDFE', borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 12, color: '#534AB7' }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 500, marginTop: 4 }}>{s.val}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Fee tiers</h2>
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        {tiers.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: i < tiers.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: 15 }}>{t.label}</p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                Bids from {formatCurrency(t.min_amount)}{t.max_amount ? ` to ${formatCurrency(t.max_amount)}` : ' and above'}
              </p>
            </div>
            {editing === t.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666' }}>$</span>
                <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} min="0" step="0.50"
                  style={{ width: 80, padding: '6px 8px', border: '0.5px solid #534AB7', borderRadius: 8, fontSize: 14, textAlign: 'right' }} />
                <button onClick={() => save(t.id)} disabled={saving}
                  style={{ padding: '6px 14px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={() => setEditing(null)}
                  style={{ padding: '6px 10px', background: 'none', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26, fontWeight: 500, color: '#534AB7' }}>${t.fee}</span>
                <button onClick={() => { setEditing(t.id); setEditVal(String(t.fee)) }}
                  style={{ padding: '6px 12px', background: 'none', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#666' }}>
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Recent payments</h2>
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, padding: '10px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 500 }}>
          <span>Job</span><span>Date</span><span style={{ textAlign: 'right' }}>Fee</span>
        </div>
        {payments.map((p, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, padding: '11px 16px', alignItems: 'center', borderBottom: i < payments.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', fontSize: 13 }}>
            <span style={{ fontWeight: 500 }}>{(p.jobs as { title: string })?.title || 'Job'}</span>
            <span style={{ color: '#666' }}>{formatDate(p.created_at)}</span>
            <span style={{ textAlign: 'right', fontWeight: 500, color: '#534AB7' }}>{formatCurrency(p.booking_fee)}</span>
          </div>
        ))}
        {payments.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 14 }}>No payments yet</p>}
      </div>
    </div>
  )
}
