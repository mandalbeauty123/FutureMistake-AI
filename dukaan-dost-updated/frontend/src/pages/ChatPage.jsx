// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║              DOST AI — FULLSTACK SINGLE FILE                               ║
// ║  ┌─────────────────────────────────────────────────────────────────────┐   ║
// ║  │  SECTION 1 → BACKEND  (Node.js + Express)  — lines ~10–120         │   ║
// ║  │  Save as server.js and run: node server.js                          │   ║
// ║  └─────────────────────────────────────────────────────────────────────┘   ║
// ║  ┌─────────────────────────────────────────────────────────────────────┐   ║
// ║  │  SECTION 2 → FRONTEND (React JSX)          — lines ~125 onwards    │   ║
// ║  │  Save as ChatPage.jsx inside your React app                         │   ║
// ║  └─────────────────────────────────────────────────────────────────────┘   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 1 — BACKEND  (server.js)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
//  Install deps:  npm install express cors dotenv @anthropic-ai/sdk
//  Create .env:   ANTHROPIC_API_KEY=sk-ant-xxxx
//  Run:           node server.js
//
// ─────────────────────────────────────────────────────────────────────────────
/*
─── server.js ───────────────────────────────────────────────────────────────────

require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const Anthropic  = require('@anthropic-ai/sdk')

const app    = express()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const PORT   = process.env.PORT || 4000

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }))
app.use(express.json())

// ── In-memory hindsight store (swap for DB in production) ────────────────────
const memoryStore = {}   // keyed by userId / shopName

function getMemories(shopName) {
  return memoryStore[shopName] || []
}

function saveMemory(shopName, entry) {
  if (!memoryStore[shopName]) memoryStore[shopName] = []
  const mem = { id: Date.now(), ts: new Date().toISOString(), ...entry }
  memoryStore[shopName] = [...memoryStore[shopName], mem].slice(-50)
  return mem
}

function buildMemoryContext(shopName, limit = 8) {
  const mems = getMemories(shopName).slice(-limit)
  if (!mems.length) return ''
  return '\n\n[Hindsight Memories — past context]:\n' +
    mems.map(m => `• [${new Date(m.ts).toLocaleDateString('en-IN')}] ${m.summary}`).join('\n')
}

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
  const { message, history = [], shopContext = {} } = req.body
  const { shopName = 'Dukaan', ownerName = 'Owner', city = 'India' } = shopContext

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' })
  }

  // Build system prompt with hindsight memories
  const memCtx = buildMemoryContext(shopName)
  const systemPrompt = [
    `Tum Dost AI ho — ek friendly, smart business advisor for small Indian shop owners.`,
    `Shop: "${shopName}" | Owner: ${ownerName} | City: ${city}`,
    `Hindi aur English dono mein baat karo (Hinglish theek hai). Short, practical advice do.`,
    `Bold text ke liye **text** use karo. Friendly aur helpful raho.`,
    memCtx ? `\nPast context (memories):${memCtx}` : '',
  ].filter(Boolean).join('\n')

  // Build messages array
  const messages = [
    ...history.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0]?.text || 'Kuch problem aayi. Dobara try karo!'

    // Auto-save to hindsight memory
    const summary = `User asked: "${message.slice(0, 80)}" → AI: "${reply.slice(0, 100)}"`
    saveMemory(shopName, { summary, userMsg: message, botReply: reply })

    return res.json({
      reply,
      memoryCount: getMemories(shopName).length,
    })
  } catch (err) {
    console.error('Anthropic API error:', err.message)
    return res.status(500).json({ error: 'AI service error', detail: err.message })
  }
})

// ── GET /api/memories/:shopName ───────────────────────────────────────────────
app.get('/api/memories/:shopName', (req, res) => {
  const mems = getMemories(req.params.shopName)
  res.json({ memories: mems, count: mems.length })
})

// ── DELETE /api/memories/:shopName ───────────────────────────────────────────
app.delete('/api/memories/:shopName', (req, res) => {
  memoryStore[req.params.shopName] = []
  res.json({ success: true, message: 'All memories cleared' })
})

// ── DELETE /api/memories/:shopName/:memId ─────────────────────────────────────
app.delete('/api/memories/:shopName/:memId', (req, res) => {
  const { shopName, memId } = req.params
  if (memoryStore[shopName]) {
    memoryStore[shopName] = memoryStore[shopName].filter(m => String(m.id) !== memId)
  }
  res.json({ success: true })
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'Dost AI Backend' }))

app.listen(PORT, () => console.log(`✅ Dost AI backend running on http://localhost:${PORT}`))

─── end server.js ───────────────────────────────────────────────────────────────
*/


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 2 — FRONTEND  (ChatPage.jsx)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
//  This React component talks to the backend above.
//  Paste into your React app as src/pages/ChatPage.jsx
//  If you don't have a backend, set USE_BACKEND = false below to
//  call Anthropic directly from the browser instead.
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react'

// ── Config ────────────────────────────────────────────────────────────────────
const USE_BACKEND    = true                       // false = direct Anthropic API (dev only)
const BACKEND_URL    = 'http://localhost:4000'    // your Express server URL
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'
const STORAGE_KEY    = 'dost_hindsight_memories'

// ── Local hindsight (used when USE_BACKEND = false) ───────────────────────────
const localHindsight = {
  getAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
    catch { return [] }
  },
  add(entry) {
    const all = this.getAll()
    const mem = { id: Date.now(), ts: new Date().toISOString(), ...entry }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, mem].slice(-50)))
    return mem
  },
  clearAll() { localStorage.removeItem(STORAGE_KEY) },
  deleteOne(id) {
    const all = this.getAll().filter(m => m.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  },
  buildContext(limit = 8) {
    const mems = this.getAll().slice(-limit)
    if (!mems.length) return ''
    return '\n\n[Hindsight Memories]:\n' +
      mems.map(m => `• [${new Date(m.ts).toLocaleDateString('en-IN')}] ${m.summary}`).join('\n')
  },
  save(userMsg, botReply) {
    const summary = `User: "${userMsg.slice(0, 80)}" → AI: "${botReply.slice(0, 100)}"`
    this.add({ summary, userMsg, botReply })
  },
}

// ── Auth stub (replace with your real useAuth) ────────────────────────────────
const useAuth = () => ({
  user: { ownerName: 'Ramesh Sharma', shopName: 'Sharma General Store', city: 'Delhi' },
})

// ── Quick chips ───────────────────────────────────────────────────────────────
const QUICK_CHIPS = [
  'Aaj kya bechna profitable hoga?',
  'Mera Amul Milk stock low hai, kya karu?',
  'Is week ka profit summary batao',
  'Aas-paas area mein kya demand chal rahi hai?',
  'Bulk mein rice khareedna chahiye kya?',
  'Festival ke liye kya stock karu?',
]

// ── Global CSS ────────────────────────────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700&family=Noto+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --primary: #FF6B2B;   --primary-light: #FFF0E8;  --primary-dark: #E55A1F;
    --secondary: #FF9500; --surface: #FFFFFF;         --surface2: #F8F4F0;
    --border: #EDE8E3;    --text: #1A1208;            --muted: #9B8E82;
    --success: #22C55E;   --drawer-bg: #FDFAF7;
    --mem-card: #FFF7F2;  --mem-border: #FFD9C0;
    --shadow: 0 2px 12px rgba(255,107,43,0.10);
    --shadow-lg: 0 8px 32px rgba(255,107,43,0.18);
  }
  body { font-family: 'Noto Sans', sans-serif; background: var(--surface2); color: var(--text); }
  input {
    border: 1.5px solid var(--border); background: var(--surface); color: var(--text);
    outline: none; font-family: 'Noto Sans', sans-serif; transition: border-color 0.2s;
  }
  input:focus { border-color: var(--primary); }
  button { cursor: pointer; font-family: 'Noto Sans', sans-serif; border: none; outline: none; }
  .btn-primary {
    background: linear-gradient(135deg, #FF6B2B, #FF9500); color: #fff; font-weight: 600;
    transition: opacity 0.15s, transform 0.1s; box-shadow: 0 2px 8px rgba(255,107,43,0.3);
  }
  .btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-success { background: #DCFCE7; color: #16A34A; }
  .badge-offline { background: #FEF9C3; color: #A16207; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; animation: spin 0.7s linear infinite;
  }
  .message-bubble { animation: fadeSlideIn 0.25s ease both; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: #DDD5CC; border-radius: 10px; }
`

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function DostAvatar({ size = 40, fontSize = 18 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: 'linear-gradient(135deg,#FF6B2B,#FF9500)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, color: '#fff', fontWeight: 700, fontFamily: 'Baloo 2, sans-serif',
      flexShrink: 0, boxShadow: '0 2px 8px rgba(255,107,43,0.35)',
    }}>D</div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className="message-bubble" style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 14, alignItems: 'flex-end', gap: 8,
    }}>
      {!isUser && <DostAvatar size={28} fontSize={13} />}
      <div style={{ maxWidth: '78%' }}>
        {!isUser && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, paddingLeft: 2 }}>
            Dost AI · {USE_BACKEND ? 'Backend + Claude' : 'Claude Direct'}
          </div>
        )}
        <div style={{
          padding: '10px 14px', borderRadius: 16, lineHeight: 1.6, fontSize: 13.5,
          background: isUser ? 'linear-gradient(135deg,#FF6B2B,#FF9500)' : 'var(--surface)',
          color: isUser ? '#fff' : 'var(--text)',
          border: isUser ? 'none' : '1px solid var(--border)',
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: !isUser ? 4 : 16,
          whiteSpace: 'pre-wrap',
          boxShadow: isUser ? '0 2px 10px rgba(255,107,43,0.25)' : 'var(--shadow)',
        }}
          dangerouslySetInnerHTML={{
            __html: msg.text
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
          }}
        />
        <div style={{
          fontSize: 10, color: 'var(--muted)', marginTop: 3,
          textAlign: isUser ? 'right' : 'left', padding: '0 4px',
        }}>{msg.time}</div>
      </div>
    </div>
  )
}

function MemoryCard({ mem, onDelete }) {
  const date   = new Date(mem.ts)
  const label  = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return (
    <div style={{
      background: 'var(--mem-card)', border: '1px solid var(--mem-border)',
      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
      animation: 'fadeSlideIn 0.2s ease both', position: 'relative',
    }}>
      <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
        🕐 {label}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5, paddingRight: 20 }}>
        {mem.summary}
      </div>
      <button onClick={() => onDelete(mem.id)} style={{
        position: 'absolute', top: 8, right: 8, background: 'transparent',
        color: 'var(--muted)', fontSize: 14, lineHeight: 1, padding: '2px 4px',
        borderRadius: 4, transition: 'color 0.15s',
      }}
        onMouseOver={e => e.target.style.color = '#EF4444'}
        onMouseOut={e => e.target.style.color = 'var(--muted)'}
      >×</button>
    </div>
  )
}

function HindsightDrawer({ open, onClose, memories, onDeleteOne, onClearAll, backendMode }) {
  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.35)',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }} />
      )}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 340,
        background: 'var(--drawer-bg)', zIndex: 50,
        borderLeft: '1px solid var(--border)',
        boxShadow: '-8px 0 40px rgba(255,107,43,0.12)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '16px 16px 12px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg,#FF6B2B22,#FF950022)',
              border: '1.5px solid var(--mem-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🧠</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'Baloo 2, sans-serif' }}>
                Hindsight Memories
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {memories.length} saved · {backendMode ? '🟢 Server' : '🟡 Local'}
              </div>
            </div>
            <button onClick={onClose} style={{
              marginLeft: 'auto', background: 'var(--surface2)', color: 'var(--muted)',
              borderRadius: 8, padding: '4px 10px', fontSize: 18, lineHeight: 1,
              border: '1px solid var(--border)',
            }}>×</button>
          </div>
        </div>

        {/* Info banner */}
        <div style={{
          margin: '10px 12px 0', padding: '8px 10px', borderRadius: 8,
          background: 'var(--primary-light)', border: '1px solid var(--mem-border)',
          fontSize: 11.5, color: '#A04010', lineHeight: 1.5,
        }}>
          💡 Yeh memories automatically AI ko context deti hain har naye message ke saath.
          {backendMode
            ? ' Server-side store mein save hain.'
            : ' Browser localStorage mein save hain.'}
        </div>

        {/* Memory list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
          {memories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🌱</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Abhi koi memory nahi</div>
              <div style={{ fontSize: 12 }}>Jaise-jaise aap chat karenge, memories yahan save hongi.</div>
            </div>
          ) : (
            memories.slice().reverse().map(m => (
              <MemoryCard key={m.id} mem={m} onDelete={onDeleteOne} />
            ))
          )}
        </div>

        {/* Footer */}
        {memories.length > 0 && (
          <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <button onClick={onClearAll} style={{
              width: '100%', padding: '9px', borderRadius: 10,
              background: '#FEF2F2', color: '#DC2626',
              border: '1.5px solid #FECACA', fontSize: 13, fontWeight: 600,
              transition: 'background 0.15s',
            }}
              onMouseOver={e => e.target.style.background = '#FEE2E2'}
              onMouseOut={e => e.target.style.background = '#FEF2F2'}
            >
              🗑 Saari memories clear karo
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ChatPage
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user }         = useAuth()
  const [messages, setMessages] = useState([{
    role: 'bot',
    text: `Namaste ${user?.ownerName?.split(' ')[0] || ''} ji! 🙏\n\nMain **Dost AI** hoon — aapka personal AI business advisor.\n\nAapki **${user?.shopName || 'dukaan'}** ke liye main ready hoon. Bikri, profit, inventory, ya koi bhi sawaal puchho — Hindi ya English mein!\n\n_${USE_BACKEND ? 'Backend + Claude se powered. Server-side hindsight memories active!' : 'Direct Claude API se powered. Local memories active!'}_ 🧠`,
    time: 'Abhi',
  }])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [memories, setMemories] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [backendOk, setBackendOk]   = useState(USE_BACKEND)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // ── Load initial memories ──────────────────────────────────────────────────
  useEffect(() => {
    loadMemories()
    if (USE_BACKEND) checkBackend()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const checkBackend = async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/health`)
      setBackendOk(r.ok)
    } catch {
      setBackendOk(false)
    }
  }

  const loadMemories = useCallback(async () => {
    if (USE_BACKEND && backendOk) {
      try {
        const r    = await fetch(`${BACKEND_URL}/api/memories/${encodeURIComponent(user.shopName)}`)
        const data = await r.json()
        setMemories(data.memories || [])
        return
      } catch { /* fall through to local */ }
    }
    setMemories(localHindsight.getAll())
  }, [backendOk, user.shopName])

  const addMsg = (role, text) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { role, text, time }])
  }

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    addMsg('user', msg)
    setLoading(true)

    const history = messages.slice(-8).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))

    try {
      let reply = ''

      if (USE_BACKEND && backendOk) {
        // ── Backend path ──────────────────────────────────────────────────
        const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            history,
            shopContext: {
              shopName:  user.shopName,
              ownerName: user.ownerName,
              city:      user.city,
            },
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Server error')
        reply = data.reply

      } else {
        // ── Direct Anthropic path (no backend / fallback) ─────────────────
        const memCtx     = localHindsight.buildContext(8)
        const systemPrompt = [
          `Tum Dost AI ho — ek friendly, smart business advisor for small Indian shop owners.`,
          `Shop: "${user.shopName}" | Owner: ${user.ownerName} | City: ${user.city}`,
          `Hindi aur English dono mein baat karo. Short, practical advice do.`,
          `Bold ke liye **text** use karo. Friendly raho.`,
          memCtx ? `\nPast context (memories):${memCtx}` : '',
        ].filter(Boolean).join('\n')

        const res  = await fetch('https://api.anthropic.com/v1/messages', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model:      ANTHROPIC_MODEL,
            max_tokens: 1000,
            system:     systemPrompt,
            messages:   [...history, { role: 'user', content: msg }],
          }),
        })
        const data = await res.json()
        reply = data.content?.[0]?.text || 'Kuch problem aayi. Dobara try karo!'

        // Save locally when using direct API
        localHindsight.save(msg, reply)
      }

      addMsg('bot', reply)
      await loadMemories()   // refresh memory count

    } catch (e) {
      console.error(e)
      addMsg('bot', '⚠️ Network issue hai! Thodi der mein phir try karo. 🙏')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // ── Memory management ──────────────────────────────────────────────────────
  const handleDeleteOne = async (id) => {
    if (USE_BACKEND && backendOk) {
      await fetch(`${BACKEND_URL}/api/memories/${encodeURIComponent(user.shopName)}/${id}`, { method: 'DELETE' })
    } else {
      localHindsight.deleteOne(id)
    }
    await loadMemories()
  }

  const handleClearAll = async () => {
    if (USE_BACKEND && backendOk) {
      await fetch(`${BACKEND_URL}/api/memories/${encodeURIComponent(user.shopName)}`, { method: 'DELETE' })
    } else {
      localHindsight.clearAll()
    }
    await loadMemories()
    setDrawerOpen(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{globalCSS}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface2)' }}>

        {/* ── Header ── */}
        <div style={{
          padding: '11px 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 1px 8px rgba(255,107,43,0.07)', zIndex: 10,
        }}>
          <DostAvatar size={42} fontSize={19} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Baloo 2, sans-serif', letterSpacing: '-0.01em' }}>
              Dost AI
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Claude Powered · Hindi + English · Real-time advice
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 7, alignItems: 'center' }}>
            {/* Backend status badge */}
            {USE_BACKEND
              ? <span className={`badge ${backendOk ? 'badge-success' : 'badge-offline'}`}>
                  {backendOk ? '● Server Live' : '⚡ Local Mode'}
                </span>
              : <span className="badge badge-success">● Live</span>
            }

            {/* 🧠 Memory button */}
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                background: memories.length > 0 ? 'var(--primary-light)' : 'var(--surface2)',
                border: `1.5px solid ${memories.length > 0 ? 'var(--mem-border)' : 'var(--border)'}`,
                color: memories.length > 0 ? 'var(--primary)' : 'var(--muted)',
                fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              🧠 {memories.length} memories
            </button>
          </div>
        </div>

        {/* ── Quick chips ── */}
        <div style={{
          padding: '8px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', gap: 6, flexWrap: 'wrap',
          background: 'var(--surface)', overflowX: 'auto',
        }}>
          {QUICK_CHIPS.map(c => (
            <button key={c} onClick={() => sendMessage(c)} style={{
              padding: '4px 12px', borderRadius: 20, border: '1.5px solid var(--border)',
              background: 'var(--surface2)', fontSize: 12, color: 'var(--text)',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
              onMouseOver={e => { e.target.style.background = 'var(--primary-light)'; e.target.style.borderColor = 'var(--mem-border)'; e.target.style.color = 'var(--primary)' }}
              onMouseOut={e => { e.target.style.background = 'var(--surface2)'; e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text)' }}
            >{c}</button>
          ))}
        </div>

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px' }}>
          {messages.map((m, i) => <Message key={i} msg={m} />)}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, animation: 'fadeSlideIn 0.2s ease' }}>
              <DostAvatar size={28} fontSize={13} />
              <div style={{
                display: 'flex', gap: 5, padding: '10px 14px',
                background: 'var(--surface)', borderRadius: 16, borderBottomLeftRadius: 4,
                border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
              }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)',
                    animation: `bounce 1.2s ${d}s infinite ease-in-out`, opacity: 0.7,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input bar ── */}
        <div style={{
          padding: '10px 14px 12px', borderTop: '1px solid var(--border)',
          background: 'var(--surface)', display: 'flex', gap: 8, alignItems: 'center',
          boxShadow: '0 -2px 12px rgba(255,107,43,0.06)',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Kuch bhi puchho — 'Aaj ka report batao', 'Kya stock karu?'..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 13.5 }}
            disabled={loading}
          />
          <button
            className="btn-primary"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ padding: '10px 18px', borderRadius: 12, fontSize: 13.5, flexShrink: 0 }}
          >
            {loading ? <span className="spinner" /> : 'Bhejo ↗'}
          </button>
        </div>
      </div>

      {/* ── Hindsight Drawer ── */}
      <HindsightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        memories={memories}
        onDeleteOne={handleDeleteOne}
        onClearAll={handleClearAll}
        backendMode={USE_BACKEND && backendOk}
      />
    </>
  )
}