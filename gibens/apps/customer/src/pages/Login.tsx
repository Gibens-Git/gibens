import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn } from '@gibens/supabase'

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#fff' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: '#E8520A' }}>Gibens.</h1>
        <p style={{ color: '#888', marginTop: 4, fontSize: 15 }}>Sign in to your account</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }}
            placeholder="you@example.com" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }}
            placeholder="••••••••" />
        </div>
        {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          background: '#E8520A', color: '#fff', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 15, fontWeight: 500, marginTop: 4,
        }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
        New to Gibens? <Link to="/register" style={{ color: '#E8520A', fontWeight: 500 }}>Create account</Link>
      </p>
    </div>
  )
}
