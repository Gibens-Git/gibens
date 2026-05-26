import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNearbyVendors } from '@gibens/supabase'
import { CATEGORIES, getAvatarColor, getInitials } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from '../hooks/useLocation'
import type { VendorProfile } from '@gibens/supabase'

export default function Home() {
  const { user } = useAuth()
  const { location } = useLocation()
  const nav = useNavigate()
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [showAllCats, setShowAllCats] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!location) return
    getNearbyVendors(location.lat, location.lon, undefined, 25).then(({ data }) => {
      if (data) setVendors(data as VendorProfile[])
    })
  }, [location])

  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const cats = showAllCats ? CATEGORIES : CATEGORIES.slice(0, 10)
  const filteredCats = search
    ? CATEGORIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : cats

  const locationLabel = location?.address || (location ? 'Your location' : 'Detecting location...')

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', paddingBottom: 16 }}>

      {/* Hero */}
      <div style={{
        background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(232,82,10,0.22) 0%, transparent 70%), #141414',
        paddingBottom: 32,
        borderBottom: '0.5px solid rgba(255,255,255,0.07)',
      }}>
        <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#E8520A', letterSpacing: '-0.3px', textShadow: '0 0 20px rgba(232,82,10,0.4)' }}>Gibens.</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => nav('/messages')} style={{
              background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: 10, width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)', fontSize: 18,
            }}>
              <i className="ti ti-bell" />
            </button>
            <button onClick={() => nav('/profile')} style={{
              background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: 10, width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)', fontSize: 18,
            }}>
              <i className="ti ti-user-circle" />
            </button>
          </div>
        </div>

        <div className="page-wrap" style={{ padding: '4px 20px 0' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            Welcome back, {firstName}
          </p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 20, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
            Find a local pro<br />for any job
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 16px' }}>
            <i className="ti ti-search" style={{ color: '#E8520A', fontSize: 18, flexShrink: 0 }} />
            <input
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#fff', background: 'transparent' }}
            />
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-map-pin" style={{ fontSize: 13, color: '#E8520A' }} />
            {locationLabel} · Within 25 miles
          </p>
        </div>
      </div>

      {/* Categories */}
      <div style={{ background: '#141414', marginTop: 12, paddingTop: 20, paddingBottom: 20, borderTop: '0.5px solid rgba(255,255,255,0.06)', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="page-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
              {search ? `Results for "${search}"` : 'Categories'}
            </span>
            {!search && (
              <button onClick={() => setShowAllCats(v => !v)} style={{
                background: 'none', border: 'none', color: '#E8520A', fontSize: 13, fontWeight: 600,
              }}>
                {showAllCats ? 'Show less' : 'See all'}
              </button>
            )}
          </div>
          <div className="cat-grid">
            {filteredCats.map(cat => (
              <div key={cat.slug} className="cat-tile" onClick={() => nav(`/post-job?category=${cat.slug}`)}>
                <div className="cat-icon">
                  <i className={`ti ti-${cat.icon}`} />
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.3, fontWeight: 500 }}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Post job CTA */}
      <div className="page-wrap" style={{ padding: '16px 20px' }}>
        <button onClick={() => nav('/post-job')} style={{
          width: '100%', background: '#E8520A', color: '#fff', border: 'none',
          borderRadius: 14, padding: '15px 20px', fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 0 30px rgba(232,82,10,0.4)',
        }}>
          <i className="ti ti-plus" /> Post a new job
        </button>
      </div>

      {/* Nearby vendors */}
      {vendors.length > 0 && (
        <div style={{ background: '#141414', paddingTop: 20, paddingBottom: 20, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div className="page-wrap">
            <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 14 }}>
              Available nearby
            </p>
            <div className="vendor-grid">
              {vendors.slice(0, 6).map((v: VendorProfile) => {
                const { bg, tc } = getAvatarColor(v.users?.full_name || '')
                return (
                  <div key={v.user_id} className="vendor-card" onClick={() => nav(`/vendor/${v.user_id}`)}>
                    <div style={{
                      width: 50, height: 50, borderRadius: '50%',
                      background: bg, color: tc,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: 15, flexShrink: 0,
                    }}>
                      {getInitials(v.users?.full_name || '?')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.users?.full_name}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                        {v.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <i className="ti ti-star-filled" style={{ color: '#F5A623', fontSize: 12 }} />
                          <strong style={{ color: '#fff' }}>{v.avg_rating}</strong>
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>({v.total_reviews})</span>
                        </span>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500,
                          background: v.is_available ? 'rgba(39,80,10,0.35)' : 'rgba(255,255,255,0.07)',
                          color: v.is_available ? '#7BC95A' : 'rgba(255,255,255,0.38)',
                          border: `0.5px solid ${v.is_available ? 'rgba(80,160,40,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                          {v.is_available ? 'Available' : 'Busy'}
                        </span>
                      </div>
                    </div>
                    {v.base_rate && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#E8520A', flexShrink: 0, alignSelf: 'flex-start' }}>
                        ${v.base_rate}/hr
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
