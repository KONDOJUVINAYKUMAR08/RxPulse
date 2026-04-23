require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const seedUsers = require('./seed');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'user-service', timestamp: Date.now() });
});

app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error('[user-service] Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 3001;

const start = async () => {
  await connectDB();
  await seedUsers();
  app.listen(PORT, () => {
    console.log(`[user-service] Running on port ${PORT}`);
  });
};

start();
