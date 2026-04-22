const Movement = require('../models/Movement');

// GET /api/inventory/movements
const getMovements = async (req, res) => {
  try {
    const { type, medicineId, startDate, endDate, limit = 100 } = req.query;
    const filter = {};
    if (type && ['STOCK_IN', 'STOCK_OUT'].includes(type)) filter.type = type;
    if (medicineId) filter.medicineId = medicineId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const movements = await Movement.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit));
    return res.status(200).json({ success: true, data: movements });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMovements };
