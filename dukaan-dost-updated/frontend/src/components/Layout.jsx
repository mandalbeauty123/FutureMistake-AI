import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { to: '/chat',       icon: '🤖', label: 'Dost AI' },
  { to: '/inventory',  icon: '📦', label: 'Inventory' },
  { to: '/billing',    icon: '🧾', label: 'Billing' },
  { to: '/analytics',  icon: '📈', label: 'Analytics' },
  { to: '/hindsight',  icon: '🧠', label: 'Hindsight' },
]

export default function Layout() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 220,
        background: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🏪</span>
            {!collapsed && (
              <div>
                <div style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 16, fontWeight: 700, color: '#FF6B2B' }}>Dukaan Dost</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>AI Business Partner</div>
              </div>
            )}
          </div>
        </div>

        {/* Shop info */}
        {!collapsed && user && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{user.shopName}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{user.city}, {user.state}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflow: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 9, marginBottom: 2,
              color: isActive ? '#FF6B2B' : 'rgba(255,255,255,0.55)',
              background: isActive ? 'rgba(255,107,43,0.12)' : 'transparent',
              textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
            })}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom collapse button */}
        <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setCollapsed(c => !c)} style={{
            width: '100%', padding: '8px', border: 'none',
            background: 'rgba(255,255,255,0.06)', borderRadius: 8,
            color: 'rgba(255,255,255,0.5)', fontSize: 12,
          }}>
            {collapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  )
}
