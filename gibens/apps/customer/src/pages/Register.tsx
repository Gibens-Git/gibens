import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, supabase } from '@gibens/supabase'

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.07)',
  border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: 10, fontSize: 15, color: '#fff', outline: 'none',
}

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
      await supabase.from('users').insert({ id: data.user.id, role: 'customer', full_name: form.name, phone: form.phone || null })
      nav('/')
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0D0D0D' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#E8520A', marginBottom: 16, textShadow: '0 0 28px rgba(232,82,10,0.45)' }}>Gibens.</h1>
        <p style={{ fontSize: 16, color: '#fff', marginBottom: 8, fontWeight: 500 }}>Check your email</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          We sent a confirmation link to <strong style={{ color: '#fff' }}>{form.email}</strong>.<br />
          Click it to activate your account, then come back to sign in.
        </p>
        <Link to="/login" style={{ color: '#E8520A', fontWeight: 600, marginTop: 28, fontSize: 14 }}>Back to sign in</Link>
      </div>
    )
  }

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</label>
      <input type={type} required={key !== 'phone'} value={(form as Record<string,string>)[key]} onChange={set(key)}
        style={inp} placeholder={placeholder} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0D0D0D' }}>
      <div style={{ position: 'fixed', top: -120, left: '50%', transform: 'translateX(-50%)', width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(232,82,10,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ marginBottom: 32, position: 'relative' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#E8520A', letterSpacing: '-0.5px', textShadow: '0 0 28px rgba(232,82,10,0.45)' }}>Gibens.</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 6, fontSize: 15 }}>Create your free account</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {field('Full name', 'name', 'text', 'Marcus Rodriguez')}
        {field('Email', 'email', 'email', 'you@example.com')}
        {field('Phone (optional)', 'phone', 'tel', '+1 (619) 555-0100')}
        {field('Password', 'password', 'password', 'At least 8 characters')}
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
          {loading ? 'Creating account...' : "Create account — it's free"}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
        Already have an account? <Link to="/login" style={{ color: '#E8520A', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  )
}
