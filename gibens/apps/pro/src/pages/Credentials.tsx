import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVendorProfile, updateVendorCredentials, uploadVendorDoc } from '@gibens/supabase'
import { CATEGORIES } from '@gibens/ui'
import { useAuth } from '../hooks/useAuth'
import {
  US_STATES,
  LICENSED_CATEGORIES,
  INSURED_CATEGORIES,
  getLicenseInfo,
} from '../data/credentialRequirements'

export default function Credentials() {
  const nav = useNavigate()
  const { user } = useAuth()

  const [category, setCategory] = useState('')
  const [state, setState] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null)
  const [existingLicenseUrl, setExistingLicenseUrl] = useState<string | null>(null)
  const [existingInsuranceUrl, setExistingInsuranceUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isUpdate, setIsUpdate] = useState(false)

  useEffect(() => {
    if (!user) return
    getVendorProfile(user.id).then(({ data }) => {
      if (!data) return
      const d = data as Record<string, unknown>
      setCategory((d.category as string) || '')
      if (d.license_state) { setState(d.license_state as string); setIsUpdate(true) }
      if (d.license_number) setLicenseNumber(d.license_number as string)
      if (d.license_expiry) setLicenseExpiry((d.license_expiry as string).slice(0, 10))
      if (d.license_url) setExistingLicenseUrl(d.license_url as string)
      if (d.insurance_url) setExistingInsuranceUrl(d.insurance_url as string)
    })
  }, [user])

  const needsLicense = LICENSED_CATEGORIES.has(category)
  const needsInsurance = INSURED_CATEGORIES.has(category)
  const licenseInfo = state && category ? getLicenseInfo(state, category) : null
  const catName = CATEGORIES.find(c => c.slug === category)?.name || 'your trade'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !state) { setError('Please select your operating state.'); return }
    if (needsLicense && !licenseNumber && !existingLicenseUrl) {
      setError('Please enter your license number.')
      return
    }
    if (needsLicense && !licenseFile && !existingLicenseUrl) {
      setError('Please upload your license document.')
      return
    }
    if (needsInsurance && !insuranceFile && !existingInsuranceUrl) {
      setError('Please upload your insurance certificate.')
      return
    }

    setSaving(true)
    setError('')
    try {
      let licenseUrl = existingLicenseUrl
      let insuranceUrl = existingInsuranceUrl

      if (licenseFile) licenseUrl = await uploadVendorDoc(licenseFile, user.id, 'license')
      if (insuranceFile) insuranceUrl = await uploadVendorDoc(insuranceFile, user.id, 'insurance')

      await updateVendorCredentials(user.id, {
        license_state: state,
        license_number: licenseNumber || undefined,
        license_expiry: licenseExpiry || undefined,
        license_url: licenseUrl || undefined,
        insurance_url: insuranceUrl || undefined,
        credentials_submitted: true,
        status: 'active',
      })

      nav('/')
    } catch (err) {
      setError('Upload failed — please try again.')
      console.error(err)
    }
    setSaving(false)
  }

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#0F4C8A', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        {isUpdate && (
          <button onClick={() => nav(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
          </button>
        )}
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 226 56" height="28" fill="none">
            <defs><linearGradient id="lb-cred" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6535"/><stop offset="1" stopColor="#D94A06"/>
            </linearGradient></defs>
            <rect width="56" height="56" rx="13" fill="url(#lb-cred)"/>
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
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
            {isUpdate ? 'Update your credentials' : 'Step 2 of 2 — Credentials'}
          </p>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 20px 40px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>
            {isUpdate ? 'Your credentials' : 'Add your credentials'}
          </h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.5 }}>
            {isUpdate
              ? 'Keep your license and insurance documents up to date.'
              : 'You need to submit credentials before you can receive job leads.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* State */}
            <div>
              <label style={labelStyle}>Operating state <span style={{ color: '#E24B4A' }}>*</span></label>
              <select required value={state} onChange={e => setState(e.target.value)} style={inputStyle}>
                <option value="">Select your state...</option>
                {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>

            {/* License info callout */}
            {state && licenseInfo && (
              <div style={{ background: '#EAF3DE', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <i className="ti ti-shield-check" style={{ color: '#3B6D11', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#2A5508' }}>{licenseInfo.licenseType}</p>
                  <p style={{ fontSize: 12, color: '#3B6D11', marginTop: 2 }}>Issued by: {licenseInfo.authority}</p>
                  {licenseInfo.note && <p style={{ fontSize: 11, color: '#5A7A3A', marginTop: 4, lineHeight: 1.5 }}>{licenseInfo.note}</p>}
                </div>
              </div>
            )}

            {state && needsLicense && !licenseInfo && (
              <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <i className="ti ti-info-circle" style={{ color: '#D97706', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                  {catName} work in your state may still require a local permit or city/county license. Check with your local jurisdiction.
                </p>
              </div>
            )}

            {/* License fields */}
            {needsLicense && (
              <>
                <div>
                  <label style={labelStyle}>License number <span style={{ color: '#E24B4A' }}>*</span></label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    placeholder="e.g. C10-123456"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>License expiry date</label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={e => setLicenseExpiry(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <FileUploadField
                  label="License document"
                  required
                  existingUrl={existingLicenseUrl}
                  existingLabel="License on file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  hint="PDF or image of your current license"
                  onChange={setLicenseFile}
                />
              </>
            )}

            {/* Insurance */}
            {needsInsurance && (
              <FileUploadField
                label="Liability insurance certificate"
                required
                existingUrl={existingInsuranceUrl}
                existingLabel="Insurance on file"
                accept=".pdf,.jpg,.jpeg,.png"
                hint="Certificate of insurance (COI) showing current coverage"
                onChange={setInsuranceFile}
              />
            )}

            {/* No docs required */}
            {state && !needsLicense && !needsInsurance && (
              <div style={{ background: '#F0F4FF', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <i className="ti ti-circle-check" style={{ color: '#0F4C8A', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#0F4C8A', lineHeight: 1.5 }}>
                  No state license required for {catName} in your state. You're all set — just confirm your operating state and submit.
                </p>
              </div>
            )}

            {error && <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>}

            <button
              type="submit"
              disabled={saving || !state}
              style={{ background: state ? '#0F4C8A' : '#ccc', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 500, cursor: state ? 'pointer' : 'default', marginTop: 4 }}
            >
              {saving ? 'Submitting...' : isUpdate ? 'Save credentials' : 'Submit & start receiving jobs'}
            </button>

            {!isUpdate && (
              <button
                type="button"
                onClick={() => nav('/')}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', padding: 0, textAlign: 'center' }}
              >
                I'll complete this later
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

function FileUploadField({ label, required, existingUrl, existingLabel, accept, hint, onChange }: {
  label: string
  required?: boolean
  existingUrl: string | null
  existingLabel: string
  accept: string
  hint: string
  onChange: (file: File | null) => void
}) {
  const [file, setFile] = useState<File | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    onChange(f)
  }

  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#E24B4A' }}>*</span>}
      </label>
      {existingUrl && !file && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EAF3DE', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
          <i className="ti ti-file-check" style={{ color: '#3B6D11', fontSize: 16 }} />
          <span style={{ fontSize: 13, color: '#3B6D11', flex: 1 }}>{existingLabel}</span>
          <a href={existingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#3B6D11', textDecoration: 'underline' }}>View</a>
        </div>
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '0.5px dashed #ccc', borderRadius: 10, cursor: 'pointer', background: '#fafafa' }}>
        <i className="ti ti-upload" style={{ color: '#0F4C8A', fontSize: 18 }} />
        <div>
          <p style={{ fontSize: 13, color: '#333' }}>{file ? file.name : existingUrl ? 'Replace document' : 'Choose file'}</p>
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{hint}</p>
        </div>
        <input type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} />
      </label>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 500 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '0.5px solid #ccc', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#fff' }
