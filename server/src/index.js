const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists for SQLite
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const { getDb } = require('./db');
const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// --- Edge case: limit JSON body size to prevent payload abuse ---
app.use(express.json({ limit: '1mb' }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// --- Edge case: global error handler for malformed JSON ---
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }
  next(err);
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (require JWT)
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Garment pricing (public - so frontend can display before login)
const { GARMENT_PRICES, PROCESSING_DAYS } = require('./config/pricing');
app.get('/api/pricing', (req, res) => {
  res.json({
    garments: Object.entries(GARMENT_PRICES).map(([type, price]) => ({
      type,
      price,
      processingDays: PROCESSING_DAYS[type] || 2,
    })),
  });
});

// --- Edge case: 404 handler for unknown API routes ---
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// --- Edge case: global unhandled error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Initialize DB on startup
getDb();

const server = app.listen(PORT, () => {
  console.log(`\n🧺 Laundry Manager API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Pricing: http://localhost:${PORT}/api/pricing\n`);
});

// --- Edge case: graceful shutdown to close DB connection ---
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    try {
      const db = getDb();
      db.close();
      console.log('Database connection closed.');
    } catch (e) { /* DB may already be closed */ }
    process.exit(0);
  });
  // Force close after 5 seconds
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
