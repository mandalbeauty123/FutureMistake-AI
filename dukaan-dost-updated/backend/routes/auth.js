import express from 'express'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import { protect, signToken } from '../middleware/auth.js'

const router = express.Router()

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeJSON(),
  })
}

// POST /api/auth/register
router.post('/register', [
  body('mobile').matches(/^\d{10}$/).withMessage('Valid 10-digit mobile required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  body('shopName').notEmpty().withMessage('Shop naam required'),
  body('ownerName').notEmpty().withMessage('Owner naam required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { mobile, password, shopName, ownerName, city, address } = req.body

    const existing = await User.findOne({ mobile })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Is mobile number se already account bana hua hai' })
    }

    const user = await User.create({ mobile, password, shopName, ownerName, city, address })
    sendToken(user, 201, res)
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login
router.post('/login', [
  body('mobile').notEmpty().withMessage('Mobile required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { mobile, password } = req.body
    const user = await User.findOne({ mobile }).select('+password')

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Mobile ya password galat hai' })
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated hai' })
    }

    sendToken(user, 200, res)
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() })
})

// PATCH /api/auth/update
router.patch('/update', protect, async (req, res, next) => {
  try {
    const allowed = ['shopName', 'ownerName', 'city', 'address', 'gstin', 'language']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    res.json({ success: true, user: user.toSafeJSON() })
  } catch (err) {
    next(err)
  }
})

export default router
