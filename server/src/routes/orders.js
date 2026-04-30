const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { GARMENT_PRICES, PROCESSING_DAYS, DEFAULT_PROCESSING_DAYS } = require('../config/pricing');

const router = express.Router();

/**
 * Helper: Generate a unique order ID with collision retry
 */
function generateOrderId(db, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    const orderId = 'ORD-' + uuidv4().slice(0, 8).toUpperCase();
    const existing = db.prepare('SELECT 1 FROM orders WHERE order_id = ?').get(orderId);
    if (!existing) return orderId;
  }
  // Fallback: use full UUID to guarantee uniqueness
  return 'ORD-' + uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
}

/**
 * Helper: Sanitize pagination params
 */
function sanitizePagination(page, limit) {
  let p = parseInt(page);
  let l = parseInt(limit);
  if (isNaN(p) || p < 1) p = 1;
  if (isNaN(l) || l < 1) l = 20;
  if (l > 100) l = 100; // Cap max page size to prevent abuse
  return { page: p, limit: l };
}

/**
 * POST /api/orders
 * Create a new order
 * Body: { customerName, phone, items: [{ garmentType, quantity, pricePerItem? }] }
 */
router.post('/', (req, res) => {
  try {
    const { customerName, phone, items } = req.body || {};

    // --- Edge case: missing body entirely ---
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required.' });
    }

    // --- Edge case: trim whitespace before checking emptiness ---
    const trimmedName = (customerName || '').trim();
    const trimmedPhone = (phone || '').trim();

    if (!trimmedName || !trimmedPhone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'customerName, phone, and items (non-empty array) are required.',
      });
    }

    // --- Edge case: customer name length limits ---
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Customer name must be at least 2 characters.' });
    }
    if (trimmedName.length > 100) {
      return res.status(400).json({ error: 'Customer name must be under 100 characters.' });
    }

    // --- Edge case: phone validation ---
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({ error: 'Phone must be a 10-digit number.' });
    }

    // --- Edge case: limit number of items per order ---
    if (items.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 items per order.' });
    }

    const db = getDb();
    const orderId = generateOrderId(db);

    // Calculate estimated delivery (max processing days among items + 1 buffer day)
    let maxDays = 0;
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      // --- Edge case: ensure garmentType is a non-empty string ---
      if (!item.garmentType || typeof item.garmentType !== 'string' || !item.garmentType.trim()) {
        return res.status(400).json({
          error: 'Invalid item: each item needs a valid garmentType.',
        });
      }

      // --- Edge case: coerce and validate quantity ---
      const quantity = parseInt(item.quantity);
      if (isNaN(quantity) || quantity < 1) {
        return res.status(400).json({
          error: `Invalid quantity for "${item.garmentType}". Must be a positive integer.`,
        });
      }
      if (quantity > 999) {
        return res.status(400).json({
          error: `Quantity for "${item.garmentType}" exceeds maximum of 999.`,
        });
      }

      // --- Edge case: validate pricePerItem if provided ---
      let pricePerItem;
      if (item.pricePerItem !== undefined && item.pricePerItem !== null) {
        pricePerItem = parseFloat(item.pricePerItem);
        if (isNaN(pricePerItem) || pricePerItem < 0) {
          return res.status(400).json({
            error: `Invalid price for "${item.garmentType}". Must be a non-negative number.`,
          });
        }
      } else {
        pricePerItem = GARMENT_PRICES[item.garmentType.trim()];
      }

      if (pricePerItem === undefined || pricePerItem === null) {
        return res.status(400).json({
          error: `Unknown garment type "${item.garmentType}". Provide a pricePerItem or use a known type.`,
          availableTypes: Object.keys(GARMENT_PRICES),
        });
      }

      // --- Edge case: floating point precision ---
      const subtotal = Math.round(pricePerItem * quantity * 100) / 100;
      totalAmount += subtotal;

      const days = PROCESSING_DAYS[item.garmentType.trim()] || DEFAULT_PROCESSING_DAYS;
      if (days > maxDays) maxDays = days;

      processedItems.push({
        garmentType: item.garmentType.trim(),
        quantity,
        pricePerItem,
        subtotal,
      });
    }

    // --- Edge case: round total to 2 decimal places ---
    totalAmount = Math.round(totalAmount * 100) / 100;

    // Estimated delivery = now + maxDays + 1 buffer
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + maxDays + 1);
    const estimatedDeliveryStr = estimatedDelivery.toISOString().split('T')[0];

    // Insert order
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_id, customer_name, phone, status, estimated_delivery, total_amount)
      VALUES (?, ?, ?, 'RECEIVED', ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, garment_type, quantity, price_per_item, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertOrder.run(orderId, trimmedName, trimmedPhone, estimatedDeliveryStr, totalAmount);
      for (const item of processedItems) {
        insertItem.run(orderId, item.garmentType, item.quantity, item.pricePerItem, item.subtotal);
      }
    });

    transaction();

    res.status(201).json({
      message: 'Order created successfully.',
      order: {
        orderId,
        customerName: trimmedName,
        phone: trimmedPhone,
        status: 'RECEIVED',
        items: processedItems,
        totalAmount,
        estimatedDelivery: estimatedDeliveryStr,
      },
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/orders
 * List all orders with optional filters
 * Query params: status, customer, phone, garment, page, limit
 */
router.get('/', (req, res) => {
  try {
    const { status, customer, phone, garment } = req.query;
    const db = getDb();

    // --- Edge case: sanitize pagination ---
    const { page, limit } = sanitizePagination(req.query.page, req.query.limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    // --- Edge case: validate status filter against known values ---
    if (status) {
      const validStatuses = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];
      const upperStatus = status.toUpperCase();
      if (!validStatuses.includes(upperStatus)) {
        return res.status(400).json({
          error: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
      whereClause += ' AND o.status = ?';
      params.push(upperStatus);
    }

    if (customer) {
      whereClause += ' AND o.customer_name LIKE ?';
      params.push(`%${customer.trim()}%`);
    }

    if (phone) {
      whereClause += ' AND o.phone LIKE ?';
      params.push(`%${phone.trim()}%`);
    }

    // If filtering by garment, join with order_items
    let joinClause = '';
    if (garment) {
      joinClause = ' INNER JOIN order_items oi ON o.order_id = oi.order_id';
      whereClause += ' AND oi.garment_type LIKE ?';
      params.push(`%${garment.trim()}%`);
    }

    const offset = (page - 1) * limit;

    // Count total matching orders
    const countQuery = `SELECT COUNT(DISTINCT o.id) as total FROM orders o ${joinClause} ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    // Fetch orders
    const ordersQuery = `
      SELECT DISTINCT o.* FROM orders o ${joinClause} ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const orders = db.prepare(ordersQuery).all(...params, limit, offset);

    // Fetch items for each order
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: getItems.all(order.order_id),
    }));

    res.json({
      orders: ordersWithItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/orders/pricing
 * Get available garment types and pricing
 */
router.get('/pricing', (req, res) => {
  res.json({
    garments: Object.entries(GARMENT_PRICES).map(([type, price]) => ({
      type,
      price,
      processingDays: PROCESSING_DAYS[type] || DEFAULT_PROCESSING_DAYS,
    })),
  });
});

/**
 * GET /api/orders/:id
 * Get single order by order_id
 */
router.get('/:id', (req, res) => {
  try {
    // --- Edge case: validate order ID format ---
    const orderId = req.params.id;
    if (!orderId || typeof orderId !== 'string' || orderId.length > 20) {
      return res.status(400).json({ error: 'Invalid order ID format.' });
    }

    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.json({ ...order, items });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status
 * Body: { status: 'PROCESSING' | 'READY' | 'DELIVERED' }
 */
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body || {};
    const validStatuses = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

    if (!status || typeof status !== 'string' || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Validate status transition (enforce forward-only)
    const statusOrder = { RECEIVED: 0, PROCESSING: 1, READY: 2, DELIVERED: 3 };
    const currentIdx = statusOrder[order.status];
    const newIdx = statusOrder[status.toUpperCase()];

    if (newIdx <= currentIdx) {
      return res.status(400).json({
        error: `Cannot move from ${order.status} to ${status.toUpperCase()}. Status can only move forward.`,
      });
    }

    // --- Edge case: prevent skipping statuses (must go one step at a time) ---
    if (newIdx > currentIdx + 1) {
      return res.status(400).json({
        error: `Cannot skip statuses. Must move from ${order.status} to ${validStatuses[currentIdx + 1]} first.`,
      });
    }

    db.prepare(
      "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE order_id = ?"
    ).run(status.toUpperCase(), req.params.id);

    const updated = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(req.params.id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);

    res.json({
      message: `Order status updated to ${status.toUpperCase()}.`,
      order: { ...updated, items },
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/orders/:id
 * Delete an order (only if RECEIVED)
 */
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status !== 'RECEIVED') {
      return res.status(400).json({
        error: `Can only delete orders with RECEIVED status. Current status: ${order.status}.`,
      });
    }

    // Use a transaction to delete items and order atomically
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id);
      db.prepare('DELETE FROM orders WHERE order_id = ?').run(req.params.id);
    });
    transaction();

    res.json({ message: 'Order deleted successfully.' });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
