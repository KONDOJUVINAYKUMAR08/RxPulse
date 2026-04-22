const Stock = require('../models/Stock');
const Movement = require('../models/Movement');
const Alert = require('../models/Alert');

// Helper: create low stock alert if needed
const checkAndCreateAlert = async (stock) => {
  if (stock.currentQuantity <= stock.threshold) {
    stock.isLowStock = true;
    const existing = await Alert.findOne({ medicineId: stock.medicineId, alertType: 'LOW_STOCK', isResolved: false });
    if (!existing) {
      const severity = stock.currentQuantity === 0 ? 'CRITICAL' : 'WARNING';
      await Alert.create({
        medicineId: stock.medicineId,
        medicineName: stock.medicineName,
        alertType: 'LOW_STOCK',
        message: `${stock.medicineName} is low on stock. Current: ${stock.currentQuantity} ${stock.unit}, Threshold: ${stock.threshold}.`,
        severity,
      });
    }
  } else {
    stock.isLowStock = false;
    // Auto-resolve existing LOW_STOCK alert
    await Alert.updateMany(
      { medicineId: stock.medicineId, alertType: 'LOW_STOCK', isResolved: false },
      { isResolved: true, resolvedAt: new Date(), resolvedBy: 'system' }
    );
  }
};

// GET /api/inventory/stocks
const getAllStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ medicineName: 1 });
    return res.status(200).json({ success: true, data: stocks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/inventory/stocks/:medicineId
const getStockByMedicineId = async (req, res) => {
  try {
    const stock = await Stock.findOne({ medicineId: req.params.medicineId });
    if (!stock) return res.status(404).json({ success: false, message: 'Stock record not found.' });
    return res.status(200).json({ success: true, data: stock });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/inventory/stocks/stock-in
const stockIn = async (req, res) => {
  try {
    const { medicineId, medicineName, category, quantity, unit, supplierName, batchNumber, reason } = req.body;
    if (!medicineId || !medicineName || !quantity) {
      return res.status(400).json({ success: false, message: 'medicineId, medicineName, and quantity are required.' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0.' });
    }

    let stock = await Stock.findOne({ medicineId });
    if (!stock) {
      stock = new Stock({ medicineId, medicineName, category, unit, currentQuantity: 0 });
    }
    stock.currentQuantity += Number(quantity);
    stock.lastUpdated = new Date();
    stock.medicineName = medicineName;
    if (category) stock.category = category;
    if (unit) stock.unit = unit;

    await checkAndCreateAlert(stock);
    await stock.save();

    await Movement.create({
      medicineId,
      medicineName,
      type: 'STOCK_IN',
      quantity: Number(quantity),
      reason,
      supplierName,
      batchNumber,
      performedBy: req.user.id,
      performedByName: req.user.name,
    });

    return res.status(200).json({ success: true, message: 'Stock in recorded.', data: stock });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/inventory/stocks/stock-out
const stockOut = async (req, res) => {
  try {
    const { medicineId, medicineName, quantity, reason } = req.body;
    if (!medicineId || !medicineName || !quantity) {
      return res.status(400).json({ success: false, message: 'medicineId, medicineName, and quantity are required.' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0.' });
    }

    const stock = await Stock.findOne({ medicineId });
    if (!stock) return res.status(404).json({ success: false, message: 'No stock record found for this medicine.' });
    if (stock.currentQuantity < Number(quantity)) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${stock.currentQuantity}.` });
    }

    stock.currentQuantity -= Number(quantity);
    stock.lastUpdated = new Date();

    await checkAndCreateAlert(stock);
    await stock.save();

    await Movement.create({
      medicineId,
      medicineName,
      type: 'STOCK_OUT',
      quantity: Number(quantity),
      reason,
      performedBy: req.user.id,
      performedByName: req.user.name,
    });

    return res.status(200).json({ success: true, message: 'Stock out recorded.', data: stock });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/inventory/stocks/:id/threshold
const updateThreshold = async (req, res) => {
  try {
    const { threshold } = req.body;
    if (threshold === undefined || threshold < 0) {
      return res.status(400).json({ success: false, message: 'Valid threshold is required.' });
    }
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });
    stock.threshold = Number(threshold);
    await checkAndCreateAlert(stock);
    await stock.save();
    return res.status(200).json({ success: true, message: 'Threshold updated.', data: stock });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllStocks, getStockByMedicineId, stockIn, stockOut, updateThreshold };
