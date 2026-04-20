import mongoose from 'mongoose'

const saleItemSchema = new mongoose.Schema({
  inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  name:          { type: String, required: true },
  qty:           { type: Number, required: true, min: 1 },
  buyPrice:      { type: Number, required: true },
  sellPrice:     { type: Number, required: true },
}, { _id: false })

const saleSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  items:        [saleItemSchema],
  subtotal:     { type: Number, required: true },
  gst:          { type: Number, default: 0 },
  total:        { type: Number, required: true },
  profit:       { type: Number, default: 0 },
  customerName: { type: String, default: '' },
  paymentMode:  { type: String, default: 'cash', enum: ['cash', 'upi', 'credit'] },
  billNumber:   { type: String },
  soldAt:       { type: Date, default: Date.now, index: true },
}, { timestamps: true })

// Auto-calculate profit
saleSchema.pre('save', function (next) {
  this.profit = this.items.reduce((sum, item) => {
    return sum + (item.sellPrice - item.buyPrice) * item.qty
  }, 0)
  next()
})

// Index for date-range queries
saleSchema.index({ shop: 1, soldAt: -1 })

export default mongoose.model('Sale', saleSchema)
