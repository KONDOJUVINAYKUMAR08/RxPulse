const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`[user-service] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[user-service] MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
