import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { rateLimit } from 'express-rate-limit'
import { connectDB } from './config/db.js'

// Routes
import authRoutes      from './routes/auth.js'
import inventoryRoutes from './routes/inventory.js'
import salesRoutes     from './routes/sales.js'
import dashboardRoutes from './routes/dashboard.js'
import aiRoutes        from './routes/ai.js'
import alertRoutes     from './routes/alerts.js'
import hindsightRoutes from './routes/hindsight.js'
import billingRoutes   from './routes/billing.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// ── Connect Database ─────────────────────────────────────
connectDB()

// ── Global Middleware ────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ── Rate Limiting ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
})
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { success: false, message: 'AI request limit reached. Ek minute mein phir try karo.' }
})
app.use('/api/', limiter)
app.use('/api/ai/', aiLimiter)

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/sales',     salesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/ai',        aiRoutes)
app.use('/api/alerts',    alertRoutes)
app.use('/api/hindsight', hindsightRoutes)
app.use('/api/billing',   billingRoutes)

// ── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Dukaan Dost API is live 🏪', timestamp: new Date().toISOString() })
})

// ── 404 handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// ── Global error handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏪  Dukaan Dost API running on port ${PORT}`)
  console.log(`   Environment : ${process.env.NODE_ENV}`)
  console.log(`   DB          : ${process.env.MONGODB_URI?.split('@')[1] || 'localhost'}\n`)
})

export default app
