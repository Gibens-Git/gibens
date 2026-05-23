import { useState, useEffect } from 'react'
import { adminGetAllUsers, adminUpdateVendorStatus, adminUpdateUserStatus } from '@gibens/supabase'
import { getInitials, getAvatarColor, formatDate, CATEGORIES } from '@gibens/ui'

interface VendorRow {
  id: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  vendor_profiles: {
    category: string
    status: string
    avg_rating: number
    total_jobs: number
  } | null
}

export default function Vendors() {
  const [vendors, setVendors] = useState<VendorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    adminGetAllUsers().then(({ data }) => {
      const vs = (data || []).filter((u: VendorRow) => u.role === 'vendor')
      setVendors(vs as VendorRow[])
      setLoading(false)
    })
  }, [])

  const updateStatus = async (userId: string, status: string) => {
    await adminUpdateVendorStatus(userId, status)
    setVendors(prev => prev.map(v =>
      v.id === userId && v.vendor_profiles
        ? { ...v, vendor_profiles: { ...v.vendor_profiles, status } }
        : v
    ))
  }

  const statuses = ['all', 'pending', 'active', 'suspended', 'banned']
  const filtered = vendors
    .filter(v => filter === 'all' || v.vendor_profiles?.status === filter)
    .filter(v => v.full_name.toLowerCase().includes(search.toLowerCase()))

  const statusBadge = (s: string) => {
    const map: Record<string, { bg: string; tc: string }> = {
      pending:   { bg: '#FAEEDA', tc: '#633806' },
      active:    { bg: '#EAF3DE', tc: '#27500A' },
      suspended: { bg: '#FCEBEB', tc: '#791F1F' },
      banned:    { bg: '#FCEBEB', tc: '#501313' },
    }
    const c = map[s] || { bg: '#f0f0f0', tc: '#888' }
    return <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: c.bg, color: c.tc }}>{s}</span>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Vendors</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{vendors.length} total registered vendors</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..."
          style={{ border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', outline: 'none', width: 200 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: filter === s ? 'none' : '0.5px solid #ddd', background: filter === s ? '#534AB7' : 'none', color: filter === s ? '#fff' : '#888' }}>
            {s.charAt(0).toUpperCase() + s.slice(1)} {s !== 'all' && `(${vendors.filter(v => v.vendor_profiles?.status === s).length})`}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading...</p>}

      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', gap: 12, padding: '10px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 500 }}>
          <span>Vendor</span><span>Category</span><span>Rating</span><span>Jobs</span><span>Status</span><span>Actions</span>
        </div>
        {filtered.map((v, i) => {
          const { bg, tc } = getAvatarColor(v.full_name)
          const vp = v.vendor_profiles
          const cat = CATEGORIES.find(c => c.slug === vp?.category)
          return (
            <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 12, flexShrink: 0 }}>
                  {getInitials(v.full_name)}
                </div>
                <div>
                  <p style={{ fontWeight: 500 }}>{v.full_name}</p>
                  <p style={{ fontSize: 11, color: '#aaa' }}>{formatDate(v.created_at)}</p>
                </div>
              </div>
              <span style={{ color: '#666' }}>{cat?.name || vp?.category || '—'}</span>
              <span style={{ color: '#666' }}>{vp?.avg_rating ? `${vp.avg_rating} ★` : '—'}</span>
              <span style={{ color: '#666' }}>{vp?.total_jobs ?? 0}</span>
              <span>{statusBadge(vp?.status || 'pending')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {vp?.status === 'pending' && (
                  <button onClick={() => updateStatus(v.id, 'active')}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#EAF3DE', color: '#27500A', cursor: 'pointer' }}>
                    Approve
                  </button>
                )}
                {vp?.status === 'active' && (
                  <button onClick={() => updateStatus(v.id, 'suspended')}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#FCEBEB', color: '#791F1F', cursor: 'pointer' }}>
                    Suspend
                  </button>
                )}
                {vp?.status === 'suspended' && (
                  <button onClick={() => updateStatus(v.id, 'active')}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '0.5px solid #ddd', background: 'none', color: '#3B6D11', cursor: 'pointer' }}>
                    Restore
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && !loading && (
          <p style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: 14 }}>No vendors found</p>
        )}
      </div>
    </div>
  )
}
