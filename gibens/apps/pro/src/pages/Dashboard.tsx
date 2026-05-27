import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVendorFeed, getVendorBids, updateVendorAvailability, supabase } from '@gibens/supabase'
import { formatRelative, getBookingFee, formatCurrency, CATEGORIES } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import type { Job } from '@gibens/supabase'

export default function Dashboard() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [available, setAvailable] = useState(true)
  const [earnings, setEarnings] = useState({ week: 0, rating: 0, newJobs: 0 })

  const [profileMissing, setProfileMissing] = useState(false)
  const [credentialsMissing, setCredentialsMissing] = useState(false)
  const [bidJobIds, setBidJobIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return

    // Load vendor profile — then load feed filtered to their category
    supabase.from('vendor_profiles').select('is_available, avg_rating, category, status, credentials_submitted').eq('user_id', user.id).single()
      .then(async ({ data, error }) => {
        if (data) {
          setAvailable(data.is_available)
          if (!data.credentials_submitted) setCredentialsMissing(true)
          getVendorFeed(data.category ?? undefined).then(({ data: feedData, error: feedErr }) => {
            if (feedErr) console.error('[Dashboard] feed error:', feedErr)
            setJobs(feedData || [])
            setEarnings(e => ({ ...e, newJobs: feedData?.length || 0 }))
          })
        } else if (error?.code === 'PGRST116' || !data) {
          setProfileMissing(true)
          getVendorFeed().then(({ data: feedData }) => {
            setJobs(feedData || [])
          })
        }
      })

    // Load jobs the vendor has already bid on
    getVendorBids(user.id).then(({ data }) => {
      if (data) setBidJobIds(new Set(data.map(b => b.job_id)))
    })

    // Load earnings
    supabase.from('bids')
      .select('amount')
      .eq('vendor_id', user.id)
      .eq('status', 'accepted')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .then(({ data }) => {
        const total = data?.reduce((s, b) => s + b.amount, 0) || 0
        setEarnings(e => ({ ...e, week: total }))
      })

    supabase.from('vendor_profiles').select('avg_rating').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setEarnings(e => ({ ...e, rating: data.avg_rating })) })
  }, [user])

  const toggleAvail = async () => {
    if (!user) return
    const next = !available
    setAvailable(next)
    await updateVendorAvailability(user.id, next)
  }

  const [filter, setFilter] = useState('all')
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set())
  const filters = ['all', 'urgent', 'no bids', 'highest pay', 'closest']

  const pass = (id: string) => setPassedIds(prev => new Set([...prev, id]))

  const filteredJobs = jobs.filter(j => !passedIds.has(j.id)).filter(j => {
    if (filter === 'urgent') return j.urgency === 'asap' || j.urgency === 'today'
    if (filter === 'no bids') return j.bid_count === 0
    return true
  }).sort((a, b) => {
    if (filter === 'highest pay') return (b.budget || 0) - (a.budget || 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#0F4C8A', padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 226 56" height="28" fill="none">
              <defs><linearGradient id="lb-dash" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF6535"/><stop offset="1" stopColor="#D94A06"/>
              </linearGradient></defs>
              <rect width="56" height="56" rx="13" fill="url(#lb-dash)"/>
              <path transform="translate(28,28)" d="M11.3,-11.3 A16,16 0 1,0 16,0 L4,0"
                fill="none" stroke="white" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round"/>
              <text x="70" y="28" dominantBaseline="middle"
                fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
                fontSize="28" fontWeight="800" letterSpacing="-1">
                <tspan fill="#E8520A">g</tspan><tspan fill="#ffffff">ibens</tspan>
              </text>
              <rect x="172" y="16" width="46" height="24" rx="12" fill="rgba(255,255,255,0.2)"/>
              <text x="195" y="28" dominantBaseline="middle" textAnchor="middle"
                fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
                fontSize="13" fontWeight="600" fill="rgba(255,255,255,0.9)">Pro</text>
            </svg>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Good morning, {user?.full_name?.split(' ')[0]}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{available ? 'Available' : 'Off duty'}</span>
            <button onClick={toggleAvail} style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: available ? '#5DCAA5' : 'rgba(255,255,255,0.25)', position: 'relative', transition: 'background 0.2s',
            }}>
              <span style={{ position: 'absolute', top: 3, left: available ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingBottom: 20 }}>
          {[
            { val: `$${earnings.week.toLocaleString()}`, label: 'This week' },
            { val: earnings.rating || '—', label: 'Rating' },
            { val: earnings.newJobs, label: 'New jobs' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 500, color: '#fff' }}>{s.val}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Credentials missing banner */}
      {credentialsMissing && (
        <div style={{ margin: '14px 20px 0', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <i className="ti ti-license" style={{ color: '#D97706', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#92400E' }}>Credentials required</p>
            <p style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>Submit your license and insurance to start receiving job leads.</p>
            <button onClick={() => nav('/credentials')} style={{ marginTop: 8, background: '#D97706', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
              Add credentials
            </button>
          </div>
        </div>
      )}

      {/* Profile missing banner */}
      {profileMissing && (
        <div style={{ margin: '14px 20px 0', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <i className="ti ti-alert-triangle" style={{ color: '#D97706', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#92400E' }}>Vendor profile not found</p>
            <p style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>Your vendor profile is missing. Go to Profile to complete setup — you won't see jobs until it's created.</p>
            <button onClick={() => nav('/profile')} style={{ marginTop: 8, background: '#D97706', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
              Set up profile
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontWeight: 500, fontSize: 15 }}>New jobs near you</p>
          <p style={{ fontSize: 12, color: '#888' }}>Matching your category</p>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
              background: filter === f ? '#0F4C8A' : 'none',
              color: filter === f ? '#fff' : '#888',
              border: filter === f ? 'none' : '0.5px solid #ccc',
            }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Job feed */}
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredJobs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
            <i className="ti ti-briefcase" style={{ fontSize: 40, display: 'block', marginBottom: 10 }} />
            <p>No new jobs matching your criteria</p>
            {!available && <p style={{ fontSize: 13, marginTop: 4 }}>Turn on availability to see new jobs</p>}
          </div>
        )}
        {filteredJobs.map(job => {
          const { fee } = getBookingFee(job.budget || 150)
          const cat = CATEGORIES.find(c => c.slug === job.category)
          return (
            <div key={job.id} style={{ background: '#fff', border: job.bid_count === 0 ? '0.5px solid #EF9F27' : '0.5px solid rgba(0,0,0,0.1)', borderLeft: job.urgency === 'asap' ? '3px solid #E24B4A' : undefined, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <p style={{ fontWeight: 500, fontSize: 14, flex: 1, marginRight: 10 }}>{job.title}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#0F4C8A', flexShrink: 0 }}>{job.budget ? formatCurrency(job.budget) : 'Open'}</p>
              </div>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>{job.description.slice(0, 120)}...</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <i className="ti ti-clock" /> {formatRelative(job.created_at)}
                </span>
                {job.urgency === 'asap' && <span style={{ fontSize: 10, background: '#FCEBEB', color: '#791F1F', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Urgent</span>}
                {job.bid_count === 0 && <span style={{ fontSize: 10, background: '#E6F1FB', color: '#0C447C', padding: '2px 8px', borderRadius: 20 }}>No bids yet</span>}
                {job.bid_count > 0 && <span style={{ fontSize: 10, background: '#f0f0f0', color: '#888', padding: '2px 8px', borderRadius: 20 }}>{job.bid_count} bid{job.bid_count > 1 ? 's' : ''}</span>}
              </div>
              <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.07)', paddingTop: 10, display: 'flex', gap: 8 }}>
                <button onClick={() => nav(`/bid/${job.id}`)}
                  style={{ flex: 2, background: bidJobIds.has(job.id) ? '#2E7D4F' : '#0F4C8A', color: '#fff', border: 'none', borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {bidJobIds.has(job.id) ? 'Update bid' : 'Place a bid'}
                </button>
                <button onClick={() => nav(`/bid/${job.id}`)}
                  style={{ flex: 1, background: 'none', border: '0.5px solid #ccc', borderRadius: 8, padding: 9, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <i className="ti ti-eye" /> Details
                </button>
                <button onClick={() => pass(job.id)} style={{ background: 'none', border: '0.5px solid #ccc', borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: 'pointer', color: '#888' }}>Pass</button>
              </div>
              <p style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
                <i className="ti ti-receipt" /> Lead fee: <strong>${fee}</strong> charged when customer accepts
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
