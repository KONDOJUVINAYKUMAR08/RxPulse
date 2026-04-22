require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const stockRoutes = require('./routes/stockRoutes');
const movementRoutes = require('./routes/movementRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'inventory-service', timestamp: Date.now() });
});

app.use('/api/inventory/stocks', stockRoutes);
app.use('/api/inventory/movements', movementRoutes);
app.use('/api/inventory/alerts', alertRoutes);

// Reports and stats are served through alert routes (mounted at /api/inventory/alerts)
// Additional top-level mounts for cleaner URL access per spec
app.use('/api/inventory/reports', (req, res, next) => {
  req.url = '/reports' + req.url;
  next();
}, alertRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error('[inventory-service] Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 3003;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[inventory-service] Running on port ${PORT}`);
  });
};

start();
