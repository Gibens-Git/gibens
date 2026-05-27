import { useState, useEffect } from 'react'
import { adminGetVendorCredentials, adminApproveCredentials, adminSaveAIReview, adminUpdateVendorStatus } from '@gibens/supabase'
import { CATEGORIES, formatDate, US_STATES, getLicenseInfo } from '@gibens/ui'

type AIResult = {
  document_type: string
  confidence: 'high' | 'medium' | 'low'
  license_number_match: boolean | null
  expiry_match: boolean | null
  extracted_license_number: string
  extracted_expiry: string
  issuing_authority: string
  appears_legitimate: boolean
  flags: string[]
  recommendation: 'approve' | 'review' | 'reject'
  notes: string
}

type VendorCredential = {
  user_id: string
  category: string
  status: string
  license_state: string | null
  license_number: string | null
  license_expiry: string | null
  license_url: string | null
  insurance_url: string | null
  is_licensed: boolean
  is_insured: boolean
  ai_review_status: string | null
  ai_review_result: { license?: AIResult; insurance?: AIResult } | null
  updated_at: string
  users: { full_name: string; phone: string | null } | null
}

async function fetchAsBase64(url: string): Promise<{ data: string; mediaType: string }> {
  const res = await fetch(url)
  const contentType = res.headers.get('content-type') || ''
  const mediaType = contentType.split(';')[0].trim() ||
    (url.endsWith('.pdf') ? 'application/pdf' :
     url.endsWith('.png') ? 'image/png' : 'image/jpeg')
  const buffer = await res.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return { data: btoa(binary), mediaType }
}

async function runAICheck(
  url: string,
  docType: 'license' | 'insurance',
  vendor: VendorCredential,
  apiKey: string
): Promise<AIResult> {
  const { data, mediaType } = await fetchAsBase64(url)
  const cat = CATEGORIES.find(c => c.slug === vendor.category)?.name || vendor.category
  const stateName = US_STATES.find(s => s.code === vendor.license_state)?.name || vendor.license_state || ''
  const licenseInfo = vendor.license_state && vendor.category
    ? getLicenseInfo(vendor.license_state, vendor.category)
    : null

  const prompt = docType === 'license'
    ? `You are verifying a professional license document for a ${cat} contractor operating in ${stateName} on the Gibens services marketplace.

Expected license number: ${vendor.license_number || 'not provided'}
Expected expiry: ${vendor.license_expiry || 'not provided'}
Expected license type: ${licenseInfo?.licenseType || 'state contractor license'}
Expected issuing authority: ${licenseInfo?.authority || 'state licensing board'}

Analyze this document carefully and respond with ONLY valid JSON (no markdown, no explanation):
{
  "document_type": "license" or "insurance" or "other" or "unreadable",
  "confidence": "high" or "medium" or "low",
  "license_number_match": true or false or null,
  "expiry_match": true or false or null,
  "extracted_license_number": "the license number visible in the document, or empty string",
  "extracted_expiry": "expiry date visible in the document, or empty string",
  "issuing_authority": "name of issuing authority visible in the document, or empty string",
  "appears_legitimate": true or false,
  "flags": ["list any concerns, e.g. 'expired', 'license number mismatch', 'low image quality'"],
  "recommendation": "approve" or "review" or "reject",
  "notes": "brief explanation of your assessment"
}`
    : `You are verifying a Certificate of Insurance (COI) or liability insurance document for a ${cat} contractor in ${stateName} on the Gibens services marketplace.

Analyze this document carefully and respond with ONLY valid JSON (no markdown, no explanation):
{
  "document_type": "insurance" or "license" or "other" or "unreadable",
  "confidence": "high" or "medium" or "low",
  "license_number_match": null,
  "expiry_match": null,
  "extracted_license_number": "",
  "extracted_expiry": "coverage end date visible in the document, or empty string",
  "issuing_authority": "insurance company name, or empty string",
  "appears_legitimate": true or false,
  "flags": ["list any concerns, e.g. 'expired coverage', 'coverage amount too low', 'not a COI'"],
  "recommendation": "approve" or "review" or "reject",
  "notes": "brief explanation including coverage type and amount if visible"
}`

  const contentBlock = mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data } }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: prompt }] }],
    }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || `API error ${res.status}`)
  const text: string = json.content?.[0]?.text ?? '{}'
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as AIResult
}

export default function CredentialReview() {
  const [vendors, setVendors] = useState<VendorCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<Record<string, boolean>>({})
  const [approving, setApproving] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  useEffect(() => {
    adminGetVendorCredentials().then(({ data }) => {
      setVendors((data || []) as VendorCredential[])
      setLoading(false)
    })
  }, [])

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const runCheck = async (vendor: VendorCredential) => {
    if (!apiKey) { alert('VITE_ANTHROPIC_API_KEY not set in admin .env'); return }
    setChecking(c => ({ ...c, [vendor.user_id]: true }))
    try {
      const results: { license?: AIResult; insurance?: AIResult } = {}
      if (vendor.license_url) {
        results.license = await runAICheck(vendor.license_url, 'license', vendor, apiKey)
      }
      if (vendor.insurance_url) {
        results.insurance = await runAICheck(vendor.insurance_url, 'insurance', vendor, apiKey)
      }
      const overallStatus =
        Object.values(results).every(r => r.recommendation === 'approve') ? 'approved'
        : Object.values(results).some(r => r.recommendation === 'reject') ? 'flagged'
        : 'needs_review'

      await adminSaveAIReview(vendor.user_id, overallStatus, results)
      setVendors(prev => prev.map(v =>
        v.user_id === vendor.user_id
          ? { ...v, ai_review_status: overallStatus, ai_review_result: results }
          : v
      ))
      setExpanded(prev => new Set([...prev, vendor.user_id]))
    } catch (err) {
      alert(`AI check failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    setChecking(c => ({ ...c, [vendor.user_id]: false }))
  }

  const approve = async (vendor: VendorCredential, isLicensed: boolean, isInsured: boolean) => {
    setApproving(a => ({ ...a, [vendor.user_id]: true }))
    await adminApproveCredentials(vendor.user_id, isLicensed, isInsured)
    await adminUpdateVendorStatus(vendor.user_id, 'active')
    setVendors(prev => prev.map(v =>
      v.user_id === vendor.user_id ? { ...v, is_licensed: isLicensed, is_insured: isInsured, status: 'active' } : v
    ))
    setApproving(a => ({ ...a, [vendor.user_id]: false }))
  }

  const pendingCount = vendors.filter(v => !v.is_licensed && !v.is_insured).length

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Credential Review</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
          {loading ? 'Loading...' : `${vendors.length} submitted · ${pendingCount} awaiting review`}
        </p>
      </div>

      {!loading && vendors.length === 0 && (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 48, textAlign: 'center', color: '#aaa' }}>
          <i className="ti ti-license" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
          <p>No credentials submitted yet</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {vendors.map(vendor => {
          const cat = CATEGORIES.find(c => c.slug === vendor.category)
          const stateName = US_STATES.find(s => s.code === vendor.license_state)?.name
          const isOpen = expanded.has(vendor.user_id)
          const aiResult = vendor.ai_review_result
          const alreadyVerified = vendor.is_licensed || vendor.is_insured

          return (
            <div key={vendor.user_id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>

              {/* Summary row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr auto', gap: 12, padding: '14px 16px', alignItems: 'center' }}>
                {/* Name + category */}
                <div>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>{vendor.users?.full_name || '—'}</p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {cat?.name || vendor.category} · {stateName || vendor.license_state || 'No state'}
                  </p>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Submitted {formatDate(vendor.updated_at)}</p>
                </div>

                {/* License number */}
                <div>
                  <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.4 }}>License #</p>
                  <p style={{ fontSize: 13, marginTop: 3 }}>{vendor.license_number || '—'}</p>
                  {vendor.license_expiry && (
                    <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      Exp {formatDate(vendor.license_expiry)}
                    </p>
                  )}
                </div>

                {/* Documents */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {vendor.license_url ? (
                    <a href={vendor.license_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#534AB7', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      <i className="ti ti-file-certificate" style={{ fontSize: 14 }} /> View license doc
                    </a>
                  ) : <span style={{ fontSize: 12, color: '#ccc' }}>No license doc</span>}
                  {vendor.insurance_url ? (
                    <a href={vendor.insurance_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#534AB7', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                      <i className="ti ti-file-certificate" style={{ fontSize: 14 }} /> View insurance doc
                    </a>
                  ) : <span style={{ fontSize: 12, color: '#ccc' }}>No insurance doc</span>}
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {alreadyVerified && (
                    <>
                      {vendor.is_licensed && <StatusBadge text="Licensed ✓" color="green" />}
                      {vendor.is_insured && <StatusBadge text="Insured ✓" color="green" />}
                    </>
                  )}
                  {!alreadyVerified && (
                    <StatusBadge text="Pending review" color="amber" />
                  )}
                  {vendor.ai_review_status && (
                    <StatusBadge
                      text={`AI: ${vendor.ai_review_status.replace('_', ' ')}`}
                      color={vendor.ai_review_status === 'approved' ? 'green' : vendor.ai_review_status === 'flagged' ? 'red' : 'blue'}
                    />
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <button
                    onClick={() => runCheck(vendor)}
                    disabled={checking[vendor.user_id] || !vendor.license_url && !vendor.insurance_url}
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#534AB7', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', opacity: checking[vendor.user_id] ? 0.7 : 1 }}>
                    <i className={`ti ti-${checking[vendor.user_id] ? 'loader-2' : 'sparkles'}`} style={{ fontSize: 13 }} />
                    {checking[vendor.user_id] ? 'Checking...' : 'AI Check'}
                  </button>
                  {aiResult && (
                    <button onClick={() => toggleExpand(vendor.user_id)}
                      style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '0.5px solid #ddd', background: 'none', cursor: 'pointer', color: '#666' }}>
                      {isOpen ? 'Hide' : 'Show'} analysis
                    </button>
                  )}
                  {!alreadyVerified && (
                    <button
                      onClick={() => approve(vendor, !!vendor.license_url, !!vendor.insurance_url)}
                      disabled={approving[vendor.user_id]}
                      style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#EAF3DE', color: '#27500A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {approving[vendor.user_id] ? 'Approving...' : 'Approve all'}
                    </button>
                  )}
                </div>
              </div>

              {/* AI analysis panel */}
              {isOpen && aiResult && (
                <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.07)', padding: '14px 16px', background: '#f9f9f8', display: 'flex', gap: 16 }}>
                  {aiResult.license && (
                    <AIPanel title="License analysis" result={aiResult.license} />
                  )}
                  {aiResult.insurance && (
                    <AIPanel title="Insurance analysis" result={aiResult.insurance} />
                  )}
                  {/* Per-document approve buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 'auto', justifyContent: 'flex-start' }}>
                    {aiResult.license && !vendor.is_licensed && (
                      <button
                        onClick={() => approve(vendor, true, vendor.is_insured)}
                        disabled={approving[vendor.user_id]}
                        style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#EAF3DE', color: '#27500A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Approve license
                      </button>
                    )}
                    {aiResult.insurance && !vendor.is_insured && (
                      <button
                        onClick={() => approve(vendor, vendor.is_licensed, true)}
                        disabled={approving[vendor.user_id]}
                        style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#EAF3DE', color: '#27500A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Approve insurance
                      </button>
                    )}
                    <button
                      onClick={() => adminUpdateVendorStatus(vendor.user_id, 'suspended').then(() =>
                        setVendors(prev => prev.map(v => v.user_id === vendor.user_id ? { ...v, status: 'suspended' } : v))
                      )}
                      style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#FCEBEB', color: '#791F1F', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Reject & suspend
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AIPanel({ title, result }: { title: string; result: AIResult }) {
  const recColor = result.recommendation === 'approve' ? '#27500A' : result.recommendation === 'reject' ? '#791F1F' : '#633806'
  const recBg = result.recommendation === 'approve' ? '#EAF3DE' : result.recommendation === 'reject' ? '#FCEBEB' : '#FAEEDA'
  const confColor = result.confidence === 'high' ? '#27500A' : result.confidence === 'low' ? '#791F1F' : '#633806'

  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 500, background: recBg, color: recColor }}>
          {result.recommendation.toUpperCase()}
        </span>
        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#f0f0f0', color: confColor }}>
          {result.confidence} confidence
        </span>
        {result.appears_legitimate
          ? <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#EAF3DE', color: '#27500A' }}>Looks legitimate</span>
          : <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#FCEBEB', color: '#791F1F' }}>Suspicious</span>
        }
      </div>

      <div style={{ fontSize: 12, color: '#555', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {result.extracted_license_number && (
          <p><strong>Extracted #:</strong> {result.extracted_license_number}
            {result.license_number_match === true && <span style={{ color: '#27500A' }}> ✓ matches</span>}
            {result.license_number_match === false && <span style={{ color: '#791F1F' }}> ✗ mismatch</span>}
          </p>
        )}
        {result.extracted_expiry && (
          <p><strong>Expiry:</strong> {result.extracted_expiry}
            {result.expiry_match === true && <span style={{ color: '#27500A' }}> ✓</span>}
            {result.expiry_match === false && <span style={{ color: '#791F1F' }}> ✗ mismatch</span>}
          </p>
        )}
        {result.issuing_authority && <p><strong>Issuer:</strong> {result.issuing_authority}</p>}
      </div>

      {result.flags.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {result.flags.map((f, i) => (
            <p key={i} style={{ fontSize: 11, color: '#9A3412', background: '#FEF3C7', borderRadius: 6, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 11 }} /> {f}
            </p>
          ))}
        </div>
      )}

      {result.notes && (
        <p style={{ fontSize: 12, color: '#666', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>{result.notes}</p>
      )}
    </div>
  )
}

function StatusBadge({ text, color }: { text: string; color: 'green' | 'amber' | 'red' | 'blue' }) {
  const styles: Record<string, { bg: string; tc: string }> = {
    green: { bg: '#EAF3DE', tc: '#27500A' },
    amber: { bg: '#FAEEDA', tc: '#633806' },
    red:   { bg: '#FCEBEB', tc: '#791F1F' },
    blue:  { bg: '#E6F1FB', tc: '#0C447C' },
  }
  const { bg, tc } = styles[color]
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: bg, color: tc, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  )
}
