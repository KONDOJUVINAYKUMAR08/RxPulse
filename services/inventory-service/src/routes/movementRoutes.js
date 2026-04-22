const express = require('express');
const router = express.Router();
const { getMovements } = require('../controllers/movementController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMovements);

module.exports = router;
