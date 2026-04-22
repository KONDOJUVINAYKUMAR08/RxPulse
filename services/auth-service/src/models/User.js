const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['pharmacist', 'manager', 'admin'],
      default: 'pharmacist',
    },
    department: { type: String, default: 'General' },
    phone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return safe user object (no password)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

// Seed default admin on startup
const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ email: 'admin@rxpulse.com' });
    if (!existing) {
      await User.create({
        name: 'Admin User',
        email: 'admin@rxpulse.com',
        password: 'Admin@123',
        role: 'admin',
        department: 'Administration',
      });
      console.log('[auth-service] Default admin user seeded: admin@rxpulse.com');
    }
  } catch (err) {
    console.error('[auth-service] Admin seed error:', err.message);
  }
};

module.exports = { User, seedAdmin };
