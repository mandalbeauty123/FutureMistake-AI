import mongoose from 'mongoose'

const hindsightSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['purchase', 'price_change', 'promo', 'restock', 'disposal', 'other'],
  },
  product:   { type: String, required: true },
  action:    { type: String, required: true },
  context: {
    season:   String,
    festival: String,
    weekday:  Number,
    month:    Number,
    weather:  String,
  },
  outcome: {
    profit:     { type: Number, default: 0 },
    units_sold: { type: Number, default: 0 },
    days_to_clear: Number,
    verdict:    { type: String, enum: ['good', 'bad', 'neutral'], default: 'neutral' },
    notes:      String,
  },
  // Numeric feature vector for similarity search (stored as flat array)
  embedding: [Number],
  aiSummary: String,   // AI-generated one-line summary stored for fast retrieval
}, { timestamps: true })

hindsightSchema.index({ shop: 1, createdAt: -1 })
hindsightSchema.index({ shop: 1, product: 'text' })

export default mongoose.model('Hindsight', hindsightSchema)
