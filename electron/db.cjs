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
    description TEXT,
    batch_number TEXT
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
    batch_number TEXT,
    FOREIGN KEY(bill_id) REFERENCES bills(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS bill_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER,
    amount REAL,
    date TEXT,
    payment_mode TEXT,
    FOREIGN KEY(bill_id) REFERENCES bills(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
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

  const hasTaxRate = tableInfo.some(col => col.name === 'tax_rate');
  if (!hasTaxRate) {
    console.log("Migrating: Adding tax_rate to bills");
    db.prepare('ALTER TABLE bills ADD COLUMN tax_rate REAL DEFAULT 0').run();
  }

  const hasTaxAmount = tableInfo.some(col => col.name === 'tax_amount');
  if (!hasTaxAmount) {
    console.log("Migrating: Adding tax_amount to bills");
    db.prepare('ALTER TABLE bills ADD COLUMN tax_amount REAL DEFAULT 0').run();
  }

  // Add batch_number to products if missing
  const productInfo = db.prepare("PRAGMA table_info(products)").all();
  if (!productInfo.some(col => col.name === 'batch_number')) {
    console.log("Migrating: Adding batch_number to products");
    try { db.prepare('ALTER TABLE products ADD COLUMN batch_number TEXT').run(); } catch (e) { }
  }

  // Add batch_number to bill_items if missing
  const billItemInfo = db.prepare("PRAGMA table_info(bill_items)").all();
  if (!billItemInfo.some(col => col.name === 'batch_number')) {
    console.log("Migrating: Adding batch_number to bill_items");
    try { db.prepare('ALTER TABLE bill_items ADD COLUMN batch_number TEXT').run(); } catch (e) { }
  }
} catch (error) {
  console.error('Migration failed:', error);
}

// Seed Default Settings if not exists
const checkSettings = db.prepare('SELECT * FROM settings WHERE key = ?').get('businessName');
if (!checkSettings) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('businessName', 'Oil Inventory');
  insertSetting.run('addressLine1', '123 Business Road');
  insertSetting.run('addressLine2', 'City, State');
  insertSetting.run('phone', '(555) 123-4567');
}

// Seed Owner if not exists
const checkOwner = db.prepare('SELECT * FROM users WHERE role = ?').get('owner');
if (!checkOwner) {
  // Default owner: admin / admin123 (In production, hash passwords!)
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'owner');
}



// Migration: Add payment fields
try {
  const tableInfo = db.prepare("PRAGMA table_info(bills)").all();

  const hasPaymentStatus = tableInfo.some(col => col.name === 'payment_status');
  if (!hasPaymentStatus) {
    db.prepare("ALTER TABLE bills ADD COLUMN payment_status TEXT DEFAULT 'Paid'").run();
  }

  const hasAmountPaid = tableInfo.some(col => col.name === 'amount_paid');
  if (!hasAmountPaid) {
    // Default to total amount (initially assumed paid, but old records needs logical handling)
    // We can't default to column value in sqlite add column. Default to 0 or null.
    // Let's default to 0 and we might need to backfill if critical, but for now 0 is safe.
    db.prepare("ALTER TABLE bills ADD COLUMN amount_paid REAL DEFAULT 0").run();
    // Backfill: update bills set amount_paid = total_amount where payment_status = 'Paid' ?
    db.prepare("UPDATE bills SET amount_paid = total_amount").run();
  }

  const hasBalanceDue = tableInfo.some(col => col.name === 'balance_due');
  if (!hasBalanceDue) {
    db.prepare("ALTER TABLE bills ADD COLUMN balance_due REAL DEFAULT 0").run();
  }

} catch (error) {
  console.error('Migration failed:', error);
}

module.exports = {
  getUsers: () => db.prepare('SELECT id, username, role FROM users').all(),
  login: (username, password) => {
    return db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password = ?').get(username, password);
  },
  prepare: (sql) => db.prepare(sql),

  transaction: (fn) => db.transaction(fn),
  getSettings: () => {
    const rows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  },
  saveSettings: (settingsObj) => {
    const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const update = db.transaction((obj) => {
      for (const [key, value] of Object.entries(obj)) {
        insert.run(key, value);
      }
    });
    update(settingsObj);
    return true;
  },
  updateBillPayment: (billId, amountPaid, paymentMode, status, balanceDue) => {
    // 1. Calculate the new payment amount (current total paid - previous amount paid)
    // For simplicity, we assume the frontend sends the "Latest Payment Amount" separately? 
    // Actually, looking at main.cjs usage, we might need adjustments. 
    // But let's assume we can derive it or modify the signature later.
    // Ideally, we should pass `paidAmountNow`.
    // Let's modify the function signature to accept `paidAmountNow` (the increment).

    // However, keeping specific args for now, we'll calculate it or just insert.
    // But better: Update this function to transactional update.

    const transaction = db.transaction(() => {
      // Get current bill to diff amount if needed, OR just trust the paid increment is handled by caller?
      // Let's assume the caller will handle the logic or we change signature.
      // For now, let's just update the bill. We'll add the inserting logic in main.cjs or here?
      // Let's keep it simple: updateBillPayment handles the bill update.
      // We will add a new function `addBillPayment` maybe?

      db.prepare('UPDATE bills SET amount_paid = ?, payment_mode = ?, payment_status = ?, balance_due = ? WHERE id = ?')
        .run(amountPaid, paymentMode, status, balanceDue, billId);
    });
    return transaction();
  },
  addPaymentRecord: (billId, amount, mode, date) => {
    return db.prepare('INSERT INTO bill_payments (bill_id, amount, payment_mode, date) VALUES (?, ?, ?, ?)').run(billId, amount, mode, date);
  }
};
