import express from 'express'
import { body, validationResult } from 'express-validator'
import Inventory from '../models/Inventory.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
router.use(protect)

// GET /api/inventory — list all items for this shop
router.get('/', async (req, res, next) => {
  try {
    const { category, status, q } = req.query
    const filter = { shop: req.user._id, isActive: true }
    if (category && category !== 'All') filter.category = category
    if (q) filter.name = { $regex: q, $options: 'i' }

    let items = await Inventory.find(filter).sort({ updatedAt: -1 })

    // Apply stock status filter after retrieval (virtual field)
    if (status && status !== 'all') {
      items = items.filter(i => i.stockStatus === status)
    }

    res.json({ success: true, count: items.length, items })
  } catch (err) {
    next(err)
  }
})

// POST /api/inventory — add item
router.post('/', [
  body('name').notEmpty().withMessage('Product naam required'),
  body('buyPrice').isFloat({ min: 0 }).withMessage('Buy price required'),
  body('sellPrice').isFloat({ min: 0 }).withMessage('Sell price required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    // Check duplicate
    const exists = await Inventory.findOne({ shop: req.user._id, name: req.body.name, isActive: true })
    if (exists) {
      return res.status(409).json({ success: false, message: 'Is naam ka product already hai' })
    }

    const item = await Inventory.create({ shop: req.user._id, ...req.body })
    res.status(201).json({ success: true, item })
  } catch (err) {
    next(err)
  }
})

// PUT /api/inventory/:id — update item
router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['name','category','buyPrice','sellPrice','stock','unit','minStock','barcode']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, shop: req.user._id },
      updates,
      { new: true, runValidators: true }
    )
    if (!item) return res.status(404).json({ success: false, message: 'Item nahi mila' })

    res.json({ success: true, item })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/inventory/:id/stock — quick stock update
router.patch('/:id/stock', async (req, res, next) => {
  try {
    const { qty, operation = 'set' } = req.body // operation: 'set' | 'add' | 'subtract'

    const item = await Inventory.findOne({ _id: req.params.id, shop: req.user._id })
    if (!item) return res.status(404).json({ success: false, message: 'Item nahi mila' })

    if (operation === 'add')      item.stock += qty
    else if (operation === 'subtract') item.stock = Math.max(0, item.stock - qty)
    else                          item.stock = qty

    await item.save()
    res.json({ success: true, item })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/inventory/:id — soft delete
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, shop: req.user._id },
      { isActive: false },
      { new: true }
    )
    if (!item) return res.status(404).json({ success: false, message: 'Item nahi mila' })
    res.json({ success: true, message: 'Item delete ho gaya' })
  } catch (err) {
    next(err)
  }
})

export default router
