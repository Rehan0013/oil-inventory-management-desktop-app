const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Users & Auth
    login: (creds) => ipcRenderer.invoke('login', creds),
    getUsers: () => ipcRenderer.invoke('get-users'),
    addUser: (user) => ipcRenderer.invoke('add-user', user),
    updateUser: (user) => ipcRenderer.invoke('update-user', user),
    deleteUser: (id) => ipcRenderer.invoke('delete-user', id),

    // Employees
    getEmployees: () => ipcRenderer.invoke('get-employees'),
    addEmployee: (emp) => ipcRenderer.invoke('add-employee', emp),
    updateEmployee: (emp) => ipcRenderer.invoke('update-employee', emp),
    deleteEmployee: (id) => ipcRenderer.invoke('delete-employee', id),

    // Products
    getProducts: () => ipcRenderer.invoke('get-products'),
    addProduct: (product) => ipcRenderer.invoke('add-product', product),
    updateProduct: (product) => ipcRenderer.invoke('update-product', product),
    updateProductQuantity: (id, quantity) => ipcRenderer.invoke('update-product-quantity', { id, quantity }),
    deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),

    // Billing
    createBill: (data) => ipcRenderer.invoke('create-bill', data),
    searchCustomers: (query) => ipcRenderer.invoke('search-customers', query),
    getBills: (filters) => ipcRenderer.invoke('get-bills', filters),
    updateBillPayment: (data) => ipcRenderer.invoke('update-bill-payment', data),

    // Dashboard

    getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),

    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    isSetupComplete: () => ipcRenderer.invoke('is-setup-complete'),
    completeSetup: (data) => ipcRenderer.invoke('complete-setup', data),

    // Suppliers & Categories
    getSuppliers: () => ipcRenderer.invoke('get-suppliers'),
    addSupplier: (s) => ipcRenderer.invoke('add-supplier', s),
    updateSupplier: (s) => ipcRenderer.invoke('update-supplier', s),
    deleteSupplier: (id) => ipcRenderer.invoke('delete-supplier', id),
    getCategories: () => ipcRenderer.invoke('get-categories'),
    addCategory: (name) => ipcRenderer.invoke('add-category', name),
    deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

    // Bulk & Returns
    exportInventory: () => ipcRenderer.invoke('export-inventory'),
    importInventory: (products) => ipcRenderer.invoke('import-inventory', products),
    processReturn: (data) => ipcRenderer.invoke('process-return', data),

    // Financials
    getCustomerLedger: (id) => ipcRenderer.invoke('get-customer-ledger', id),
    getSalaryHistory: (id) => ipcRenderer.invoke('get-salary-history', id),
    paySalary: (data) => ipcRenderer.invoke('pay_salary', data),

    print: () => ipcRenderer.invoke('print'),
    savePdf: () => ipcRenderer.invoke('save-pdf'),

    // Auto Update
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    restartApp: () => ipcRenderer.invoke('restart-app'),
});
