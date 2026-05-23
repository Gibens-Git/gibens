import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '@gibens/supabase'

const navItems = [
  { to: '/',          icon: 'layout-dashboard', label: 'Dashboard',  exact: true },
  { to: '/customers', icon: 'users',            label: 'Customers' },
  { to: '/vendors',   icon: 'briefcase',        label: 'Vendors' },
  { to: '/jobs',      icon: 'clipboard-list',   label: 'Jobs' },
  { to: '/disputes',  icon: 'alert-triangle',   label: 'Disputes',  badge: '4' },
  { to: '/pricing',   icon: 'currency-dollar',  label: 'Lead pricing' },
  { to: '/categories',icon: 'tag',              label: 'Categories' },
  { to: '/settings',  icon: 'settings',         label: 'Settings' },
]

export default function AdminLayout() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: 210, background: '#1C1C2E', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 14px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#fff' }}>Gibens <span style={{ color: '#7F77DD' }}>Admin</span></p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 }}>admin.gibens.com</p>
        </div>
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
                fontSize: 13, textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(83,74,183,0.3)' : 'transparent',
                position: 'relative' as const,
              })}>
              <i className={`ti ti-${item.icon}`} style={{ fontSize: 16 }} />
              {item.label}
              {item.badge && (
                <span style={{ marginLeft: 'auto', background: '#EF9F27', color: '#412402', fontSize: 10, fontWeight: 500, minWidth: 18, height: 18, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px 14px', borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#fff' }}>GA</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Gibens Admin</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Super admin</p>
          </div>
          <button onClick={async () => { await signOut(); nav('/login') }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>
            <i className="ti ti-logout" />
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: '#fff', flexShrink: 0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users, jobs..."
            style={{ border: '0.5px solid #ddd', borderRadius: 8, padding: '7px 12px', fontSize: 13, background: '#f7f7f5', outline: 'none', width: 220 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#666', fontSize: 16 }}>
              <i className="ti ti-bell" />
            </button>
            <button style={{ background: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#666', fontSize: 16 }}>
              <i className="ti ti-download" />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f7f7f5' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
