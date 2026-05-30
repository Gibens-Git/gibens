import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '@gibens/supabase'

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
    const { data, error: err } = await signUp(form.email, form.password, form.name, 'vendor', { phone: form.phone || null })
    if (err) { setError(err.message); setLoading(false); return }

    if (data.session && data.user) {
      nav('/setup')
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0F4C8A' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <i className="ti ti-mail-check" style={{ fontSize: 48, color: '#0F4C8A', display: 'block', marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.5 }}>
          We sent a confirmation link to <strong>{form.email}</strong>.<br />
          Click it to activate your account, then sign in to complete your profile.
        </p>
        <button onClick={() => nav('/login')} style={{ marginTop: 24, background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15, cursor: 'pointer' }}>
          Go to sign in
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#0F4C8A' }}>
      <div style={{ marginBottom: 28 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 226 56" height="36" fill="none">
          <defs><linearGradient id="lb-pro-reg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6535"/><stop offset="1" stopColor="#D94A06"/>
          </linearGradient></defs>
          <rect width="56" height="56" rx="13" fill="url(#lb-pro-reg)"/>
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
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 15 }}>Join as a service provider</p>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full name', key: 'name', type: 'text', placeholder: 'Ricardo Castillo' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+1 (619) 555-0100' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} required={f.key !== 'phone'} value={(form as Record<string, string>)[f.key]} onChange={set(f.key)}
                style={{ width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15 }} placeholder={f.placeholder} />
            </div>
          ))}
          {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ background: '#0F4C8A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 500, marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create vendor account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' }}>
          Already have an account? <Link to="/login" style={{ color: '#0F4C8A', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
