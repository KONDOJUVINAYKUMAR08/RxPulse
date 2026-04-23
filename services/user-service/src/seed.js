require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-user:27017/users_db';

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[user-service] Connected to users_db for seeding');

    const adminExists = await User.findOne({ email: 'admin@rxpulse.com' });
    if (!adminExists) {
      const adminHash = await bcrypt.hash('Admin@123', 12);
      await User.create({
        name: 'Admin User',
        email: 'admin@rxpulse.com',
        password: adminHash,
        role: 'admin',
        phone: '9999999999',
        isActive: true,
      });
      console.log('[user-service] Admin user created: admin@rxpulse.com');
    } else {
      console.log('[user-service] Admin user already exists, skipping.');
    }

    const raviExists = await User.findOne({ email: 'ravi@example.com' });
    if (!raviExists) {
      const hash1 = await bcrypt.hash('User@123', 12);
      await User.create({
        name: 'Ravi Kumar',
        email: 'ravi@example.com',
        password: hash1,
        role: 'customer',
        phone: '9876543210',
        isActive: true,
      });
      console.log('[user-service] Sample customer created: ravi@example.com');
    }

    const priyaExists = await User.findOne({ email: 'priya@example.com' });
    if (!priyaExists) {
      const hash2 = await bcrypt.hash('User@123', 12);
      await User.create({
        name: 'Priya Singh',
        email: 'priya@example.com',
        password: hash2,
        role: 'customer',
        phone: '9123456789',
        isActive: true,
      });
      console.log('[user-service] Sample customer created: priya@example.com');
    }

    console.log('[user-service] Seed completed successfully.');
  } catch (err) {
    console.error('[user-service] Seed error:', err.message);
  }
};

module.exports = seedUsers;
