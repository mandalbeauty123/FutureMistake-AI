import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ mobile: '', password: '', shopName: '', ownerName: '', city: '' })
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.mobile, form.password)
        toast.success('Welcome back! 🙏')
      } else {
        await register(form)
        toast.success('Shop registered! 🏪')
      }
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kuch galat hua, phir try karo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏪</div>
          <div style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 28, fontWeight: 800, color: '#FF6B2B' }}>Dukaan Dost</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Har Dukaan ka AI Business Partner</div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface2)', padding: 4, borderRadius: 10 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
                background: mode === m ? '#fff' : 'transparent',
                fontWeight: mode === m ? 600 : 400, fontSize: 14,
                color: mode === m ? 'var(--primary)' : 'var(--muted)',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
                {m === 'login' ? 'Login karo' : 'Register karo'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Dukaan ka naam</label>
                  <input type="text" placeholder="e.g. Sharma General Store" value={form.shopName} onChange={e => set('shopName', e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Aapka naam</label>
                  <input type="text" placeholder="Owner name" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Sheher (City)</label>
                  <input type="text" placeholder="e.g. Patna, Bihar" value={form.city} onChange={e => set('city', e.target.value)} required />
                </div>
              </>
            )}
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Mobile number</label>
              <input type="text" placeholder="10-digit mobile" value={form.mobile} onChange={e => set('mobile', e.target.value)} required maxLength={10} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Ek second...</> : mode === 'login' ? '→ Login karo' : '→ Shop register karo'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          Gemini AI · Hindsight Memory · GWA Insights
        </div>
      </div>
    </div>
  )
}
