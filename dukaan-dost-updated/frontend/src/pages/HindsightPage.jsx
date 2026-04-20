import React, { useState, useEffect, useRef } from 'react'
import { hindsight } from '../utils/hindsight.js'
import { useAuth } from '../context/AuthContext.jsx'
import toast from 'react-hot-toast'

// ─── Demo memories ─────────────────────────────────────────────────────────────
const DEMO_MEMORIES = [
  { id:'1', timestamp:'2026-04-14T10:00:00Z', type:'purchase', product:'Parle-G Biscuit', action:'Bulk mein 200 packs liya', outcome:{ profit:600, units_sold:200, verdict:'good' } },
  { id:'2', timestamp:'2026-04-08T09:00:00Z', type:'purchase', product:'Maggi Oats Masala', action:'30 boxes liya bulk mein', outcome:{ profit:-504, units_sold:12, verdict:'bad' } },
  { id:'3', timestamp:'2026-04-01T08:00:00Z', type:'purchase', product:'Dates + Dry Fruits', action:'Ramadan mein special stock kiya', outcome:{ profit:1200, units_sold:80, verdict:'good' } },
  { id:'4', timestamp:'2026-03-25T11:00:00Z', type:'price_change', product:'Surf Excel 1kg', action:'Price ₹5 badhaya', outcome:{ profit:-200, units_sold:15, verdict:'bad' } },
  { id:'5', timestamp:'2026-03-18T07:00:00Z', type:'promo', product:'Amul Milk', action:'Morning delivery timing badli 6am → 8am', outcome:{ profit:150, units_sold:40, verdict:'good' } },
]

// ─── Claude API call (no API key needed — uses Claude's built-in proxy) ────────
const CLAUDE_SYSTEM = `You are Hindsight Agent — an AI business memory assistant embedded in "Dukaan Dost", a shop management app for Indian kirana/general store owners.

Your personality: speak in a mix of Hindi + English (Hinglish), warm, practical, like a smart dost who knows the shop inside out.

You have access to:
1. The shop's past business decisions and their outcomes (profit/loss)
2. The shop's location (city, state, pincode) for local context
3. Indian calendar — festivals, seasons, local events

Your job:
- Analyze past decisions to predict future outcomes
- Give location-specific advice (e.g., Bihar ke liye relevant items, local festivals)
- Warn about repeating past mistakes
- Suggest smart stock, pricing, and promo decisions

Always respond in Hinglish. Be concise (3-5 lines max per response). End with a clear actionable recommendation. Use ₹ symbol for Indian rupees.`

async function callHindsightAgent(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: CLAUDE_SYSTEM,
      messages,
    }),
  })
  const data = await res.json()
  const text = data.content?.map(b => b.text || '').join('\n') || 'Kuch gadbad ho gayi. Dobara try karo.'
  return text
}

// ─── Agent chat bubble ─────────────────────────────────────────────────────────
function ChatBubble({ role, text }) {
  const isAgent = role === 'assistant'
  return (
    <div style={{
      display: 'flex', gap: 8, marginBottom: 12,
      flexDirection: isAgent ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isAgent ? 'linear-gradient(135deg,#7C3AED,#FF6B2B)' : '#E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>
        {isAgent ? '🧠' : '🧑'}
      </div>
      <div style={{
        maxWidth: '78%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
        background: isAgent ? 'linear-gradient(135deg,#F5F3FF,#FFF0EA)' : '#F1F5F9',
        border: isAgent ? '1px solid #DDD6FE' : '1px solid #E2E8F0',
        color: '#1A1A2E',
        borderTopLeftRadius: isAgent ? 4 : 12,
        borderTopRightRadius: isAgent ? 12 : 4,
      }}>
        {text}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HindsightPage() {
  const { user } = useAuth()
  const [memories, setMemories] = useState([])
  const [stats, setStats] = useState({ total: 0, good: 0, bad: 0, accuracy: 0, lossPrevented: 0 })

  // Experiment mode
  const [expProduct, setExpProduct] = useState('Amul Milk 1L')
  const [expAction, setExpAction] = useState('price_up_5')
  const [prediction, setPrediction] = useState(null)
  const [predicting, setPredicting] = useState(false)

  // Agent chat
  const [agentMessages, setAgentMessages] = useState([])
  const [agentInput, setAgentInput] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentStarted, setAgentStarted] = useState(false)
  const chatEndRef = useRef(null)

  // Add memory form
  const [addForm, setAddForm] = useState({ product:'', action:'', type:'purchase', verdict:'good', profit:'', units_sold:'' })
  const [showAdd, setShowAdd] = useState(false)

  // Active tab
  const [activeTab, setActiveTab] = useState('experiment')

  useEffect(() => {
    const all = hindsight.getAll()
    setMemories(all.length > 0 ? all : DEMO_MEMORIES)
    const s = hindsight.getStats()
    setStats(s.total > 0 ? s : { total: 127, good: 105, bad: 22, accuracy: 83, lossPrevented: 12400 })
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agentMessages])

  // ── Location context builder ──────────────────────────────────────────────
  const buildLocationContext = () => {
    const city = user?.city || 'Unknown City'
    const state = user?.state || 'Unknown State'
    const pincode = user?.pincode || ''
    const shopType = user?.shopType || 'general store'
    const today = new Date()
    const month = today.toLocaleString('en-IN', { month: 'long' })
    return `Shop location: ${city}, ${state}${pincode ? ' - ' + pincode : ''}. Shop type: ${shopType}. Current month: ${month}.`
  }

  // ── Hindsight memory context ──────────────────────────────────────────────
  const buildMemoryContext = (productName = null) => {
    const mems = productName
      ? memories.filter(m => m.product?.toLowerCase().includes(productName.toLowerCase())).slice(0, 5)
      : memories.slice(0, 8)
    if (!mems.length) return 'No past decisions yet.'
    return mems.map(m =>
      `[${m.timestamp?.slice(0,10)}] ${m.type?.toUpperCase()}: "${m.product}" — ${m.action} → ${m.outcome?.verdict?.toUpperCase()} (₹${m.outcome?.profit ?? 0} profit, ${m.outcome?.units_sold ?? '?'} units sold)`
    ).join('\n')
  }

  // ── Experiment predict ────────────────────────────────────────────────────
  const runExperiment = async () => {
    setPredicting(true)
    setPrediction(null)
    const locationCtx = buildLocationContext()
    const memCtx = buildMemoryContext(expProduct)
    const actionLabels = {
      price_up_5: 'Price ₹5 badhana',
      price_down_5: 'Price ₹5 ghataana',
      bulk_buy: 'Bulk mein khareedna (2x)',
      promo_offer: 'Promo offer lagana',
    }
    const prompt = `${locationCtx}\n\nPast decisions:\n${memCtx}\n\nProposed action: "${actionLabels[expAction] || expAction}" for product "${expProduct}"\n\nPredict the outcome. Should I do this? Give verdict + reason + recommendation.`
    try {
      const result = await callHindsightAgent([{ role: 'user', content: prompt }])
      setPrediction(result)
    } catch {
      setPrediction('API se connect nahi ho paya. Backend check karo ya network dekho.')
    } finally {
      setPredicting(false)
    }
  }

  // ── Agent chat ────────────────────────────────────────────────────────────
  const startAgentChat = async () => {
    setAgentStarted(true)
    setAgentLoading(true)
    const locationCtx = buildLocationContext()
    const memCtx = buildMemoryContext()
    const greeting = `${locationCtx}\n\nPast decisions summary:\n${memCtx}\n\nAaj ki date: ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}. Shop owner se milke greet karo aur 1 smart tip do based on location aur past decisions.`
    try {
      const reply = await callHindsightAgent([{ role: 'user', content: greeting }])
      setAgentMessages([{ role: 'assistant', text: reply }])
    } catch {
      setAgentMessages([{ role: 'assistant', text: 'Namaste! 🙏 Mujhe connect karne mein thodi problem hui. Phir bhi puchho — main help karne ki koshish karunga!' }])
    } finally {
      setAgentLoading(false)
    }
  }

  const sendAgentMessage = async () => {
    const msg = agentInput.trim()
    if (!msg || agentLoading) return
    setAgentInput('')
    const userMsg = { role: 'user', text: msg }
    const newMsgs = [...agentMessages, userMsg]
    setAgentMessages(newMsgs)
    setAgentLoading(true)

    const locationCtx = buildLocationContext()
    const memCtx = buildMemoryContext()
    const systemContext = `${locationCtx}\nPast decisions:\n${memCtx}\n\n`

    // Build API message history
    const apiMessages = []
    // inject context into first user message
    newMsgs.forEach((m, i) => {
      if (m.role === 'user') {
        apiMessages.push({ role: 'user', content: i === 0 ? systemContext + m.text : m.text })
      } else {
        apiMessages.push({ role: 'assistant', content: m.text })
      }
    })

    try {
      const reply = await callHindsightAgent(apiMessages)
      setAgentMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setAgentMessages(prev => [...prev, { role: 'assistant', text: 'Oops! Kuch gadbad hui. Network check karo.' }])
    } finally {
      setAgentLoading(false)
    }
  }

  // ── Add memory ────────────────────────────────────────────────────────────
  const addMemory = () => {
    if (!addForm.product || !addForm.action) { toast.error('Product aur action dono bharo!'); return }
    hindsight.add({
      type: addForm.type, product: addForm.product, action: addForm.action,
      outcome: { verdict: addForm.verdict, profit: parseInt(addForm.profit) || 0, units_sold: parseInt(addForm.units_sold) || 0 }
    })
    const all = hindsight.getAll()
    setMemories(all)
    setStats(hindsight.getStats())
    setAddForm({ product:'', action:'', type:'purchase', verdict:'good', profit:'', units_sold:'' })
    setShowAdd(false)
    toast.success('Memory saved! 🧠')
  }

  const verdictColor = v => v === 'good' ? '#00C896' : v === 'bad' ? '#EF4444' : '#F59E0B'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 22, fontWeight: 700 }}>Hindsight Engine 🧠</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            Past decisions se seekho · Future mistakes rokho ·{' '}
            <span style={{ color: '#7C3AED', fontWeight: 500 }}>
              📍 {user?.city || 'Your City'}, {user?.state || 'Your State'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: 'linear-gradient(90deg,#7C3AED22,#FF6B2B22)',
            color: '#7C3AED', border: '1px solid #DDD6FE',
          }}>🤖 AI Powered</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Decisions stored', value: stats.total, color: 'var(--primary)' },
          { label: 'Successful', value: stats.good, color: 'var(--accent)' },
          { label: 'Prediction accuracy', value: `${stats.accuracy}%`, color: '#8B5CF6' },
          { label: 'Loss prevented', value: `₹${(stats.lossPrevented || 12400).toLocaleString('en-IN')}`, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: 'Baloo 2, sans-serif', fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { id: 'experiment', label: '🧪 Experiment Mode' },
          { id: 'agent',      label: '🤖 Hindsight Agent' },
          { id: 'timeline',   label: '📋 Memory Timeline' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '9px 16px', border: 'none', borderRadius: '8px 8px 0 0',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
            background: activeTab === tab.id ? '#fff' : 'transparent',
            color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted)',
            borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Experiment ── */}
      {activeTab === 'experiment' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 700, fontSize: 16 }}>🧪 AI Experiment Mode</div>
              <span className="badge badge-primary" style={{ fontSize: 10 }}>Unique Feature</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
              Koi bhi decision lene se pehle AI se puchho — result dekho, phir action lo.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Product select karo</label>
                <select value={expProduct} onChange={e => setExpProduct(e.target.value)}>
                  {['Amul Milk 1L','Basmati Rice 5kg','Parle-G Biscuit','Maggi Oats Masala','Lal Mirch 200g','Surf Excel 1kg','Amul Butter 100g','Pooja Oil 500ml','Dates & Dry Fruits','Umbrella'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Action select karo</label>
                <select value={expAction} onChange={e => setExpAction(e.target.value)}>
                  <option value="price_up_5">Price ₹5 badhao</option>
                  <option value="price_down_5">Price ₹5 ghataao</option>
                  <option value="bulk_buy">Bulk mein kharido (2x)</option>
                  <option value="promo_offer">Promo offer lagao</option>
                </select>
              </div>

              {/* Location badge */}
              <div style={{
                padding: '8px 12px', borderRadius: 8, background: '#F5F3FF',
                border: '1px solid #DDD6FE', fontSize: 12, color: '#6D28D9', display: 'flex', gap: 6, alignItems: 'center',
              }}>
                📍 Location context: <strong>{user?.city}, {user?.state}</strong> — AI will use this for local advice
              </div>
            </div>

            <button className="btn-primary" onClick={runExperiment} disabled={predicting} style={{ width: '100%' }}>
              {predicting
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Hindsight memory + location check ho rahi hai...</>
                : '🔮 Predict karo ↗'}
            </button>

            {prediction && (
              <div style={{
                marginTop: 14, padding: 14, background: 'linear-gradient(135deg,#F5F3FF,#FFF0EA)',
                borderRadius: 10, border: '1px solid #DDD6FE', fontSize: 13, lineHeight: 1.7,
              }}>
                <div style={{ fontSize: 11, color: '#7C3AED', marginBottom: 6, fontWeight: 600 }}>🧠 Hindsight Agent — Prediction</div>
                {prediction}
              </div>
            )}
          </div>

          {/* Add memory panel */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 600 }}>Memory add karo</div>
              <button onClick={() => setShowAdd(!showAdd)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>
                {showAdd ? '✕' : '+ Add'}
              </button>
            </div>
            {showAdd && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input placeholder="Product naam" value={addForm.product} onChange={e => setAddForm(f=>({...f,product:e.target.value}))} />
                <input placeholder="Kya kiya? (action)" value={addForm.action} onChange={e => setAddForm(f=>({...f,action:e.target.value}))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <select value={addForm.type} onChange={e => setAddForm(f=>({...f,type:e.target.value}))}>
                    {['purchase','price_change','promo','restock','disposal'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select value={addForm.verdict} onChange={e => setAddForm(f=>({...f,verdict:e.target.value}))}>
                    <option value="good">Faida (good)</option>
                    <option value="bad">Nuksan (bad)</option>
                    <option value="neutral">Neutral</option>
                  </select>
                  <input type="number" placeholder="Profit/Loss ₹" value={addForm.profit} onChange={e => setAddForm(f=>({...f,profit:e.target.value}))} />
                  <input type="number" placeholder="Units sold" value={addForm.units_sold} onChange={e => setAddForm(f=>({...f,units_sold:e.target.value}))} />
                </div>
                <button className="btn-primary" onClick={addMemory}>Save memory 🧠</button>
              </div>
            )}
            {!showAdd && (
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                Har decision record karo — good ya bad. Jitna zyada memory, utna smarter AI prediction.
                <br /><br />
                Currently <strong>{memories.length}</strong> decisions stored.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Hindsight Agent ── */}
      {activeTab === 'agent' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Agent header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(90deg, #1A1A2E, #2D1B69)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg,#7C3AED,#FF6B2B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🧠</div>
            <div>
              <div style={{ color: '#fff', fontFamily: 'Baloo 2, sans-serif', fontWeight: 700, fontSize: 15 }}>Hindsight Agent</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                AI memory + 📍 {user?.city}, {user?.state} location context — Hinglish mein baat karo
              </div>
            </div>
            <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#00C896' }} />
          </div>

          {/* Chat area */}
          <div style={{ height: 380, overflowY: 'auto', padding: 16, background: '#FAFAF8' }}>
            {!agentStarted ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ fontSize: 40 }}>🧠</div>
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, maxWidth: 320 }}>
                  Hindsight Agent aapki shop ki <strong>past decisions</strong> aur <strong>location</strong> se smarter decisions mein help karta hai.
                  <br />
                  <span style={{ color: '#7C3AED' }}>📍 {user?.city}, {user?.state}</span> ke liye local advice milegi.
                </div>
                <button className="btn-primary" onClick={startAgentChat} style={{ marginTop: 8 }}>
                  🤖 Agent se baat karo
                </button>
              </div>
            ) : (
              <>
                {agentMessages.map((m, i) => <ChatBubble key={i} role={m.role} text={m.text} />)}
                {agentLoading && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)', fontSize: 12 }}>
                    <span className="spinner" style={{ width: 14, height: 14 }} /> Soch raha hoon...
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          {agentStarted && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input
                value={agentInput}
                onChange={e => setAgentInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendAgentMessage()}
                placeholder="Kuch bhi puchho — stock, price, festival tips..."
                style={{ flex: 1 }}
                disabled={agentLoading}
              />
              <button className="btn-primary" onClick={sendAgentMessage} disabled={agentLoading || !agentInput.trim()}>
                Send ↗
              </button>
            </div>
          )}

          {/* Quick prompts */}
          {agentStarted && (
            <div style={{ padding: '8px 14px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
              {[
                'Is hafta kya stock karna chahiye?',
                'Koi pattern dikha past mistakes mein?',
                'Upcoming festival ke liye suggest karo',
                `${user?.city} mein best selling items?`,
              ].map(q => (
                <button key={q} onClick={() => { setAgentInput(q); }} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11,
                  background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE',
                  cursor: 'pointer',
                }}>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Timeline ── */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
          <div className="card" style={{ padding: 18, overflowY: 'auto', maxHeight: 560 }}>
            <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 600, marginBottom: 14 }}>Memory Timeline</div>
            {memories.map((m, i) => (
              <div key={m.id || i} style={{ display: 'flex', gap: 12, paddingBottom: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4, background: verdictColor(m.outcome?.verdict), flexShrink: 0 }} />
                  {i < memories.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border)', minHeight: 20, marginTop: 3 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(m.timestamp).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{m.product}</div>
                  <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 1 }}>{m.action}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{m.outcome?.units_sold} units · {m.outcome?.profit >= 0 ? '+' : ''}₹{m.outcome?.profit}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                    background: m.outcome?.verdict === 'good' ? 'var(--accent-light)' : m.outcome?.verdict === 'bad' ? '#FEF2F2' : '#FFFBEB',
                    color: m.outcome?.verdict === 'good' ? '#065F46' : m.outcome?.verdict === 'bad' ? '#7F1D1D' : '#92400E',
                  }}>
                    {m.outcome?.verdict === 'good' ? 'Faida ✓' : m.outcome?.verdict === 'bad' ? 'Nuksan ✗' : 'Neutral'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add memory panel in timeline tab */}
          <div className="card" style={{ padding: 16, height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: 'Baloo 2, sans-serif', fontWeight: 600 }}>Memory add karo</div>
              <button onClick={() => setShowAdd(!showAdd)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 500 }}>
                {showAdd ? '✕' : '+ Add'}
              </button>
            </div>
            {showAdd && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input placeholder="Product naam" value={addForm.product} onChange={e => setAddForm(f=>({...f,product:e.target.value}))} />
                <input placeholder="Kya kiya? (action)" value={addForm.action} onChange={e => setAddForm(f=>({...f,action:e.target.value}))} />
                <select value={addForm.type} onChange={e => setAddForm(f=>({...f,type:e.target.value}))}>
                  {['purchase','price_change','promo','restock','disposal'].map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={addForm.verdict} onChange={e => setAddForm(f=>({...f,verdict:e.target.value}))}>
                  <option value="good">Faida (good)</option>
                  <option value="bad">Nuksan (bad)</option>
                  <option value="neutral">Neutral</option>
                </select>
                <input type="number" placeholder="Profit/Loss ₹" value={addForm.profit} onChange={e => setAddForm(f=>({...f,profit:e.target.value}))} />
                <input type="number" placeholder="Units sold" value={addForm.units_sold} onChange={e => setAddForm(f=>({...f,units_sold:e.target.value}))} />
                <button className="btn-primary" onClick={addMemory}>Save memory 🧠</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
