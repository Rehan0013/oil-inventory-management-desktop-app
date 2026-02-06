
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
    return db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, role);
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
        return db.prepare('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?')
            .run(user.username, user.password, user.role, user.id);
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
    const stmt = db.prepare('INSERT INTO products (name, quantity, price, description, batch_number) VALUES (?, ?, ?, ?, ?)');
    return stmt.run(product.name, product.quantity, product.price, product.description, product.batchNumber);
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
    return db.prepare('UPDATE products SET name = ?, quantity = ?, price = ?, description = ?, batch_number = ? WHERE id = ?')
        .run(product.name, product.quantity, product.price, product.description, product.batchNumber, product.id);
});

ipcMain.handle('update-bill-payment', (event, { billId, amountPaid, paymentMode, status, balanceDue, newPaymentAmount }) => {
    const transaction = db.transaction(() => {
        db.updateBillPayment(billId, amountPaid, paymentMode, status, balanceDue);
        if (newPaymentAmount && newPaymentAmount > 0) {
            db.addPaymentRecord(billId, newPaymentAmount, paymentMode, new Date().toISOString());
        }
    });
    return transaction();
});

ipcMain.handle('create-bill', (event, args) => {
    const { employee_id, items, total_amount, date, customer, paymentMode, discountValue, discountType, taxRate, taxAmount } = args;
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
    const insertBill = db.prepare('INSERT INTO bills (date, employee_id, customer_id, seller_name, payment_mode, total_amount, discount_value, discount_type, payment_status, amount_paid, balance_due, tax_rate, tax_amount, calculation_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

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
            args.calculationMode || 'global' // Pass calculationMode via args
        ];
        console.log("Insert Bill Params:", params);

        const info = insertBill.run(...params);
        const billId = info.lastInsertRowid;

        // 3. Add Initial Payment Record if paid amount > 0
        if (pAmountPaid > 0) {
            db.addPaymentRecord(billId, pAmountPaid, modeStr, date);
        }

        const insertItem = db.prepare('INSERT INTO bill_items (bill_id, product_id, quantity, price_at_sale, batch_number, discount_value, discount_type, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        const updateStock = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');

        for (const item of items) {
            insertItem.run(
                billId,
                item.id,
                item.count,
                item.price,
                item.batch_number,
                item.discountValue || 0,
                item.discountType || 'amount',
                item.taxRate || 0
            );
            updateStock.run(item.count, item.id);
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

    // Recent Bills (Last 5)
    const recentBills = db.prepare(`
        SELECT b.id,  b.total_amount, c.name as customer_name, b.date
        FROM bills b 
        LEFT JOIN customers c ON b.customer_id = c.id
        ORDER BY b.date DESC LIMIT 5
    `).all();

    // Sales Chart Data (Last 7 days revenue)
    const salesData = db.prepare(`
        SELECT date(date) as day, SUM(total_amount) as amount 
        FROM bills 
        WHERE date >= date('now', '-7 days') 
        GROUP BY day 
        ORDER BY day ASC
    `).all();

    return {
        products: productsCount,
        employees: employeesCount,
        lowStock: lowStockCount,
        totalRevenue,
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
