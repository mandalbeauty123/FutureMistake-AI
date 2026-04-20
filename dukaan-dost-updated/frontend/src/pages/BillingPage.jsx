import React, { useState } from 'react'
import { useShop } from '../context/ShopContext.jsx'
import toast from 'react-hot-toast'

const QUICK_PRODUCTS = [
  { name: 'Amul Milk 1L', price: 60 },
  { name: 'Parle-G Biscuit', price: 5 },
  { name: 'Basmati Rice 5kg', price: 320 },
  { name: 'Lal Mirch 200g', price: 55 },
  { name: 'Surf Excel 1kg', price: 100 },
  { name: 'Amul Butter 100g', price: 58 },
]

export default function BillingPage() {
  const [items, setItems] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [search, setSearch] = useState('')
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [customQty, setCustomQty] = useState(1)

  const addItem = (name, price, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.name === name)
      if (existing) return prev.map(i => i.name === name ? { ...i, qty: i.qty + qty } : i)
      return [...prev, { name, price, qty }]
    })
  }

  const removeItem = (name) => setItems(prev => prev.filter(i => i.name !== name))
  const setQty = (name, qty) => {
    if (qty <= 0) return removeItem(name)
    setItems(prev => prev.map(i => i.name === name ? { ...i, qty } : i))
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const gst = Math.round(subtotal * 0.05)
  const total = subtotal + gst

  const printBill = () => {
    if (!items.length) return toast.error('Koi item add karo pehle!')
    const billWindow = window.open('', '_blank')
    const date = new Date().toLocaleString('hi-IN')
    billWindow.document.write(`
      <html><head><title>Bill - Dukaan Dost</title>
      <style>body{font-family:sans-serif;padding:20px;max-width:300px;margin:0 auto} h2{color:#FF6B2B} table{width:100%} td,th{padding:6px 0;font-size:13px} .total{font-size:16px;font-weight:bold} .divider{border:none;border-top:1px dashed #ccc;margin:10px 0}</style></head>
      <body>
      <h2>🏪 ${customerName || 'Bill'}</h2>
      <div style="font-size:12px;color:#666">${date}</div>
      <hr class="divider">
      <table>${items.map(i=>`<tr><td>${i.name}</td><td style="text-align:right">₹${i.price} × ${i.qty} = ₹${i.price*i.qty}</td></tr>`).join('')}</table>
      <hr class="divider">
      <table><tr><td>Subtotal</td><td style="text-align:right">₹${subtotal}</td></tr>
      <tr><td>GST (5%)</td><td style="text-align:right">₹${gst}</td></tr>
      <tr class="total"><td>Total</td><td style="text-align:right">₹${total}</td></tr></table>
      <hr class="divider">
      <div style="text-align:center;font-size:11px;color:#888">Dukaan Dost · Shukriya! 🙏</div>
      <script>window.print()</script></body></html>
    `)
  }

  const clearBill = () => { setItems([]); setCustomerName('') }

  const filteredProducts = QUICK_PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, maxWidth: 1000 }}>
      {/* Left: Product picker */}
      <div>
        <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Billing 🧾</h1>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>Quick bill banao — print karo ya save karo</div>

        <input style={{ marginBottom: 12 }} placeholder="🔍 Product search karo..." value={search} onChange={e => setSearch(e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {filteredProducts.map(p => (
            <button key={p.name} onClick={() => addItem(p.name, p.price)} style={{
              padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10,
              background: 'var(--surface)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
            }} onMouseOver={e => e.currentTarget.style.borderColor='var(--primary)'}
               onMouseOut={e => e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>₹{p.price}</div>
            </button>
          ))}
        </div>

        {/* Custom item */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Custom item add karo</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ flex: 2, minWidth: 120 }} placeholder="Product naam" value={customName} onChange={e => setCustomName(e.target.value)} />
            <input type="number" style={{ flex: 1, minWidth: 70 }} placeholder="₹ Price" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
            <input type="number" style={{ flex: 1, minWidth: 50 }} placeholder="Qty" value={customQty} onChange={e => setCustomQty(e.target.value)} />
            <button className="btn-primary" onClick={() => {
              if (customName && customPrice) { addItem(customName, parseFloat(customPrice), parseInt(customQty)||1); setCustomName(''); setCustomPrice(''); setCustomQty(1) }
            }}>+ Add</button>
          </div>
        </div>
      </div>

      {/* Right: Bill */}
      <div className="card" style={{ padding: 20, height: 'fit-content', position: 'sticky', top: 20 }}>
        <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--primary)', marginBottom: 4 }}>🏪 Bill</div>
        <input placeholder="Customer naam (optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ marginBottom: 14 }} />

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 13 }}>
            Koi item nahi add hua abhi
          </div>
        ) : (
          <>
            {items.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                <button onClick={() => setQty(item.name, item.qty - 1)} style={{ width: 24, height: 24, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface2)', cursor: 'pointer' }}>−</button>
                <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13 }}>{item.qty}</span>
                <button onClick={() => setQty(item.name, item.qty + 1)} style={{ width: 24, height: 24, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface2)', cursor: 'pointer' }}>+</button>
                <div style={{ minWidth: 60, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>₹{item.price * item.qty}</div>
                <button onClick={() => removeItem(item.name)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
              {[['Subtotal', subtotal], ['GST (5%)', gst]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                  <span>{l}</span><span>₹{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Baloo 2, sans-serif', fontWeight: 700, fontSize: 18, marginTop: 6 }}>
                <span>Total</span><span style={{ color: 'var(--primary)' }}>₹{total}</span>
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-primary" onClick={printBill} style={{ flex: 1 }}>🖨️ Print karo</button>
          <button className="btn-outline" onClick={clearBill}>Clear</button>
        </div>
      </div>
    </div>
  )
}
