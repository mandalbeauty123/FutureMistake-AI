import mongoose from 'mongoose'

const inventorySchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name:      { type: String, required: true, trim: true },
  category: {
    type: String,
    default: 'Other',
    enum: ['Dairy','Grains','Spices','Snacks','Beverages','Cleaning','Personal Care','Other'],
  },
  buyPrice:  { type: Number, required: true, min: 0 },
  sellPrice: { type: Number, required: true, min: 0 },
  stock:     { type: Number, default: 0, min: 0 },
  unit:      { type: String, default: 'units' },
  minStock:  { type: Number, default: 10 },   // threshold for low-stock alert
  barcode:   { type: String, default: '' },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true })

// Virtual: margin %
inventorySchema.virtual('margin').get(function () {
  return this.sellPrice > 0 ? Math.round(((this.sellPrice - this.buyPrice) / this.sellPrice) * 100) : 0
})

// Virtual: stock status
inventorySchema.virtual('stockStatus').get(function () {
  if (this.stock <= 0)             return 'out'
  if (this.stock <= this.minStock * 0.5) return 'critical'
  if (this.stock <= this.minStock) return 'low'
  return 'high'
})

inventorySchema.set('toJSON', { virtuals: true })
inventorySchema.set('toObject', { virtuals: true })

// Compound index for fast shop+name lookups
inventorySchema.index({ shop: 1, name: 1 })

export default mongoose.model('Inventory', inventorySchema)
