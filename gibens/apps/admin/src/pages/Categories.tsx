import { useState, useEffect } from 'react'
import { supabase } from '@gibens/supabase'
import { CATEGORIES } from '@gibens/ui'

interface CategoryRow {
  id: number
  name: string
  slug: string
  icon: string
  is_active: boolean
  sort_order: number
}

export default function Categories() {
  const [cats, setCats] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCats((data as CategoryRow[]) || [])
      setLoading(false)
    })
  }, [])

  const toggle = async (id: number, current: boolean) => {
    setSaving(id)
    await supabase.from('categories').update({ is_active: !current }).eq('id', id)
    setCats(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
    setSaving(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500 }}>Service categories</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{cats.filter(c => c.is_active).length} active of {cats.length} total</p>
        </div>
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading...</p>}

      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 60px 80px', gap: 12, padding: '10px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 500 }}>
          <span>#</span><span>Category</span><span>Slug</span><span>Active</span><span>Toggle</span>
        </div>
        {cats.map((cat, i) => (
          <div key={cat.id} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 60px 80px', gap: 12, padding: '11px 16px', alignItems: 'center', borderBottom: i < cats.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', fontSize: 13 }}>
            <span style={{ color: '#aaa', fontSize: 12 }}>{cat.sort_order}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.is_active ? '#FDF0EA' : '#f0f0f0', color: cat.is_active ? '#E8520A' : '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                <i className={`ti ti-${cat.icon}`} />
              </div>
              <span style={{ fontWeight: 500, color: cat.is_active ? '#333' : '#aaa' }}>{cat.name}</span>
            </div>
            <span style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 12 }}>{cat.slug}</span>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: cat.is_active ? '#EAF3DE' : '#f0f0f0', color: cat.is_active ? '#27500A' : '#888' }}>
              {cat.is_active ? 'On' : 'Off'}
            </span>
            <button onClick={() => toggle(cat.id, cat.is_active)} disabled={saving === cat.id}
              style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '0.5px solid #ddd', background: 'none', cursor: 'pointer', color: cat.is_active ? '#E24B4A' : '#3B6D11' }}>
              {saving === cat.id ? '...' : cat.is_active ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
