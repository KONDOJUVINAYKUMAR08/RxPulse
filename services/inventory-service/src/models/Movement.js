const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema(
  {
    medicineId: { type: String, required: true },
    medicineName: { type: String, required: true },
    type: { type: String, enum: ['STOCK_IN', 'STOCK_OUT'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, default: '' },
    supplierName: { type: String, default: '' },
    batchNumber: { type: String, default: '' },
    performedBy: { type: String, required: true },
    performedByName: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movement', movementSchema);
