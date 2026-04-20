import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { protect } from '../middleware/auth.js'
import Hindsight from '../models/Hindsight.js'
import Sale from '../models/Sale.js'

const router = express.Router()
router.use(protect)

// ── Gemini client ─────────────────────────────────────────
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

// Build rich system prompt with shop + hindsight context
function buildSystemPrompt(user, hindsightCtx, salesCtx) {
  return `You are "Dost AI" — an intelligent, friendly AI business advisor for Indian kirana/general store owners.

SHOP INFO:
- Shop Name: ${user.shopName}
- Owner: ${user.ownerName}
- Location: ${user.city || 'India'}

RECENT SALES CONTEXT:
${salesCtx}

HINDSIGHT MEMORY (past decisions):
${hindsightCtx || 'No past decisions recorded yet.'}

INSTRUCTIONS:
1. Always respond in Hinglish (mix of Hindi + English) — warm, friendly, practical.
2. Keep responses concise (3-5 sentences max unless asked for detail).
3. Reference Hindsight memory when relevant to the question.
4. Always give a concrete recommendation, never vague answers.
5. Use ₹ for prices, bullet points for lists.
6. If asked about inventory, reference the shop's actual products.
7. Never make up facts — if unsure, say "mujhe pura data nahi hai, lekin..."
8. End with an actionable tip when possible.`
}

// POST /api/ai/chat — main chat endpoint
router.post('/chat', async (req, res, next) => {
  try {
    const { message, history = [], hindsightContext, shopContext } = req.body

    // Get recent sales for context
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const recentSales = await Sale.find({ shop: req.user._id, soldAt: { $gte: todayStart } })
      .sort({ soldAt: -1 }).limit(10)
    const salesCtx = recentSales.length > 0
      ? recentSales.map(s => `${s.billNumber}: ₹${s.total} profit ₹${s.profit} (${s.items.map(i => i.name).join(', ')})`).join('\n')
      : 'No sales recorded today yet.'

    const systemPrompt = buildSystemPrompt(req.user, hindsightContext, salesCtx)

    try {
      const model = getGeminiClient()

      // Build Gemini chat history format
      const geminiHistory = history
        .filter(m => m.content?.trim())
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

      const chat = model.startChat({
        history: geminiHistory,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      })

      const result = await chat.sendMessage(message)
      const reply = result.response.text()

      res.json({ success: true, reply, provider: 'gemini' })
    } catch (geminiErr) {
      // Fallback: rule-based Hindi responses
      console.warn('Gemini unavailable, using fallback:', geminiErr.message)
      const reply = generateFallbackReply(message, req.user)
      res.json({ success: true, reply, provider: 'fallback' })
    }
  } catch (err) {
    next(err)
  }
})

// POST /api/ai/experiment — Hindsight experiment mode prediction
router.post('/experiment', async (req, res, next) => {
  try {
    const { product, action, hindsightContext } = req.body

    // Fetch similar past decisions from DB
    const pastDecisions = await Hindsight.find({ shop: req.user._id, product: new RegExp(product, 'i') })
      .sort({ createdAt: -1 }).limit(5)

    const pastContext = pastDecisions.length > 0
      ? pastDecisions.map(d => `${d.type}: ${d.action} → ${d.outcome.verdict} (₹${d.outcome.profit})`).join('\n')
      : hindsightContext || 'No past data for this product.'

    const prompt = `You are a business prediction AI for an Indian kirana store.

Product: "${product}"
Proposed action: "${action}"
Past decisions for this product:
${pastContext}

Based on this data, predict what will happen if the shopkeeper takes this action.
Respond in Hinglish (Hindi + English), 3-4 sentences max.
Include: expected impact on sales, profit estimate, and a clear recommendation (Karo / Mat Karo).
Be specific with numbers where possible.`

    let prediction
    try {
      const model = getGeminiClient()
      const result = await model.generateContent(prompt)
      prediction = result.response.text()
    } catch {
      prediction = generateFallbackPrediction(product, action)
    }

    res.json({ success: true, prediction })
  } catch (err) {
    next(err)
  }
})

// POST /api/ai/insights — GWA-style geo market insights
router.post('/insights', async (req, res, next) => {
  try {
    const { city, season } = req.body
    const prompt = `You are a market intelligence AI for Indian cities.
City: ${city || req.user.city || 'Bihar'}
Current season/time: ${season || 'April 2026 (Summer + festival season)'}

Generate 3 hyper-local market insights for a kirana store in this area.
Format: JSON array with keys: title (Hindi), detail (Hinglish), action (specific recommendation), priority (high/medium/low).
Only JSON, no other text.`

    let insights
    try {
      const model = getGeminiClient()
      const result = await model.generateContent(prompt)
      const text = result.response.text().replace(/```json|```/g, '').trim()
      insights = JSON.parse(text)
    } catch {
      insights = [
        { title: 'Summer demand', detail: 'Garmi mein cold drinks, lassi, nimbu pani demand 3x badhti hai', action: 'Beverages ka stock 50% badhao', priority: 'high' },
        { title: 'Festival season', detail: 'Akshaya Tritiya pe pooja samagri, mithai ki demand spike expected', action: 'Agle 5 din mein advance stock karo', priority: 'high' },
        { title: 'Dairy ke liye zyada demand', detail: 'Bihar mein Amul products consistently top seller hain', action: 'Amul ka buffer stock maintain karo', priority: 'medium' },
      ]
    }

    res.json({ success: true, insights })
  } catch (err) {
    next(err)
  }
})

// ── Fallback reply generator (no API key needed) ──────────
function generateFallbackReply(message, user) {
  const msg = message.toLowerCase()
  if (msg.includes('profit') || msg.includes('kamai'))
    return `Aaj aapki dukaan ka profit accha chal raha hai! 📊 Top performers generally dairy aur snacks hote hain. Apna actual data dekhne ke liye sales record karte raho — AI zyada accurate predict karega.`
  if (msg.includes('stock') || msg.includes('inventory'))
    return `Stock management ke liye: fast-moving items (milk, biscuits) ka buffer rakhna zaruri hai. 📦 Dead stock pe discount ya combo offer try karo. Min stock alert set karo har item pe.`
  if (msg.includes('price') || msg.includes('rate'))
    return `Price change karne se pehle Hindsight check karo. ⚠️ Essential items (milk, rice) pe price increase se sales drop ho sakti hai. Non-essential items pe 5-10% increase usually safe hai.`
  if (msg.includes('festival') || msg.includes('tyohar'))
    return `Festival season mein demand patterns follow karo! 🎉 Akshaya Tritiya ke liye pooja samagri + mithai stock karo. Pehle se 3-4 din advance order karo suppliers ko.`
  return `Shukriya ${user.ownerName?.split(' ')[0] || ''} ji! 🙏 Main aapki poori madad karna chahta hoon. Apne sales data regularly update karo toh main zyada accurate advice de sakta hoon. Koi specific sawaal ho toh puchho!`
}

function generateFallbackPrediction(product, action) {
  if (action.includes('price_up'))
    return `${product} pe price badhana risky ho sakta hai. Essential items pe demand elastic hoti hai — 10-15% sales drop expected. Pehle competitor prices check karo.`
  if (action.includes('price_down'))
    return `Price down se volume badh sakta hai par margin kam hogi. Net effect mostly neutral. Weekend promo better option hai.`
  if (action.includes('bulk'))
    return `Bulk kharidne se per unit cost kam hogi. Lekin storage aur expiry check karo pehle. Fast-moving items ke liye hi bulk safe hai.`
  return `Is action ka predicted outcome: moderate positive impact expected. Past data ke bina exact prediction mushkil hai. Chhota scale pe test karo pehle.`
}

export default router
