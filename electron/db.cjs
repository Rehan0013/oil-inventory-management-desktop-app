const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Store DB in userData folder for persistence
const dbPath = path.join(app.getPath('userData'), 'oil_inventory.db');
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('owner', 'worker'))
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    photo TEXT,
    joining_date TEXT,
    salary REAL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    quantity INTEGER,
    price REAL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    employee_id INTEGER,
    customer_id INTEGER,
    seller_name TEXT,
    payment_mode TEXT,
    total_amount REAL,
    FOREIGN KEY(employee_id) REFERENCES employees(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );
  
  CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price_at_sale REAL,
    FOREIGN KEY(bill_id) REFERENCES bills(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

// Migration: Add customer_id/seller_name to bills if not exists
try {
  const tableInfo = db.prepare("PRAGMA table_info(bills)").all();

  const hasCustomerId = tableInfo.some(col => col.name === 'customer_id');
  if (!hasCustomerId) {
    console.log("Migrating: Adding customer_id to bills");
    db.prepare('ALTER TABLE bills ADD COLUMN customer_id INTEGER REFERENCES customers(id)').run();
  }

  const hasSellerName = tableInfo.some(col => col.name === 'seller_name');
  if (!hasSellerName) {
    console.log("Migrating: Adding seller_name to bills");
    db.prepare('ALTER TABLE bills ADD COLUMN seller_name TEXT').run();
  }

  const hasPaymentMode = tableInfo.some(col => col.name === 'payment_mode');
  if (!hasPaymentMode) {
    console.log("Migrating: Adding payment_mode to bills");
    db.prepare('ALTER TABLE bills ADD COLUMN payment_mode TEXT').run();
  }

  const hasDiscountValue = tableInfo.some(col => col.name === 'discount_value');
  if (!hasDiscountValue) {
    console.log("Migrating: Adding discount_value to bills");
    db.prepare('ALTER TABLE bills ADD COLUMN discount_value REAL DEFAULT 0').run();
  }

  const hasDiscountType = tableInfo.some(col => col.name === 'discount_type');
  if (!hasDiscountType) {
    console.log("Migrating: Adding discount_type to bills");
    db.prepare("ALTER TABLE bills ADD COLUMN discount_type TEXT DEFAULT 'amount'").run();
  }
} catch (error) {
  console.error('Migration failed:', error);
}

// Seed Owner if not exists
const checkOwner = db.prepare('SELECT * FROM users WHERE role = ?').get('owner');
if (!checkOwner) {
  // Default owner: admin / admin123 (In production, hash passwords!)
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'owner');
}

module.exports = {
  getUsers: () => db.prepare('SELECT id, username, role FROM users').all(),
  login: (username, password) => {
    // Determine if user exists
    return db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password = ?').get(username, password);
  },
  prepare: (sql) => db.prepare(sql),
  transaction: (fn) => db.transaction(fn)
};
