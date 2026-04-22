const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    medicineId: { type: String, required: true },
    medicineName: { type: String, required: true },
    alertType: { type: String, enum: ['LOW_STOCK', 'EXPIRY'], required: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['CRITICAL', 'WARNING', 'INFO'],
      default: 'WARNING',
    },
    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: String, default: '' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
