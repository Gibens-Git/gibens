import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn, signInWithGoogle, signInWithApple, signInWithMicrosoft } from '@gibens/supabase'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await signIn(email, password)
    if (err) { setError(err.message); setLoading(false) }
    else nav('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0F4C8A' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: '#fff' }}>Gibens <span style={{ opacity: 0.7, fontSize: 16, background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 20 }}>Pro</span></h1>
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
          {[
            { label: 'Google', icon: 'brand-google', action: signInWithGoogle },
            { label: 'Apple', icon: 'brand-apple', action: signInWithApple },
            { label: 'Microsoft', icon: 'brand-windows', action: signInWithMicrosoft },
          ].map(p => (
            <button key={p.label} onClick={p.action} type="button" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              border: '0.5px solid #ddd', borderRadius: 10, padding: '11px 14px',
              background: '#fff', fontSize: 14, cursor: 'pointer', color: '#333', fontWeight: 500,
            }}>
              <i className={`ti ti-${p.icon}`} style={{ fontSize: 18 }} />
              Continue with {p.label}
            </button>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' }}>
          New vendor? <Link to="/register" style={{ color: '#0F4C8A', fontWeight: 500 }}>Create account</Link>
        </p>
      </div>
    </div>
  )
}
