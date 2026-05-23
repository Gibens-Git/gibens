import { useState, useEffect } from 'react'
import { supabase } from '@gibens/supabase'
import { formatCurrency, formatDate } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'

export default function Earnings() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ week: 0, month: 0, total: 0, jobs: 0, winRate: 0 })
  const [payments, setPayments] = useState<{ title: string; amount: number; date: string; fee: number }[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('bids').select('amount, booking_fee, created_at, jobs(title)').eq('vendor_id', user.id).eq('status', 'accepted')
      .then(({ data }) => {
        if (!data) return
        const now = Date.now()
        const week = data.filter(b => now - new Date(b.created_at).getTime() < 7 * 86400000).reduce((s, b) => s + b.amount, 0)
        const month = data.filter(b => now - new Date(b.created_at).getTime() < 30 * 86400000).reduce((s, b) => s + b.amount, 0)
        const total = data.reduce((s, b) => s + b.amount, 0)
        setStats(s => ({ ...s, week, month, total, jobs: data.length }))
        setPayments(data.slice(0, 10).map(b => ({ title: (b.jobs as { title: string })?.title, amount: b.amount, fee: b.booking_fee, date: b.created_at })))
      })
    supabase.from('bids').select('status').eq('vendor_id', user.id)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const accepted = data.filter(b => b.status === 'accepted').length
        setStats(s => ({ ...s, winRate: Math.round((accepted / data.length) * 100) }))
      })
  }, [user])

  return (
    <div>
      <div style={{ padding: '14px 20px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Earnings</h1>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'This week', val: formatCurrency(stats.week) },
            { label: 'This month', val: formatCurrency(stats.month) },
            { label: 'Jobs completed', val: stats.jobs },
            { label: 'Bid win rate', val: `${stats.winRate}%` },
          ].map(s => (
            <div key={s.label} style={{ background: '#f7f7f5', borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 12, color: '#888' }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 500, marginTop: 4 }}>{s.val}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Recent payments</h2>
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
          {payments.length === 0 && <p style={{ padding: 20, color: '#888', fontSize: 14, textAlign: 'center' }}>No payments yet</p>}
          {payments.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: i < payments.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{p.title}</p>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{formatDate(p.date)} · Fee: ${p.fee}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 15, fontWeight: 500 }}>{formatCurrency(p.amount)}</p>
                <span style={{ fontSize: 11, background: '#EAF3DE', color: '#27500A', padding: '1px 6px', borderRadius: 20 }}>Paid</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
