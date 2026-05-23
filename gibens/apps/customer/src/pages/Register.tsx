import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, supabase } from '@gibens/supabase'

export default function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: err } = await signUp(form.email, form.password, form.name, 'customer')
    if (err) { setError(err.message); setLoading(false); return }
    if (data.session && data.user) {
      // Email confirmation disabled — session is live, insert profile now.
      await supabase.from('users').insert({ id: data.user.id, role: 'customer', full_name: form.name, phone: form.phone || null })
      nav('/')
    } else {
      // Email confirmation required — profile will be created on first login.
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#fff' }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: '#E8520A', marginBottom: 12 }}>Gibens.</h1>
        <p style={{ fontSize: 16, color: '#333', marginBottom: 8 }}>Check your email</p>
        <p style={{ fontSize: 14, color: '#888' }}>
          We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account, then come back to sign in.
        </p>
        <Link to="/login" style={{ color: '#E8520A', fontWeight: 500, marginTop: 24, fontSize: 14 }}>Back to sign in</Link>
      </div>
    )
  }

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} required={key !== 'phone'} value={(form as Record<string,string>)[key]} onChange={set(key)}
        style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }}
        placeholder={placeholder} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#fff' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: '#E8520A' }}>Gibens.</h1>
        <p style={{ color: '#888', marginTop: 4, fontSize: 15 }}>Create your free account</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {field('Full name', 'name', 'text', 'Marcus Rodriguez')}
        {field('Email', 'email', 'email', 'you@example.com')}
        {field('Phone (optional)', 'phone', 'tel', '+1 (619) 555-0100')}
        {field('Password', 'password', 'password', 'At least 8 characters')}
        {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          background: '#E8520A', color: '#fff', border: 'none', borderRadius: 12,
          padding: 14, fontSize: 15, fontWeight: 500, marginTop: 4,
        }}>
          {loading ? 'Creating account...' : 'Create account — it\'s free'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
        Already have an account? <Link to="/login" style={{ color: '#E8520A', fontWeight: 500 }}>Sign in</Link>
      </p>
    </div>
  )
}
