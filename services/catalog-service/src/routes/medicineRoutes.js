const express = require('express');
const router = express.Router();
const {
  getAllMedicines,
  searchMedicines,
  getExpiringMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/search', protect, searchMedicines);
router.get('/expiring', protect, getExpiringMedicines);
router.get('/', protect, getAllMedicines);
router.get('/:id', protect, getMedicineById);
router.post('/', protect, authorize('manager', 'admin'), createMedicine);
router.put('/:id', protect, authorize('manager', 'admin'), updateMedicine);
router.delete('/:id', protect, authorize('admin'), deleteMedicine);

module.exports = router;
