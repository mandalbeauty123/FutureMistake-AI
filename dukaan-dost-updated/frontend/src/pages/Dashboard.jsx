import React, { useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { useShop } from '../context/ShopContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const mockWeekData = [
  { day: 'Mon', sales: 2100, profit: 420 },
  { day: 'Tue', sales: 3800, profit: 850 },
  { day: 'Wed', sales: 2900, profit: 610 },
  { day: 'Thu', sales: 3400, profit: 720 },
  { day: 'Fri', sales: 4100, profit: 980 },
  { day: 'Sat', sales: 5200, profit: 1250 },
  { day: 'Sun', sales: 4820, profit: 1140 },
]

const topProducts = [
  { name: 'Amul Milk 1L', units: 24, profit: 240, icon: '🥛' },
  { name: 'Basmati Rice 5kg', units: 9, profit: 315, icon: '🍚' },
  { name: 'Lal Mirch 200g', units: 15, profit: 180, icon: '🌶️' },
  { name: 'Parle-G Biscuit', units: 30, profit: 150, icon: '🍪' },
  { name: 'Amul Butter 100g', units: 11, profit: 88, icon: '🧈' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { fetchDashboard, dashboardStats, alerts, loading } = useShop()

  useEffect(() => { fetchDashboard() }, [])

  const kpis = [
    { label: 'Aaj ki Bikri', value: '₹4,820', delta: '+18%', up: true, highlight: true },
    { label: 'Net Profit', value: '₹1,140', delta: '+23.6% margin', up: true },
    { label: 'Items Biche', value: '87', delta: '+12 kal se', up: true },
    { label: 'Customers', value: '34', delta: '-2 kal se', up: false },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 22, fontWeight: 700 }}>
            Namaste, {user?.ownerName?.split(' ')[0]} ji 🙏
          </h1>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            {user?.shopName} · Aaj ka report — {new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="badge badge-success" style={{ padding: '6px 14px', fontSize: 12 }}>
          ● Live
        </div>
      </div>

      {/* Festival Banner */}
      <div style={{
        background: 'linear-gradient(90deg, #FF6B2B, #FF9500)', borderRadius: 12,
        padding: '12px 18px', color: '#fff', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 28 }}>🪔</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Akshaya Tritiya aane wala hai — 3 din baaki!</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Gold, sweets, pooja samagri ka stock badhao. Hindsight: Last year 340% profit increase on pooja oil.</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{
            padding: '14px 16px',
            background: k.highlight ? 'var(--primary)' : 'var(--surface)',
          }}>
            <div style={{ fontSize: 11, color: k.highlight ? 'rgba(255,255,255,0.7)' : 'var(--muted)', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 24, fontWeight: 700, color: k.highlight ? '#fff' : 'var(--text)' }}>{k.value}</div>
            <div style={{ fontSize: 11, marginTop: 3, color: k.highlight ? 'rgba(255,255,255,0.8)' : k.up ? 'var(--accent)' : 'var(--danger)' }}>
              {k.up ? '↑' : '↓'} {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Weekly sales */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 600, marginBottom: 14 }}>Hafte ki bikri aur profit</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockWeekData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={(v, n) => [`₹${v.toLocaleString('en-IN')}`, n === 'sales' ? 'Bikri' : 'Profit']} />
              <Bar dataKey="sales" fill="#FF6B2B" radius={[4,4,0,0]} opacity={0.85} />
              <Bar dataKey="profit" fill="#00C896" radius={[4,4,0,0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 600, marginBottom: 14 }}>Aaj ke top products</div>
          {topProducts.map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.units} units</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>₹{p.profit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Alerts */}
      <div>
        <div className="section-title">AI Alerts</div>
        {[
          { type: 'warn', icon: '⚠️', text: <><strong>Low stock:</strong> Amul Milk sirf 8 packets bache — aaj reorder karo, kal demand high rahegi.</> },
          { type: 'danger', icon: '📦', text: <><strong>Dead stock:</strong> Maggi Oats Masala 12 din se nahi bika — combo offer lagao ya price ghataao.</> },
          { type: 'success', icon: '💡', text: <><strong>Hindsight:</strong> Last Akshaya Tritiya mein pooja oil ka profit 340% tha — is baar bhi stock karo.</> },
          { type: 'warn', icon: '🌦️', text: <><strong>Weather alert:</strong> Kal barish expected — umbrella aur raincoat stock check karo.</> },
        ].map((a, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 10, marginBottom: 8, fontSize: 13,
            background: a.type === 'warn' ? '#FFFBEB' : a.type === 'danger' ? '#FEF2F2' : '#ECFDF5',
            border: `1px solid ${a.type === 'warn' ? '#FDE68A' : a.type === 'danger' ? '#FECACA' : '#A7F3D0'}`,
            color: a.type === 'warn' ? '#92400E' : a.type === 'danger' ? '#7F1D1D' : '#065F46',
          }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <div style={{ lineHeight: 1.55 }}>{a.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
