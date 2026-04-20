import express from 'express'
import Sale from '../models/Sale.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

// POST /api/billing — create a bill (wraps sale creation with bill metadata)
router.post('/', async (req, res, next) => {
  try {
    const { items, customerName, paymentMode = 'cash', includeGst = true } = req.body

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'Bill mein koi item nahi hai' })
    }

    const subtotal = items.reduce((s, i) => s + i.sellPrice * i.qty, 0)
    const gst      = includeGst ? Math.round(subtotal * 0.05) : 0
    const total    = subtotal + gst
    const billNumber = `DD-${Date.now().toString().slice(-8)}`

    const sale = await Sale.create({
      shop: req.user._id,
      items: items.map(i => ({
        name: i.name,
        qty: i.qty,
        buyPrice: i.buyPrice || 0,
        sellPrice: i.sellPrice,
        inventoryItem: i.inventoryItem,
      })),
      subtotal,
      gst,
      total,
      customerName: customerName || '',
      paymentMode,
      billNumber,
    })

    res.status(201).json({
      success: true,
      bill: {
        billNumber,
        items: sale.items,
        subtotal,
        gst,
        total,
        customerName,
        paymentMode,
        shopName: req.user.shopName,
        ownerName: req.user.ownerName,
        city: req.user.city,
        date: sale.soldAt,
      }
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/billing — list recent bills
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query
    const skip = (page - 1) * limit
    const bills = await Sale.find({ shop: req.user._id })
      .sort({ soldAt: -1 }).skip(skip).limit(parseInt(limit))
      .select('billNumber total profit items customerName paymentMode soldAt')

    res.json({ success: true, bills })
  } catch (err) {
    next(err)
  }
})

// GET /api/billing/:billNumber — get single bill
router.get('/:billNumber', async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ shop: req.user._id, billNumber: req.params.billNumber })
    if (!sale) return res.status(404).json({ success: false, message: 'Bill nahi mila' })

    res.json({
      success: true,
      bill: {
        ...sale.toObject(),
        shopName: req.user.shopName,
        ownerName: req.user.ownerName,
        city: req.user.city,
      }
    })
  } catch (err) {
    next(err)
  }
})

export default router
