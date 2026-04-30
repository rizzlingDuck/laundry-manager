const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

/**
 * GET /api/dashboard
 * Returns aggregate statistics for the dashboard
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();

    // Total orders
    const { totalOrders } = db.prepare('SELECT COUNT(*) as totalOrders FROM orders').get();

    // Total revenue
    const { totalRevenue } = db.prepare(
      'SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM orders'
    ).get();

    // Revenue from delivered orders only
    const { deliveredRevenue } = db.prepare(
      "SELECT COALESCE(SUM(total_amount), 0) as deliveredRevenue FROM orders WHERE status = 'DELIVERED'"
    ).get();

    // Orders per status
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'RECEIVED' THEN 1
          WHEN 'PROCESSING' THEN 2
          WHEN 'READY' THEN 3
          WHEN 'DELIVERED' THEN 4
        END
    `).all();

    const ordersByStatus = {};
    for (const row of statusCounts) {
      ordersByStatus[row.status] = row.count;
    }

    // Fill in missing statuses with 0
    for (const status of ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED']) {
      if (!ordersByStatus[status]) ordersByStatus[status] = 0;
    }

    // Today's orders
    const { todayOrders } = db.prepare(
      "SELECT COUNT(*) as todayOrders FROM orders WHERE DATE(created_at) = DATE('now')"
    ).get();

    // Today's revenue
    const { todayRevenue } = db.prepare(
      "SELECT COALESCE(SUM(total_amount), 0) as todayRevenue FROM orders WHERE DATE(created_at) = DATE('now')"
    ).get();

    // Top garment types
    const topGarments = db.prepare(`
      SELECT garment_type, SUM(quantity) as totalQuantity, SUM(subtotal) as totalRevenue
      FROM order_items
      GROUP BY garment_type
      ORDER BY totalQuantity DESC
      LIMIT 5
    `).all();

    // Recent orders (last 10)
    const recentOrders = db.prepare(`
      SELECT order_id, customer_name, phone, status, total_amount, estimated_delivery, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    res.json({
      totalOrders,
      totalRevenue,
      deliveredRevenue,
      ordersByStatus,
      todayOrders,
      todayRevenue,
      topGarments,
      recentOrders,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
