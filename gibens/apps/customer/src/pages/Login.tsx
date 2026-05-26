import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn, signInWithGoogle, signInWithApple, signInWithMicrosoft } from '@gibens/supabase'

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.07)',
  border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: 10, fontSize: 15, color: '#fff', outline: 'none',
}

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0D0D0D' }}>
      <div style={{ position: 'fixed', top: -120, left: '50%', transform: 'translateX(-50%)', width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(232,82,10,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ marginBottom: 36, position: 'relative' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#E8520A', letterSpacing: '-0.5px', textShadow: '0 0 28px rgba(232,82,10,0.45)' }}>Gibens.</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 6, fontSize: 15 }}>Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="you@example.com" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={inp} placeholder="••••••••" />
        </div>
        {error && (
          <p style={{ color: '#FF6B6B', fontSize: 13, padding: '9px 12px', background: 'rgba(255,107,107,0.1)', borderRadius: 8, border: '0.5px solid rgba(255,107,107,0.2)' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} style={{
          background: '#E8520A', color: '#fff', border: 'none', borderRadius: 12,
          padding: 14, fontSize: 15, fontWeight: 600, marginTop: 4,
          boxShadow: loading ? 'none' : '0 0 24px rgba(232,82,10,0.38)',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 10px' }}>
        <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>or continue with</span>
        <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Google', icon: 'brand-google', action: signInWithGoogle },
        ].map(p => (
          <button key={p.label} onClick={p.action} type="button" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '12px 14px',
            fontSize: 14, cursor: 'pointer', color: '#fff', fontWeight: 500,
          }}>
            <i className={`ti ti-${p.icon}`} style={{ fontSize: 18 }} />
            Continue with {p.label}
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
        New to Gibens? <Link to="/register" style={{ color: '#E8520A', fontWeight: 600 }}>Create account</Link>
      </p>
    </div>
  )
}
