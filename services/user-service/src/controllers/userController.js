const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
});

// POST /api/users/register
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
      role: 'customer',
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { token, user: formatUser(user) },
    });
  } catch (err) {
    console.error('[register]', err.message);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// POST /api/users/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { token, user: formatUser(user) },
    });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, data: { user: formatUser(user) } });
  } catch (err) {
    console.error('[getProfile]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, message: 'Profile updated successfully.', data: { user: formatUser(user) } });
  } catch (err) {
    console.error('[updateProfile]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// GET /api/users/verify
const verifyToken = (req, res) => {
  return res.status(200).json({ success: true, message: 'Token is valid.', data: { user: req.user } });
};

module.exports = { register, login, getProfile, updateProfile, verifyToken };
