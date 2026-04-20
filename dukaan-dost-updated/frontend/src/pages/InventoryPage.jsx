import React, { useState, useEffect } from 'react'
import { useShop } from '../context/ShopContext.jsx'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = ['All','Dairy','Grains','Spices','Snacks','Beverages','Cleaning','Personal Care','Other']

export default function InventoryPage() {
  const { inventory, fetchDashboard, addInventoryItem, updateInventoryItem, deleteInventoryItem, loading } = useShop()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [stockFilter, setStockFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', category:'Dairy', buyPrice:'', sellPrice:'', stock:'', unit:'units', minStock:10 })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchDashboard() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const margin = (buy, sell) => sell > 0 ? Math.round((sell - buy) / sell * 100) : 0

  const filtered = inventory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || item.category === category
    const matchStock = stockFilter === 'all' || item.stockStatus === stockFilter
    return matchSearch && matchCat && matchStock
  })

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await addInventoryItem({
        name: form.name,
        category: form.category,
        buyPrice: parseFloat(form.buyPrice),
        sellPrice: parseFloat(form.sellPrice),
        stock: parseInt(form.stock),
        unit: form.unit,
        minStock: parseInt(form.minStock),
      })
      toast.success(`${form.name} added! 📦`)
      setForm({ name:'', category:'Dairy', buyPrice:'', sellPrice:'', stock:'', unit:'units', minStock:10 })
      setShowAdd(false)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Add nahi ho saka')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" delete karna chahte ho?`)) return
    try {
      await deleteInventoryItem(id)
      toast.success('Item delete ho gaya')
    } catch {
      toast.error('Delete nahi ho saka')
    }
  }

  const stockBadge = (status) => {
    const map = { critical: { label: 'Critical', cls: 'badge-danger' }, low: { label: 'Low', cls: 'badge-warning' }, high: { label: 'Good', cls: 'badge-success' } }
    const s = map[status] || map.high
    return <span className={`badge ${s.cls}`}>{s.label}</span>
  }

  // Use demo data if no inventory from API yet
  const displayItems = filtered.length === 0 && inventory.length === 0 ? [
    { _id:'1', name:'Amul Milk 1L', category:'Dairy', buyPrice:50, sellPrice:60, stock:8, unit:'packets', stockStatus:'critical' },
    { _id:'2', name:'Basmati Rice 5kg', category:'Grains', buyPrice:280, sellPrice:320, stock:32, unit:'bags', stockStatus:'high' },
    { _id:'3', name:'Parle-G Biscuit', category:'Snacks', buyPrice:4, sellPrice:5, stock:12, unit:'packets', stockStatus:'low' },
    { _id:'4', name:'Lal Mirch 200g', category:'Spices', buyPrice:40, sellPrice:55, stock:22, unit:'packets', stockStatus:'high' },
    { _id:'5', name:'Maggi Oats Masala', category:'Snacks', buyPrice:28, sellPrice:35, stock:18, unit:'packets', stockStatus:'low' },
  ] : filtered

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 22, fontWeight: 700 }}>Inventory</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{displayItems.length} products · AI-monitored stock</div>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Naya item add karo'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 600, marginBottom: 14 }}>Naya product add karo</div>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Product naam *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Amul Milk 1L" required /></div>
              <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.filter(c=>c!=='All').map(c => <option key={c}>{c}</option>)}
                </select></div>
              <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Unit</label>
                <select value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {['units','packets','kg','liters','bottles','boxes','bags'].map(u => <option key={u}>{u}</option>)}
                </select></div>
              <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Kharidi price ₹ *</label>
                <input type="number" value={form.buyPrice} onChange={e => set('buyPrice', e.target.value)} placeholder="0" required /></div>
              <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Bikri price ₹ *</label>
                <input type="number" value={form.sellPrice} onChange={e => set('sellPrice', e.target.value)} placeholder="0" required /></div>
              <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Current stock *</label>
                <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" required /></div>
              <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Min stock alert</label>
                <input type="number" value={form.minStock} onChange={e => set('minStock', e.target.value)} placeholder="10" /></div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {form.buyPrice && form.sellPrice && (
                  <div style={{ padding: '8px 12px', background: 'var(--accent-light)', borderRadius: 8, fontSize: 13, color: '#065F46', fontWeight: 600 }}>
                    Margin: {margin(form.buyPrice, form.sellPrice)}%
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : '+ Add karo'}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input style={{ width: 220 }} placeholder="🔍 Product dhundho..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: 140 }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} style={{ width: 140 }}>
          <option value="all">All stock</option>
          <option value="critical">Critical only</option>
          <option value="low">Low stock</option>
          <option value="high">Good stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Product', 'Category', 'Stock', 'Buy ₹', 'Sell ₹', 'Margin', 'Status', 'AI Sujhav', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--muted)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayItems.map(item => (
              <tr key={item._id} style={{ transition: 'background 0.1s' }}
                onMouseOver={e => e.currentTarget.style.background='var(--surface2)'}
                onMouseOut={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding: '10px 14px', fontWeight: 500, fontSize: 13 }}>{item.name}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted)' }}>{item.category}</td>
                <td style={{ padding: '10px 14px', fontSize: 13 }}>{item.stock} {item.unit}</td>
                <td style={{ padding: '10px 14px', fontSize: 13 }}>₹{item.buyPrice}</td>
                <td style={{ padding: '10px 14px', fontSize: 13 }}>₹{item.sellPrice}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: margin(item.buyPrice, item.sellPrice) > 15 ? 'var(--accent)' : 'var(--warning)' }}>
                  {margin(item.buyPrice, item.sellPrice)}%
                </td>
                <td style={{ padding: '10px 14px' }}>{stockBadge(item.stockStatus)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => navigate('/chat')} style={{
                    padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 11, fontWeight: 500,
                  }}>
                    {item.stockStatus === 'critical' ? 'Reorder karo' : item.stockStatus === 'low' ? 'Watch karo' : 'Theek hai ✓'}
                  </button>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => handleDelete(item._id, item.name)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayItems.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            Koi product nahi mila. Upar se add karo! 📦
          </div>
        )}
      </div>
    </div>
  )
}
