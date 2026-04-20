import express from 'express'
import Inventory from '../models/Inventory.js'
import Sale from '../models/Sale.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

// GET /api/alerts — compute and return all active alerts for a shop
router.get('/', async (req, res, next) => {
  try {
    const shopId = req.user._id
    const alerts = []

    // 1. Low/critical stock alerts
    const lowItems = await Inventory.find({ shop: shopId, isActive: true })
    for (const item of lowItems) {
      if (item.stockStatus === 'critical') {
        alerts.push({
          type: 'danger',
          icon: '⚠️',
          title: 'Critical Stock',
          message: `${item.name} sirf ${item.stock} ${item.unit} bache hain — aaj reorder karo!`,
          product: item.name,
          action: 'reorder',
        })
      } else if (item.stockStatus === 'low') {
        alerts.push({
          type: 'warn',
          icon: '📦',
          title: 'Low Stock',
          message: `${item.name} ka stock low hai (${item.stock} ${item.unit}) — watchlist mein rakho.`,
          product: item.name,
          action: 'watchlist',
        })
      }
    }

    // 2. Dead stock alerts — items not sold in 10+ days
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000)
    const recentlySold = await Sale.distinct('items.name', { shop: shopId, soldAt: { $gte: tenDaysAgo } })
    const deadStock = lowItems.filter(
      item => item.stock > 0 && !recentlySold.includes(item.name)
    )
    for (const item of deadStock) {
      alerts.push({
        type: 'warn',
        icon: '🕐',
        title: 'Dead Stock',
        message: `${item.name} kaafi din se nahi bika (${item.stock} units stuck) — combo offer ya discount try karo.`,
        product: item.name,
        action: 'promo',
      })
    }

    // 3. Festival/seasonal alert (static for now, can be dynamic with a calendar API)
    const month = new Date().getMonth() + 1
    const day   = new Date().getDate()
    if (month === 4 && day >= 18 && day <= 25) {
      alerts.unshift({
        type: 'success',
        icon: '🪔',
        title: 'Festival Alert',
        message: 'Akshaya Tritiya aane wala hai! Pooja samagri, mithai, dry fruits ka stock badhao — demand 3x hogi.',
        action: 'stock_up',
      })
    }

    // 4. Hindsight insight (placeholder — real one would pull from Hindsight model)
    alerts.push({
      type: 'info',
      icon: '💡',
      title: 'Hindsight Insight',
      message: 'Pichle saal is season mein dairy products ka profit 28% zyada tha. Amul range ka stock maintain karo.',
      action: 'insight',
    })

    res.json({ success: true, count: alerts.length, alerts })
  } catch (err) {
    next(err)
  }
})

export default router
