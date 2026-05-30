import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn, signInWithGoogle, supabase } from '@gibens/supabase'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: err } = await signIn(email, password)
    if (err) { setError(err.message); setLoading(false); return }

    const user = data.user
    if (user) {
      const { data: profile } = await supabase.from('vendor_profiles').select('user_id').eq('user_id', user.id).maybeSingle()
      if (!profile) { nav('/setup'); return }
    }

    nav('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0F4C8A' }}>
      <div style={{ marginBottom: 32 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 226 56" height="36" fill="none">
          <defs><linearGradient id="lb-pro-login" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6535"/><stop offset="1" stopColor="#D94A06"/>
          </linearGradient></defs>
          <rect width="56" height="56" rx="13" fill="url(#lb-pro-login)"/>
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
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 15 }}>Sign in to your vendor account</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }} />
          </div>
          {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 500, marginTop: 4 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 4px' }}>
          <div style={{ flex: 1, height: 1, background: '#eee' }} />
          <span style={{ fontSize: 12, color: '#bbb' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#eee' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={signInWithGoogle} type="button" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            border: '0.5px solid #ddd', borderRadius: 10, padding: '11px 14px',
            background: '#fff', fontSize: 14, cursor: 'pointer', color: '#333', fontWeight: 500,
          }}>
            <i className="ti ti-brand-google" style={{ fontSize: 18 }} />
            Continue with Google
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' }}>
          New vendor? <Link to="/register" style={{ color: '#0F4C8A', fontWeight: 500 }}>Create account</Link>
        </p>
      </div>
    </div>
  )
}
