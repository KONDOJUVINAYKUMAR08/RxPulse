require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const medicineRoutes = require('./routes/medicineRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'catalog-service', timestamp: Date.now() });
});

app.use('/api/catalog/medicines', medicineRoutes);
app.use('/api/catalog/categories', categoryRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error('[catalog-service] Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 3002;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[catalog-service] Running on port ${PORT}`);
  });
};

start();
