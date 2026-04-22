const Medicine = require('../models/Medicine');

// GET /api/catalog/medicines
const getAllMedicines = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const medicines = await Medicine.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: medicines });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/catalog/medicines/search
const searchMedicines = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query is required.' });
    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } },
        { manufacturer: { $regex: q, $options: 'i' } },
      ],
      isActive: true,
    }).limit(20);
    return res.status(200).json({ success: true, data: medicines });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/catalog/medicines/expiring
const getExpiringMedicines = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const medicines = await Medicine.find({
      expiryDate: { $lte: cutoff },
      isActive: true,
    }).sort({ expiryDate: 1 });
    return res.status(200).json({ success: true, data: medicines });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/catalog/medicines/:id
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    return res.status(200).json({ success: true, data: medicine });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/catalog/medicines (manager | admin)
const createMedicine = async (req, res) => {
  try {
    const { name, genericName, manufacturer, category, batchNumber, expiryDate, unitPrice, unit, requiresPrescription, description } = req.body;
    if (!name || !manufacturer || !category || !batchNumber || !expiryDate || unitPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Required fields: name, manufacturer, category, batchNumber, expiryDate, unitPrice.' });
    }
    const medicine = await Medicine.create({ name, genericName, manufacturer, category, batchNumber, expiryDate, unitPrice, unit, requiresPrescription, description });
    return res.status(201).json({ success: true, message: 'Medicine created.', data: medicine });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/catalog/medicines/:id (manager | admin)
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    return res.status(200).json({ success: true, message: 'Medicine updated.', data: medicine });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/catalog/medicines/:id (admin only)
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    return res.status(200).json({ success: true, message: 'Medicine deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllMedicines, searchMedicines, getExpiringMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine };
