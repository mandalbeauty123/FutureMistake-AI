import express from 'express'
import Hindsight from '../models/Hindsight.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

// Feature vector builder (mirrors frontend hindsight.js)
function featureVector(entry) {
  const typeMap = { purchase: 0, price_change: 1, promo: 2, restock: 3, disposal: 4, other: 5 }
  const verdictMap = { good: 1, neutral: 0, bad: -1 }
  const d = new Date(entry.createdAt || Date.now())
  return [
    typeMap[entry.type] ?? 0,
    d.getMonth(),
    d.getDay(),
    verdictMap[entry.outcome?.verdict] ?? 0,
    entry.outcome?.profit ?? 0,
    entry.outcome?.units_sold ?? 0,
  ]
}

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0
  const dot = a.reduce((s, v, i) => s + v * b[i], 0)
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
  return magA && magB ? dot / (magA * magB) : 0
}

// GET /api/hindsight — list all memories
router.get('/', async (req, res, next) => {
  try {
    const { product, type, verdict, limit = 50 } = req.query
    const filter = { shop: req.user._id }
    if (product) filter.product = new RegExp(product, 'i')
    if (type)    filter.type = type
    if (verdict) filter['outcome.verdict'] = verdict

    const memories = await Hindsight.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    const stats = {
      total: memories.length,
      good:  memories.filter(m => m.outcome.verdict === 'good').length,
      bad:   memories.filter(m => m.outcome.verdict === 'bad').length,
      totalProfit: memories.reduce((s, m) => s + (m.outcome.profit || 0), 0),
    }

    res.json({ success: true, memories, stats })
  } catch (err) {
    next(err)
  }
})

// POST /api/hindsight — save a new memory
router.post('/', async (req, res, next) => {
  try {
    const { type, product, action, context, outcome, aiSummary } = req.body

    const entry = await Hindsight.create({
      shop: req.user._id,
      type, product, action, context, outcome, aiSummary,
    })

    // Compute + store embedding
    entry.embedding = featureVector(entry)
    await entry.save()

    res.status(201).json({ success: true, memory: entry })
  } catch (err) {
    next(err)
  }
})

// GET /api/hindsight/similar — find similar past decisions
router.get('/similar', async (req, res, next) => {
  try {
    const { type, product, verdict, profit = 0, units_sold = 0 } = req.query

    const queryVec = featureVector({
      type: type || 'purchase',
      outcome: { verdict: verdict || 'neutral', profit: parseFloat(profit), units_sold: parseInt(units_sold) },
    })

    const all = await Hindsight.find({ shop: req.user._id })
    const scored = all
      .map(m => ({ ...m.toObject(), score: cosineSimilarity(queryVec, m.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    res.json({ success: true, similar: scored })
  } catch (err) {
    next(err)
  }
})

// GET /api/hindsight/stats — summary stats
router.get('/stats', async (req, res, next) => {
  try {
    const [result] = await Hindsight.aggregate([
      { $match: { shop: req.user._id } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        good:  { $sum: { $cond: [{ $eq: ['$outcome.verdict','good'] }, 1, 0] } },
        bad:   { $sum: { $cond: [{ $eq: ['$outcome.verdict','bad'] }, 1, 0] } },
        totalProfit: { $sum: '$outcome.profit' },
      }},
    ])

    const stats = result || { total: 0, good: 0, bad: 0, totalProfit: 0 }
    stats.accuracy = stats.total > 0 ? Math.round((stats.good / stats.total) * 100) : 0
    stats.lossPrevented = Math.abs(Math.round(stats.totalProfit * 0.3))

    res.json({ success: true, stats })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/hindsight/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Hindsight.findOneAndDelete({ _id: req.params.id, shop: req.user._id })
    res.json({ success: true, message: 'Memory deleted' })
  } catch (err) {
    next(err)
  }
})

export default router
