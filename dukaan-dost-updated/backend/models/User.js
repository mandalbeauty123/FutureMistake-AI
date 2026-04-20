import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: [true, 'Mobile number required'],
    unique: true,
    trim: true,
    match: [/^\d{10}$/, 'Invalid mobile number'],
  },
  password: {
    type: String,
    required: [true, 'Password required'],
    minlength: 6,
    select: false,
  },
  ownerName:  { type: String, required: true, trim: true },
  shopName:   { type: String, required: true, trim: true },
  city:       { type: String, default: '', trim: true },
  address:    { type: String, default: '' },
  gstin:      { type: String, default: '' },
  language:   { type: String, default: 'hi', enum: ['hi', 'en'] },
  plan:       { type: String, default: 'free', enum: ['free', 'pro'] },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

// Strip sensitive fields from JSON
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.model('User', userSchema)
