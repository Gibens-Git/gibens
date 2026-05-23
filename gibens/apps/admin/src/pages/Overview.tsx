import { useState, useEffect } from 'react'
import { supabase } from '@gibens/supabase'
import { formatCurrency, formatRelative } from '@gibens/ui'

export default function Overview() {
  const [stats, setStats] = useState({ customers: 0, vendors: 0, jobs: 0, revenue: 0 })
  const [activity, setActivity] = useState<{ text: string; time: string; color: string }[]>([])

  useEffect(() => {
    supabase.from('users').select('id', { count: 'exact' }).eq('role', 'customer').then(({ count }) => setStats(s => ({ ...s, customers: count || 0 })))
    supabase.from('vendor_profiles').select('user_id', { count: 'exact' }).eq('status', 'active').then(({ count }) => setStats(s => ({ ...s, vendors: count || 0 })))
    supabase.from('jobs').select('id', { count: 'exact' }).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).then(({ count }) => setStats(s => ({ ...s, jobs: count || 0 })))
    supabase.from('bids').select('booking_fee').eq('status', 'accepted').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .then(({ data }) => setStats(s => ({ ...s, revenue: data?.reduce((sum, b) => sum + b.booking_fee, 0) || 0 })))
    supabase.from('notifications').select('title, body, created_at, type').order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => {
        const colorMap: Record<string, string> = { new_job: '#534AB7', bid_accepted: '#3B6D11', job_accepted: '#0F4C8A' }
        setActivity(data?.map(n => ({ text: n.body, time: n.created_at, color: colorMap[n.type] || '#888' })) || [])
      })
  }, [])

  const kpis = [
    { label: 'Total customers', val: stats.customers.toLocaleString(), icon: 'users', delta: '+142 this week' },
    { label: 'Active vendors', val: stats.vendors.toLocaleString(), icon: 'briefcase', delta: '+23 this week' },
    { label: 'Jobs this month', val: stats.jobs.toLocaleString(), icon: 'clipboard-list', delta: '+18% vs last month' },
    { label: 'Fee revenue', val: formatCurrency(stats.revenue), icon: 'currency-dollar', delta: '+12% vs last month' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 20 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#f0eff7', borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className={`ti ti-${k.icon}`} style={{ fontSize: 14 }} /> {k.label}
            </p>
            <p style={{ fontSize: 26, fontWeight: 500, margin: '6px 0 4px' }}>{k.val}</p>
            <p style={{ fontSize: 12, color: '#3B6D11' }}><i className="ti ti-trending-up" style={{ fontSize: 12 }} /> {k.delta}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Recent activity</h2>
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: i < activity.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 5, flexShrink: 0 }} />
              <p style={{ fontSize: 13, flex: 1, lineHeight: 1.4, color: '#444' }}>{a.text}</p>
              <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{formatRelative(a.time)}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Quick actions</h2>
          {[
            { label: 'Review pending vendors', icon: 'shield-check', color: '#534AB7', link: '/vendors' },
            { label: 'Open disputes (4)', icon: 'alert-triangle', color: '#E24B4A', link: '/disputes' },
            { label: 'Manage lead pricing', icon: 'currency-dollar', color: '#EF9F27', link: '/pricing' },
            { label: 'View all jobs', icon: 'clipboard-list', color: '#0F4C8A', link: '/jobs' },
          ].map(a => (
            <a key={a.label} href={a.link} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)', textDecoration: 'none', color: '#333' }}>
              <i className={`ti ti-${a.icon}`} style={{ fontSize: 18, color: a.color }} />
              <span style={{ fontSize: 14 }}>{a.label}</span>
              <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#ccc', marginLeft: 'auto' }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
