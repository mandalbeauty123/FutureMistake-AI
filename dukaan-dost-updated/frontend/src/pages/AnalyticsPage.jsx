import React, { useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const weeklyData = [
  { week: 'Week 1', revenue: 28000, profit: 6400, customers: 210 },
  { week: 'Week 2', revenue: 31000, profit: 7200, customers: 240 },
  { week: 'Week 3', revenue: 26000, profit: 5800, customers: 195 },
  { week: 'Week 4', revenue: 34500, profit: 8100, customers: 265 },
]

const categoryData = [
  { name: 'Dairy', value: 32, color: '#FF6B2B' },
  { name: 'Grains', value: 22, color: '#00C896' },
  { name: 'Snacks', value: 18, color: '#F59E0B' },
  { name: 'Spices', value: 14, color: '#8B5CF6' },
  { name: 'Other', value: 14, color: '#6B7280' },
]

const hourlyData = Array.from({ length: 12 }, (_, i) => ({
  hour: `${8 + i}:00`,
  customers: [2, 5, 8, 12, 7, 15, 18, 14, 10, 8, 5, 3][i],
}))

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month')

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 22, fontWeight: 700 }}>Analytics 📈</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Aapke business ka complete analysis</div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', padding: 4, borderRadius: 10 }}>
          {['week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 14px', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              background: period === p ? 'var(--surface)' : 'transparent',
              fontWeight: period === p ? 600 : 400,
              color: period === p ? 'var(--primary)' : 'var(--muted)',
              boxShadow: period === p ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Revenue', value: '₹1,19,500', delta: '+14%', up: true },
          { label: 'Total Profit', value: '₹27,500', delta: '+18%', up: true },
          { label: 'Total Customers', value: '910', delta: '+8%', up: true },
          { label: 'Avg. Basket Size', value: '₹131', delta: '+5%', up: true },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 22, fontWeight: 700 }}>{k.value}</div>
            <div style={{ fontSize: 11, marginTop: 2, color: k.up ? 'var(--accent)' : 'var(--danger)' }}>
              {k.up ? '↑' : '↓'} {k.delta} pichle mahine se
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue + Profit */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 600, marginBottom: 14 }}>Weekly Revenue vs Profit</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
              <Line type="monotone" dataKey="revenue" stroke="#FF6B2B" strokeWidth={2.5} dot={{ r: 4, fill: '#FF6B2B' }} />
              <Line type="monotone" dataKey="profit" stroke="#00C896" strokeWidth={2.5} dot={{ r: 4, fill: '#00C896' }} />
              <Legend formatter={v => v === 'revenue' ? 'Revenue' : 'Profit'} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 600, marginBottom: 14 }}>Sales by Category</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, _, props) => [`${v}%`, props.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {categoryData.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                <span style={{ color: 'var(--muted)' }}>{c.name} {c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak hours */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 600, marginBottom: 4 }}>Peak Hours Analysis</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>Customers sabse zyada kab aate hain — staff planning ke liye</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hourlyData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="customers" fill="#FF6B2B" radius={[4,4,0,0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, padding: 10, background: 'var(--primary-light)', borderRadius: 8, fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>
          💡 Insight: Customers sabse zyada 13:00-14:00 aate hain (lunch time). Is time extra staff rakho ya fast-billing mode on karo.
        </div>
      </div>
    </div>
  )
}
