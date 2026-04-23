const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, verifyToken } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;
