
const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const db = require('./db.cjs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, !app.isPackaged ? '../public/icon.png' : '../dist/icon.png')
    });

    const isDev = !app.isPackaged;
    const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;

    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Auto Update Logic
    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });
}

// Auto Updater Events
autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
});

ipcMain.handle('restart-app', () => {
    autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
    if (process.platform === 'darwin') {
        const iconPath = path.join(__dirname, !app.isPackaged ? '../public/icon.png' : '../dist/icon.png');
        app.dock.setIcon(iconPath);
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.handle('get-users', () => {
    return db.getUsers();
});

ipcMain.handle('login', (event, { username, password }) => {
    return db.login(username, password);
});

ipcMain.handle('add-user', (event, { username, password, role }) => {
    const hashedPassword = db.hashPassword(password);
    return db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hashedPassword, role);
});

ipcMain.handle('delete-user', (event, id) => {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
});

// Employees
ipcMain.handle('get-employees', () => {
    return db.prepare('SELECT * FROM employees').all();
});

ipcMain.handle('add-employee', (event, employee) => {
    const stmt = db.prepare('INSERT INTO employees (name, phone, photo, joining_date, salary) VALUES (?, ?, ?, ?, ?)');
    return stmt.run(employee.name, employee.phone, employee.photo, employee.joining_date, employee.salary);
});

ipcMain.handle('delete-employee', (event, id) => {
    return db.prepare('DELETE FROM employees WHERE id = ?').run(id);
});

ipcMain.handle('update-employee', (event, employee) => {
    return db.prepare('UPDATE employees SET name = ?, phone = ?, photo = ?, joining_date = ?, salary = ? WHERE id = ?')
        .run(employee.name, employee.phone, employee.photo, employee.joining_date, employee.salary, employee.id);
});

// Users
ipcMain.handle('update-user', (event, user) => {
    if (user.password) {
        const hashedPassword = db.hashPassword(user.password);
        return db.prepare('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?')
            .run(user.username, hashedPassword, user.role, user.id);
    } else {
        return db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?')
            .run(user.username, user.role, user.id);
    }
});

// Products
ipcMain.handle('get-products', () => {
    return db.prepare('SELECT * FROM products').all();
});

ipcMain.handle('add-product', (event, product) => {
    const stmt = db.prepare('INSERT INTO products (name, quantity, price, description, batch_number, unit_cost, category_id, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    return stmt.run(product.name, product.quantity, product.price, product.description, product.batchNumber, product.unit_cost || 0, product.category_id || null, product.supplier_id || null);
});

ipcMain.handle('update-product-quantity', (event, { id, quantity }) => {
    return db.prepare('UPDATE products SET quantity = ? WHERE id = ?').run(quantity, id);
});

ipcMain.handle('delete-product', (event, id) => {
    return db.prepare('DELETE FROM products WHERE id = ?').run(id);
});

// Billing
ipcMain.handle('search-customers', (event, query) => {
    return db.prepare('SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? LIMIT 5')
        .all(`%${query}%`, `%${query}%`);
});

ipcMain.handle('update-product', (event, product) => {
    return db.prepare('UPDATE products SET name = ?, quantity = ?, price = ?, description = ?, batch_number = ?, unit_cost = ?, category_id = ?, supplier_id = ? WHERE id = ?')
        .run(product.name, product.quantity, product.price, product.description, product.batchNumber, product.unit_cost || 0, product.category_id || null, product.supplier_id || null, product.id);
});

ipcMain.handle('update-bill-payment', (event, { billId, amountPaid, paymentMode, status, balanceDue, newPaymentAmount }) => {
    const transaction = db.transaction(() => {
        db.updateBillPayment(billId, amountPaid, paymentMode, status, balanceDue);
        if (newPaymentAmount && newPaymentAmount > 0) {
            const date = new Date().toISOString();
            db.addPaymentRecord(billId, newPaymentAmount, paymentMode, date);

            // Update Ledger if customer exists
            const bill = db.prepare('SELECT customer_id FROM bills WHERE id = ?').get(billId);
            if (bill && bill.customer_id) {
                const lastLedger = db.prepare('SELECT balance FROM customer_ledger WHERE customer_id = ? ORDER BY id DESC LIMIT 1').get(bill.customer_id);
                const currentBalance = (lastLedger ? lastLedger.balance : 0) + newPaymentAmount;
                db.prepare('INSERT INTO customer_ledger (customer_id, bill_id, type, amount, balance, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
                    .run(bill.customer_id, billId, 'credit', newPaymentAmount, currentBalance, `Payment: Bill #${billId}`, date);
            }
        }
    });
    return transaction();
});

ipcMain.handle('create-bill', (event, args) => {
    const { employee_id, items, total_amount, date, customer, paymentMode, discountValue, discountType, taxRate, taxAmount, discountAmount } = args;
    // 1. Handle Customer (Upsert)
    let customerId = null;
    if (customer && customer.phone) {
        const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer.phone);
        if (existing) {
            customerId = existing.id;
            // Update name if changed
            db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(customer.name, customerId);
        } else {
            const info = db.prepare('INSERT INTO customers (name, phone, created_at) VALUES (?, ?, ?)').run(customer.name, customer.phone, new Date().toISOString());
            customerId = info.lastInsertRowid;
        }
    }

    // 2. Insert Bill
    const insertBill = db.prepare('INSERT INTO bills (date, employee_id, customer_id, seller_name, payment_mode, total_amount, discount_value, discount_type, payment_status, amount_paid, balance_due, tax_rate, tax_amount, calculation_mode, discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction((items) => {
        // Helper to extract values whether paymentMode is string (legacy/simple) or object
        const isObj = typeof paymentMode === 'object' && paymentMode !== null;
        const modeStr = isObj ? (paymentMode.mode || 'Cash') : (paymentMode || 'Cash');
        const pStatus = isObj ? (paymentMode.status || 'Paid') : 'Paid';
        const pAmountPaid = isObj && paymentMode.amountPaid !== undefined ? paymentMode.amountPaid : total_amount;
        const pBalanceDue = isObj && paymentMode.balanceDue !== undefined ? paymentMode.balanceDue : 0;

        const params = [
            date,
            employee_id || null,
            customerId,
            customer.seller_name,
            modeStr,
            total_amount,
            discountValue || 0,
            discountType || 'amount',
            pStatus,
            pAmountPaid,
            pBalanceDue,
            taxRate || 0,
            taxAmount || 0,
            args.calculationMode || 'global', // Pass calculationMode via args
            discountAmount || 0
        ];
        console.log("Insert Bill Params:", params);

        const info = insertBill.run(...params);
        const billId = info.lastInsertRowid;

        // 3. Add Initial Payment Record if paid amount > 0
        if (pAmountPaid > 0) {
            db.addPaymentRecord(billId, pAmountPaid, modeStr, date);
        }

        const insertItem = db.prepare('INSERT INTO bill_items (bill_id, product_id, quantity, price_at_sale, batch_number, discount_value, discount_type, tax_rate, unit_cost_at_sale) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const updateStock = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');

        for (const item of items) {
            // Fetch current unit cost if not provided in item (safety)
            const prod = db.prepare('SELECT unit_cost FROM products WHERE id = ?').get(item.id);

            insertItem.run(
                billId,
                item.id,
                item.count,
                item.price,
                item.batch_number,
                item.discountValue || 0,
                item.discountType || 'amount',
                item.taxRate || 0,
                prod ? prod.unit_cost : 0
            );
            updateStock.run(item.count, item.id);
        }

        // 4. Ledger Update if Customer exists
        if (customerId) {
            const lastLedger = db.prepare('SELECT balance FROM customer_ledger WHERE customer_id = ? ORDER BY id DESC LIMIT 1').get(customerId);
            const prevBalance = lastLedger ? lastLedger.balance : 0;
            // Debit the total amount
            const balanceAfterDebit = prevBalance - total_amount;
            db.prepare('INSERT INTO customer_ledger (customer_id, bill_id, type, amount, balance, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .run(customerId, billId, 'debit', total_amount, balanceAfterDebit, `Purchase: Bill #${billId}`, date);

            // Credit the paid amount if any
            if (pAmountPaid > 0) {
                const finalBalance = balanceAfterDebit + pAmountPaid;
                db.prepare('INSERT INTO customer_ledger (customer_id, bill_id, type, amount, balance, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
                    .run(customerId, billId, 'credit', pAmountPaid, finalBalance, `Payment: Bill #${billId}`, date);
            }
        }

        return billId;
    });

    return transaction(items);
});

ipcMain.handle('get-bills', (event, filters = {}) => {
    let query = `
        SELECT b.*, b.calculation_mode as calculationMode, e.name as employee_name, c.name as customer_name, c.phone as customer_phone 
        FROM bills b 
        LEFT JOIN employees e ON b.employee_id = e.id 
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE 1=1
    `;
    const params = [];

    if (filters.id) {
        query += ' AND b.id = ?';
        params.push(filters.id);
    }
    if (filters.startDate) {
        query += ' AND date(b.date) >= date(?)';
        params.push(filters.startDate);
    }
    if (filters.endDate) {
        query += ' AND date(b.date) <= date(?)';
        params.push(filters.endDate);
    }
    if (filters.minPrice) {
        query += ' AND b.total_amount >= ?';
        params.push(filters.minPrice);
    }
    if (filters.maxPrice) {
        query += ' AND b.total_amount <= ?';
        params.push(filters.maxPrice);
    }
    if (filters.sellerName) {
        query += ' AND e.name LIKE ?';
        params.push(`%${filters.sellerName}%`);
    }
    if (filters.customerName) {
        query += ' AND c.name LIKE ?';
        params.push(`%${filters.customerName}%`);
    }
    if (filters.paymentStatus) {
        if (filters.paymentStatus === 'unpaid_partial') {
            query += " AND (b.payment_status = 'Unpaid' OR b.payment_status = 'Partial')";
        } else if (filters.paymentStatus !== 'all') {
            query += ' AND b.payment_status = ?';
            params.push(filters.paymentStatus);
        }
    }

    query += ' ORDER BY b.date DESC';

    const bills = db.prepare(query).all(...params);

    // Attach items and payments to each bill (optional, or load on demand)
    const billsWithDetails = bills.map(bill => {
        const items = db.prepare(`
            SELECT 
                bi.id, bi.bill_id, bi.product_id, bi.quantity, bi.price_at_sale, bi.batch_number,
                bi.discount_value as discountValue, bi.discount_type as discountType, bi.tax_rate as taxRate,
                p.name as product_name 
            FROM bill_items bi 
            JOIN products p ON bi.product_id = p.id 
            WHERE bi.bill_id = ?
        `).all(bill.id);

        const payments = db.prepare(`
            SELECT * FROM bill_payments WHERE bill_id = ? ORDER BY date DESC
        `).all(bill.id);

        return { ...bill, items, payments };
    });

    return billsWithDetails;
});

ipcMain.handle('get-dashboard-stats', () => {
    const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const employeesCount = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
    const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE quantity < 10').get().count;

    // Total Revenue (All time)
    const totalRevenue = db.prepare('SELECT SUM(total_amount) as total FROM bills').get().total || 0;

    // Total Profit (All time)
    const totalProfit = db.prepare(`
        SELECT SUM((bi.price_at_sale - bi.unit_cost_at_sale) * bi.quantity - (
            CASE 
                WHEN bi.discount_type = 'percent' THEN (bi.price_at_sale * bi.quantity * bi.discount_value / 100)
                ELSE bi.discount_value 
            END
        )) as profit
        FROM bill_items bi
    `).get().profit || 0;

    // Recent Bills (Last 5)
    const recentBills = db.prepare(`
        SELECT b.id, b.total_amount, c.name as customer_name, b.date
        FROM bills b 
        LEFT JOIN customers c ON b.customer_id = c.id
        ORDER BY b.date DESC LIMIT 5
    `).all();

    // Sales Chart Data (Last 7 days revenue & profit)
    const salesData = db.prepare(`
        SELECT 
            date(b.date) as day, 
            SUM(b.total_amount) as amount,
            SUM(
                (bi.price_at_sale - bi.unit_cost_at_sale) * bi.quantity - (
                    CASE 
                        WHEN bi.discount_type = 'percent' THEN (bi.price_at_sale * bi.quantity * bi.discount_value / 100)
                        ELSE bi.discount_value 
                    END
                )
            ) as profit
        FROM bills b
        JOIN bill_items bi ON b.id = bi.bill_id
        WHERE b.date >= date('now', '-7 days') 
        GROUP BY day 
        ORDER BY day ASC
    `).all();

    return {
        products: productsCount,
        employees: employeesCount,
        lowStock: lowStockCount,
        totalRevenue,
        totalProfit,
        recentBills,
        salesData
    };
});



// Settings
ipcMain.handle('get-settings', () => {
    return db.getSettings();
});

ipcMain.handle('save-settings', (event, settings) => {
    return db.saveSettings(settings);
});

ipcMain.handle('is-setup-complete', () => {
    return db.isSetupComplete();
});

ipcMain.handle('complete-setup', (event, { businessDetails, ownerDetails }) => {
    return db.completeSetup(businessDetails, ownerDetails);
});

// Suppliers
ipcMain.handle('get-suppliers', () => {
    return db.prepare('SELECT * FROM suppliers').all();
});
ipcMain.handle('add-supplier', (event, s) => {
    return db.prepare('INSERT INTO suppliers (name, phone, email, address, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(s.name, s.phone, s.email, s.address, new Date().toISOString());
});
ipcMain.handle('update-supplier', (event, s) => {
    return db.prepare('UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?')
        .run(s.name, s.phone, s.email, s.address, s.id);
});
ipcMain.handle('delete-supplier', (event, id) => {
    return db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
});

// Categories
ipcMain.handle('get-categories', () => {
    return db.prepare('SELECT * FROM categories').all();
});
ipcMain.handle('add-category', (event, name) => {
    return db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
});
ipcMain.handle('delete-category', (event, id) => {
    return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
});

// Bulk Import/Export
ipcMain.handle('export-inventory', async () => {
    const products = db.prepare(`
        SELECT p.name, p.quantity, p.price, p.unit_cost, p.batch_number, p.description, 
               c.name as category, s.name as supplier
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
    `).all();
    return products;
});

ipcMain.handle('import-inventory', async (event, products) => {
    const transaction = db.transaction((items) => {
        const insert = db.prepare(`
            INSERT INTO products (name, quantity, price, unit_cost, batch_number, description) 
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const item of items) {
            insert.run(
                item.name,
                item.quantity || 0,
                item.price || 0,
                item.unit_cost || 0,
                item.batch_number || '',
                item.description || ''
            );
        }
    });
    return transaction(products);
});

ipcMain.handle('process-return', async (event, returnData) => {
    const { bill_id, product_id, quantity, refund_amount, reason } = returnData;
    const date = new Date().toISOString();

    const transaction = db.transaction(() => {
        // 1. Add return record
        db.prepare('INSERT INTO returns (bill_id, product_id, quantity, refund_amount, reason, date) VALUES (?, ?, ?, ?, ?, ?)')
            .run(bill_id, product_id, quantity, refund_amount, reason, date);

        // 2. Add stock back to product
        db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?')
            .run(quantity, product_id);

        // 3. Update bill total? (Optional, usually we just record the refund)
        // 4. Ledger update if customer exists
        const bill = db.prepare('SELECT customer_id FROM bills WHERE id = ?').get(bill_id);
        if (bill && bill.customer_id) {
            const lastLedger = db.prepare('SELECT balance FROM customer_ledger WHERE customer_id = ? ORDER BY id DESC LIMIT 1').get(bill.customer_id);
            const currentBalance = (lastLedger ? lastLedger.balance : 0) - refund_amount;
            db.prepare('INSERT INTO customer_ledger (customer_id, bill_id, type, amount, balance, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .run(bill.customer_id, bill_id, 'credit', refund_amount, currentBalance, `Refund for Bill #${bill_id}: ${reason}`, date);
        }
    });
    return transaction();
});

ipcMain.handle('get-customer-ledger', (event, customerId) => {
    return db.prepare('SELECT * FROM customer_ledger WHERE customer_id = ? ORDER BY date DESC, id DESC').all(customerId);
});

ipcMain.handle('get-salary-history', (event, empId) => {
    return db.prepare('SELECT * FROM salary_payments WHERE employee_id = ? ORDER BY payment_date DESC').all(empId);
});

ipcMain.handle('pay_salary', (event, data) => {
    return db.prepare('INSERT INTO salary_payments (employee_id, amount, payment_date, period_month, period_year, payment_mode) VALUES (?, ?, ?, ?, ?, ?)')
        .run(data.employee_id, data.amount, new Date().toISOString(), data.month, data.year, data.mode);
});

ipcMain.handle('print', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    // Silent print or system default
    win.webContents.print({ silent: false, printBackground: true }, (success, errorType) => {
        if (!success) console.log("Print failed:", errorType);
    });
    return true;
});

ipcMain.handle('save-pdf', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const fs = require('fs');
    const { dialog } = require('electron');

    try {
        const data = await win.webContents.printToPDF({ printBackground: true });
        const { filePath } = await dialog.showSaveDialog(win, {
            title: 'Save Bill',
            defaultPath: `Bill-${Date.now()}.pdf`,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
        });

        if (filePath) {
            fs.writeFileSync(filePath, data);
            return { success: true, filePath };
        }
        return { success: false, cancelled: true };
    } catch (error) {
        console.error('PDF Generation Failed:', error);
        return { success: false, error: error.message };
    }
});
