const express = require('express');
const router = express.Router();
const { getAllStocks, getStockByMedicineId, stockIn, stockOut, updateThreshold } = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getAllStocks);
router.post('/stock-in', protect, authorize('pharmacist', 'manager', 'admin'), stockIn);
router.post('/stock-out', protect, authorize('pharmacist', 'manager', 'admin'), stockOut);
router.get('/:medicineId', protect, getStockByMedicineId);
router.put('/:id/threshold', protect, authorize('manager', 'admin'), updateThreshold);

module.exports = router;
