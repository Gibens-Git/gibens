import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

export default function Layout() {
  const { user } = useAuth()
  const { unreadCount, toast, dismissToast } = useNotifications(user?.id)
  const loc = useLocation()
  const nav = useNavigate()

  const tabs = [
    { to: '/',         icon: 'home',           label: 'Home'     },
    { to: '/jobs',     icon: 'clipboard-list',  label: 'My Jobs'  },
    { to: '/messages', icon: 'message-circle',  label: 'Messages', badge: unreadCount },
    { to: '/support',  icon: 'headset',         label: 'Support'  },
    { to: '/profile',  icon: 'user',            label: 'Profile'  },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0D0D0D' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 12, left: 12, right: 12, zIndex: 200, background: '#1a1a1a', border: '0.5px solid rgba(232,82,10,0.4)', color: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, boxShadow: '0 4px 24px rgba(232,82,10,0.2)' }}>
          <i className="ti ti-message-circle" style={{ fontSize: 18, marginTop: 1, flexShrink: 0, color: '#E8520A' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{toast.title}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toast.body}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {(toast.data as Record<string, string>)?.job_id && (
              <button onClick={() => { nav(`/chat/${(toast.data as Record<string, string>).job_id}`); dismissToast() }}
                style={{ background: '#E8520A', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                View
              </button>
            )}
            <button onClick={dismissToast} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}
      <div style={{ flex: 1, paddingBottom: 64 }}>
        <Outlet />
      </div>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        borderTop: '0.5px solid rgba(255,255,255,0.07)',
        background: 'rgba(13,13,13,0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 100,
      }}>
        <div className="bottom-nav-inner">
          {tabs.map(t => {
            const active = t.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(t.to)
            return (
              <NavLink key={t.to} to={t.to} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 0 8px', fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? '#E8520A' : 'rgba(255,255,255,0.38)',
                textDecoration: 'none', position: 'relative', gap: 3,
              }}>
                <i className={`ti ti-${t.icon}`} style={{ fontSize: 22 }} />
                {t.label}
                {t.badge ? (
                  <span style={{
                    position: 'absolute', top: 7, right: 'calc(50% - 20px)',
                    background: '#E8520A', color: '#fff', fontSize: 9, fontWeight: 600,
                    minWidth: 16, height: 16, borderRadius: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    boxShadow: '0 0 8px rgba(232,82,10,0.6)',
                  }}>{t.badge}</span>
                ) : null}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
