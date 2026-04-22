const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    medicineId: { type: String, required: true, unique: true },
    medicineName: { type: String, required: true },
    category: { type: String, default: '' },
    currentQuantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'tablets' },
    threshold: { type: Number, required: true, default: 20 },
    location: { type: String, default: 'Main Warehouse' },
    isLowStock: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stock', stockSchema);
