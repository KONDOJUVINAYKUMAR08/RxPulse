const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  let retries = 5;

  while (retries) {
    try {
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('[catalog-service] MongoDB connected successfully');
      return;
    } catch (err) {
      retries -= 1;
      console.error(`[catalog-service] MongoDB connection failed. Retries left: ${retries}`, err.message);
      if (retries === 0) {
        console.error('[catalog-service] Could not connect to MongoDB. Exiting.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};

module.exports = connectDB;
