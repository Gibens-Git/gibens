import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

export default function Layout() {
  const { user } = useAuth()
  const { unreadCount } = useNotifications(user?.id)
  const loc = useLocation()

  const tabs = [
    { to: '/',         icon: 'home',           label: 'Home'     },
    { to: '/jobs',     icon: 'clipboard-list',  label: 'My Jobs'  },
    { to: '/messages', icon: 'message-circle',  label: 'Messages', badge: unreadCount },
    { to: '/profile',  icon: 'user',            label: 'Profile'  },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1, paddingBottom: 64 }}>
        <Outlet />
      </div>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        borderTop: '0.5px solid rgba(0,0,0,0.1)',
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 100,
      }}>
        <div className="bottom-nav-inner">
          {tabs.map(t => {
            const active = t.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(t.to)
            return (
              <NavLink key={t.to} to={t.to} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 0 8px', fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? '#E8520A' : '#999',
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
