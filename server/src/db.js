const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'laundry.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'RECEIVED',
      estimated_delivery TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      garment_type TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      price_per_item REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name);
    CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_garment ON order_items(garment_type);
  `);
}

module.exports = { getDb };
