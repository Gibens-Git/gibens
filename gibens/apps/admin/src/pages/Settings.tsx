import { useState } from 'react'

export default function Settings() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    platformName: 'Gibens',
    supportEmail: 'support@gibens.com',
    jobExpiry: '48',
    maxPhotos: '5',
    maxRadius: '100',
    minBid: '10',
    requirePhoneVerif: true,
    requireIdForVendors: true,
    autoApproveVendors: false,
    maintenanceMode: false,
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings(s => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', background: '#fafafa' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>{title}</p>
      </div>
      <div>{children}</div>
    </div>
  )

  const TextRow = ({ label, k, type = 'text', suffix = '' }: { label: string; k: string; type?: string; suffix?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
      <label style={{ fontSize: 14 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type={type} value={(settings as Record<string, unknown>)[k] as string} onChange={set(k)}
          style={{ width: 140, padding: '6px 10px', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 13, textAlign: 'right' }} />
        {suffix && <span style={{ fontSize: 13, color: '#888' }}>{suffix}</span>}
      </div>
    </div>
  )

  const ToggleRow = ({ label, desc, k }: { label: string; desc: string; k: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{desc}</p>
      </div>
      <label style={{ cursor: 'pointer', position: 'relative', width: 40, height: 22, display: 'block' }}>
        <input type="checkbox" checked={(settings as Record<string, unknown>)[k] as boolean} onChange={set(k)} style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer', margin: 0 }} />
        <div style={{ width: 40, height: 22, borderRadius: 11, background: (settings as Record<string, unknown>)[k] ? '#534AB7' : '#ddd', transition: 'background 0.15s', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 3, left: (settings as Record<string, unknown>)[k] ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
        </div>
      </label>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Platform settings</h1>
        <button onClick={save}
          style={{ background: saved ? '#3B6D11' : '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}>
          <i className={`ti ti-${saved ? 'check' : 'device-floppy'}`} />
          {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      <Section title="General">
        <TextRow label="Platform name" k="platformName" />
        <TextRow label="Support email" k="supportEmail" type="email" />
      </Section>

      <Section title="Job settings">
        <TextRow label="Job expiry" k="jobExpiry" type="number" suffix="hours" />
        <TextRow label="Max photos per job" k="maxPhotos" type="number" suffix="photos" />
        <TextRow label="Minimum bid amount" k="minBid" type="number" suffix="USD" />
      </Section>

      <Section title="Vendor settings">
        <TextRow label="Max travel radius" k="maxRadius" type="number" suffix="miles" />
        <ToggleRow label="Require phone verification" desc="Vendors must verify a phone number" k="requirePhoneVerif" />
        <ToggleRow label="Require ID verification" desc="Admin reviews vendor ID before they go live" k="requireIdForVendors" />
        <ToggleRow label="Auto-approve vendors" desc="Skip manual review — not recommended" k="autoApproveVendors" />
      </Section>

      <Section title="Platform">
        <ToggleRow label="Maintenance mode" desc="Disables new job posting and bidding platform-wide" k="maintenanceMode" />
      </Section>
    </div>
  )
}
