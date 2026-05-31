import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

export default function Layout() {
  const { user } = useAuth()
  const { unreadMessages, unreadBids, toast, dismissToast } = useNotifications(user?.id)
  const loc = useLocation()
  const nav = useNavigate()

  const tabs = [
    { to: '/',         icon: 'layout-dashboard', label: 'Jobs' },
    { to: '/bids',     icon: 'gavel',             label: 'Bids',     badge: unreadBids },
    { to: '/messages', icon: 'message-circle',    label: 'Messages', badge: unreadMessages },
    { to: '/support',  icon: 'headset',           label: 'Support' },
    { to: '/earnings', icon: 'chart-bar',         label: 'Earnings' },
    { to: '/profile',  icon: 'user',              label: 'Profile' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fff' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 12, left: 12, right: 12, zIndex: 200, background: '#1a1a1a', color: '#fff', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
          <i className="ti ti-message-circle" style={{ fontSize: 18, marginTop: 1, flexShrink: 0, color: '#EF9F27' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{toast.title}</p>
            <p style={{ fontSize: 12, color: '#ccc', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toast.body}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {(toast.data as Record<string, string>)?.job_id && (
              <button onClick={() => {
                const jobId = (toast.data as Record<string, string>).job_id
                nav(toast.type === 'bid_accepted' ? '/bids' : `/chat/${jobId}`)
                dismissToast()
              }}
                style={{ background: '#EF9F27', color: '#412402', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                View
              </button>
            )}
            <button onClick={dismissToast} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 64 }}>
        <Outlet />
      </div>
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', borderTop: '0.5px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        {tabs.map(t => {
          const active = t.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(t.to)
          return (
            <NavLink key={t.to} to={t.to} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 8px', fontSize: 10, color: active ? '#0F4C8A' : '#888', textDecoration: 'none', position: 'relative' }}>
              <i className={`ti ti-${t.icon}`} style={{ fontSize: 22 }} />
              {t.label}
              {t.badge ? <span style={{ position: 'absolute', top: 7, right: 'calc(50% - 18px)', background: '#EF9F27', color: '#412402', fontSize: 9, fontWeight: 500, minWidth: 16, height: 16, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{t.badge}</span> : null}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
