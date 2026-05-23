import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1C1C2E', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>Gibens <span style={{ color: '#534AB7' }}>Admin</span></h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Sign in to the admin panel</p>
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
            style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 500, marginTop: 4 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
