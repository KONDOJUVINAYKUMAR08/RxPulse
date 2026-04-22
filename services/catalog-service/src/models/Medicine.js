const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, default: '' },
    manufacturer: { type: String, required: true },
    category: { type: String, required: true },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ['tablets', 'capsules', 'ml', 'mg', 'strips'],
      default: 'tablets',
    },
    requiresPrescription: { type: Boolean, default: false },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
