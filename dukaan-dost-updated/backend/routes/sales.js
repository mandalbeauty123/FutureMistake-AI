import express from 'express'
import Sale from '../models/Sale.js'
import Inventory from '../models/Inventory.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

// POST /api/sales — record a new sale and deduct stock
router.post('/', async (req, res, next) => {
  try {
    const { items, customerName, paymentMode, gst = 0 } = req.body

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'Koi item nahi hai sale mein' })
    }

    // Enrich items with buy price from inventory + deduct stock
    const enriched = []
    for (const item of items) {
      const inv = await Inventory.findOne({ _id: item.inventoryItem, shop: req.user._id })
      if (!inv) return res.status(404).json({ success: false, message: `Item "${item.name}" inventory mein nahi mila` })
      if (inv.stock < item.qty) {
        return res.status(400).json({ success: false, message: `"${inv.name}" ka stock sirf ${inv.stock} bacha hai` })
      }
      inv.stock -= item.qty
      await inv.save()
      enriched.push({ inventoryItem: inv._id, name: inv.name, qty: item.qty, buyPrice: inv.buyPrice, sellPrice: inv.sellPrice })
    }

    const subtotal = enriched.reduce((s, i) => s + i.sellPrice * i.qty, 0)
    const billNumber = `DD-${Date.now().toString().slice(-8)}`

    const sale = await Sale.create({
      shop: req.user._id,
      items: enriched,
      subtotal,
      gst,
      total: subtotal + gst,
      customerName,
      paymentMode,
      billNumber,
    })

    res.status(201).json({ success: true, sale })
  } catch (err) {
    next(err)
  }
})

// GET /api/sales — list sales with date range filter
router.get('/', async (req, res, next) => {
  try {
    const { from, to, limit = 50, page = 1 } = req.query
    const filter = { shop: req.user._id }

    if (from || to) {
      filter.soldAt = {}
      if (from) filter.soldAt.$gte = new Date(from)
      if (to)   filter.soldAt.$lte = new Date(to)
    }

    const skip = (page - 1) * limit
    const [sales, total] = await Promise.all([
      Sale.find(filter).sort({ soldAt: -1 }).skip(skip).limit(parseInt(limit)),
      Sale.countDocuments(filter),
    ])

    res.json({ success: true, total, page: parseInt(page), sales })
  } catch (err) {
    next(err)
  }
})

// GET /api/sales/summary — aggregated stats for a period
router.get('/summary', async (req, res, next) => {
  try {
    const { period = 'today' } = req.query
    const now = new Date()
    let from

    if (period === 'today')  from = new Date(now.setHours(0, 0, 0, 0))
    else if (period === 'week')  from = new Date(now - 7 * 86400000)
    else if (period === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1)
    else from = new Date(0)

    const [result] = await Sale.aggregate([
      { $match: { shop: req.user._id, soldAt: { $gte: from } } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalProfit:  { $sum: '$profit' },
        totalSales:   { $sum: 1 },
        totalItems:   { $sum: { $sum: '$items.qty' } },
      }},
    ])

    res.json({ success: true, period, summary: result || { totalRevenue: 0, totalProfit: 0, totalSales: 0, totalItems: 0 } })
  } catch (err) {
    next(err)
  }
})

export default router
