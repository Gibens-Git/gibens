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
    <div style={{ background: '#f4f4f2', minHeight: '100vh', paddingBottom: 16 }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #E8520A 0%, #d44000 100%)', paddingBottom: 32 }}>
        {/* Top bar */}
        <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <span style={{ fontSize: 24, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' }}>Gibens.</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => nav('/messages')} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
              width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 18,
            }}>
              <i className="ti ti-bell" />
            </button>
            <button onClick={() => nav('/profile')} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
              width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 18,
            }}>
              <i className="ti ti-user-circle" />
            </button>
          </div>
        </div>

        {/* Greeting + search */}
        <div className="page-wrap" style={{ padding: '4px 20px 0' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            Welcome back, {firstName}
          </p>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 18, lineHeight: 1.2 }}>
            Find a local pro<br />for any job
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <i className="ti ti-search" style={{ color: '#E8520A', fontSize: 18, flexShrink: 0 }} />
            <input
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#333', background: 'transparent' }}
            />
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-map-pin" style={{ fontSize: 13 }} />
            {locationLabel} · Within 25 miles
          </p>
        </div>
      </div>

      {/* Categories */}
      <div style={{ background: '#fff', marginTop: 12, paddingTop: 20, paddingBottom: 20 }}>
        <div className="page-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1410' }}>
              {search ? `Results for "${search}"` : 'Categories'}
            </span>
            {!search && (
              <button onClick={() => setShowAllCats(v => !v)} style={{
                background: 'none', border: 'none', color: '#E8520A', fontSize: 13, fontWeight: 500,
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
                <span style={{ fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.3, fontWeight: 500 }}>
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
          boxShadow: '0 4px 14px rgba(232,82,10,0.35)',
        }}>
          <i className="ti ti-plus" /> Post a new job
        </button>
      </div>

      {/* Nearby vendors */}
      {vendors.length > 0 && (
        <div style={{ background: '#fff', paddingTop: 20, paddingBottom: 20 }}>
          <div className="page-wrap">
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1A1410', marginBottom: 14 }}>
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
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#1A1410', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.users?.full_name}
                      </p>
                      <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {v.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <i className="ti ti-star-filled" style={{ color: '#F5A623', fontSize: 12 }} />
                          <strong>{v.avg_rating}</strong>
                          <span style={{ color: '#aaa' }}>({v.total_reviews})</span>
                        </span>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500,
                          background: v.is_available ? '#EAF3DE' : '#f0f0f0',
                          color: v.is_available ? '#3B6D11' : '#888',
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
