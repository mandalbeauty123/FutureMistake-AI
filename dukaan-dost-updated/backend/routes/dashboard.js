import express from 'express'
import Sale from '../models/Sale.js'
import Inventory from '../models/Inventory.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const shopId = req.user._id
    const now = new Date()
    const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart   = new Date(now - 7 * 86400000)
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1)
    const yesterdayStart = new Date(todayStart - 86400000)

    // Run all queries in parallel
    const [todayAgg, yesterdayAgg, weekAgg, monthAgg, topProducts, invStats, weekChart] = await Promise.all([
      // Today
      Sale.aggregate([
        { $match: { shop: shopId, soldAt: { $gte: todayStart } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, profit: { $sum: '$profit' }, sales: { $sum: 1 }, items: { $sum: { $sum: '$items.qty' } } } }
      ]),
      // Yesterday
      Sale.aggregate([
        { $match: { shop: shopId, soldAt: { $gte: yesterdayStart, $lt: todayStart } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, profit: { $sum: '$profit' }, sales: { $sum: 1 } } }
      ]),
      // Week
      Sale.aggregate([
        { $match: { shop: shopId, soldAt: { $gte: weekStart } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, profit: { $sum: '$profit' }, sales: { $sum: 1 } } }
      ]),
      // Month
      Sale.aggregate([
        { $match: { shop: shopId, soldAt: { $gte: monthStart } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, profit: { $sum: '$profit' }, sales: { $sum: 1 } } }
      ]),
      // Top products by profit (this month)
      Sale.aggregate([
        { $match: { shop: shopId, soldAt: { $gte: monthStart } } },
        { $unwind: '$items' },
        { $group: {
          _id: '$items.name',
          totalProfit:  { $sum: { $multiply: [{ $subtract: ['$items.sellPrice','$items.buyPrice'] }, '$items.qty'] } },
          totalUnits:   { $sum: '$items.qty' },
          totalRevenue: { $sum: { $multiply: ['$items.sellPrice','$items.qty'] } },
        }},
        { $sort: { totalProfit: -1 } },
        { $limit: 5 },
      ]),
      // Inventory summary
      Inventory.aggregate([
        { $match: { shop: shopId, isActive: true } },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$buyPrice','$stock'] } },
          lowStock: { $sum: { $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0] } },
        }}
      ]),
      // Last 7 days chart
      Sale.aggregate([
        { $match: { shop: shopId, soldAt: { $gte: weekStart } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$soldAt' } },
          revenue: { $sum: '$total' },
          profit:  { $sum: '$profit' },
        }},
        { $sort: { _id: 1 } },
      ]),
    ])

    const today     = todayAgg[0]     || { revenue: 0, profit: 0, sales: 0, items: 0 }
    const yesterday = yesterdayAgg[0] || { revenue: 0, profit: 0, sales: 0 }
    const week      = weekAgg[0]      || { revenue: 0, profit: 0, sales: 0 }
    const month     = monthAgg[0]     || { revenue: 0, profit: 0, sales: 0 }
    const inv       = invStats[0]     || { total: 0, totalValue: 0, lowStock: 0 }

    const deltaRevenue = yesterday.revenue > 0
      ? Math.round(((today.revenue - yesterday.revenue) / yesterday.revenue) * 100)
      : 0

    res.json({
      success: true,
      today: { ...today, deltaRevenue },
      yesterday,
      week,
      month,
      topProducts,
      inventory: inv,
      weekChart,
    })
  } catch (err) {
    next(err)
  }
})

export default router
