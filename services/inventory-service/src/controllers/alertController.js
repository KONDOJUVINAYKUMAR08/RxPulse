const Alert = require('../models/Alert');
const Movement = require('../models/Movement');
const Stock = require('../models/Stock');

// GET /api/inventory/alerts
const getAllAlerts = async (req, res) => {
  try {
    const { alertType, isResolved } = req.query;
    const filter = {};
    if (alertType) filter.alertType = alertType;
    if (isResolved !== undefined) filter.isResolved = isResolved === 'true';
    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: alerts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/inventory/alerts/active
const getActiveAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ isResolved: false }).sort({ severity: 1, createdAt: -1 });
    return res.status(200).json({ success: true, data: alerts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inventory/alerts/:id/resolve
const resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, resolvedBy: req.user.name || req.user.id, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    return res.status(200).json({ success: true, message: 'Alert resolved.', data: alert });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/inventory/reports/monthly
const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const movements = await Movement.find({ date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 });

    const totalIn = movements.filter((mv) => mv.type === 'STOCK_IN').reduce((s, mv) => s + mv.quantity, 0);
    const totalOut = movements.filter((mv) => mv.type === 'STOCK_OUT').reduce((s, mv) => s + mv.quantity, 0);

    // Daily aggregation
    const dailyMap = {};
    for (const mv of movements) {
      const day = new Date(mv.date).getDate();
      if (!dailyMap[day]) dailyMap[day] = { day, stockIn: 0, stockOut: 0 };
      if (mv.type === 'STOCK_IN') dailyMap[day].stockIn += mv.quantity;
      else dailyMap[day].stockOut += mv.quantity;
    }
    const dailyData = Object.values(dailyMap).sort((a, b) => a.day - b.day);

    // Top 5 medicines by movement
    const medicineMap = {};
    for (const mv of movements) {
      if (!medicineMap[mv.medicineName]) medicineMap[mv.medicineName] = { name: mv.medicineName, total: 0 };
      medicineMap[mv.medicineName].total += mv.quantity;
    }
    const topMedicines = Object.values(medicineMap).sort((a, b) => b.total - a.total).slice(0, 5);

    return res.status(200).json({
      success: true,
      data: { totalIn, totalOut, netChange: totalIn - totalOut, dailyData, topMedicines, movements },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/inventory/reports/stats
const getStats = async (req, res) => {
  try {
    const totalStocks = await Stock.countDocuments();
    const lowStockCount = await Stock.countDocuments({ isLowStock: true });
    const activeAlerts = await Alert.countDocuments({ isResolved: false });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMovements = await Movement.countDocuments({ date: { $gte: today } });

    return res.status(200).json({
      success: true,
      data: { totalStocks, lowStockCount, activeAlerts, todayMovements },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllAlerts, getActiveAlerts, resolveAlert, getMonthlyReport, getStats };
