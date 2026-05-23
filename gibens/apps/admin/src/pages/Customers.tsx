import { useState, useEffect } from 'react'
import { adminGetAllUsers, adminUpdateUserStatus } from '@gibens/supabase'
import { getInitials, getAvatarColor, formatDate } from '@gibens/ui'

interface UserRow {
  id: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  phone: string | null
}

export default function Customers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    adminGetAllUsers().then(({ data }) => {
      const customers = (data || []).filter((u: UserRow) => u.role === 'customer')
      setUsers(customers as UserRow[])
      setLoading(false)
    })
  }, [])

  const toggleActive = async (id: string, current: boolean) => {
    setUpdating(id)
    await adminUpdateUserStatus(id, !current)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !current } : u))
    setUpdating(null)
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || '').includes(search)
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Customers</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{users.length} total registered customers</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{ border: '0.5px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', outline: 'none', width: 220 }} />
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading...</p>}

      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 12, padding: '10px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 500 }}>
          <span>Name</span><span>Phone</span><span>Joined</span><span>Status</span><span>Actions</span>
        </div>
        {filtered.map((u, i) => {
          const { bg, tc } = getAvatarColor(u.full_name)
          return (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 12, flexShrink: 0 }}>
                  {getInitials(u.full_name)}
                </div>
                <span style={{ fontWeight: 500 }}>{u.full_name}</span>
              </div>
              <span style={{ color: '#666' }}>{u.phone || '—'}</span>
              <span style={{ color: '#666' }}>{formatDate(u.created_at)}</span>
              <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, display: 'inline-block', background: u.is_active ? '#EAF3DE' : '#FCEBEB', color: u.is_active ? '#27500A' : '#791F1F' }}>
                {u.is_active ? 'Active' : 'Suspended'}
              </span>
              <button onClick={() => toggleActive(u.id, u.is_active)} disabled={updating === u.id}
                style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '0.5px solid #ddd', background: 'none', cursor: 'pointer', color: u.is_active ? '#E24B4A' : '#3B6D11' }}>
                {updating === u.id ? '...' : u.is_active ? 'Suspend' : 'Restore'}
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !loading && (
          <p style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: 14 }}>No customers found matching "{search}"</p>
        )}
      </div>
    </div>
  )
}
