# Oilstro Desktop App

> **Version: 2.3.0**

Oilstro is a robust, production-ready desktop application designed for efficient inventory management, billing, and employee tracking. Built with modern web technologies and wrapped in Electron, it offers a seamless native experience with a focus on performance and security.

## 🚀 Features

### 📊 Dashboard & Analytics
- **Real-time Overview**: Instant accessible metrics for Total Products, Employees, Low Stock alerts, and Total Revenue.
- **Sales Analytics**: Interactive 7-day sales trend visualization.
- **Recent Transactions**: Quick view of the latest sales and activities.

### 📦 Inventory Management
- **Product Catalog**: Comprehensive management (Add, Edit, Delete) of products.
- **Stock Tracking**: Real-time quantity tracking with visual "Low Stock" and "Out of Stock" indicators.
- **Batch Management**: Track products by batch numbers.
- **Quick Actions**: Fast stock updates and product lookups.

### 💰 Billing & POS
- **Point of Sale Interface**: distinct, fast, and user-friendly billing interface.
- **Smart Search**: Instantly find products and customers during checkout.
- **Tax & Discounts**:
  - Configurable tax rates (CGST/SGST).
  - Flexible discount options (Percentage or Fixed Amount).
- **Payment Handling**: Support for multiple payment modes, partial payments, and tracking balances.
- **Invoice Generation**: Auto-generate professional sales invoices (PDF/Print support) compatible with A4 thermal printers.

### 📜 Bill History
- **Transaction Logs**: Complete history of all sales.
- **Advanced Filtering**: Filter by Date Range, Price, Payment Status (Paid/Unpaid/Partial), Seller, or Customer.
- **Reprint**: Easy duplicate bill printing.

### 👥 User & Employee Management
- **Role-Based Access Control (RBAC)**:
  - **Owner/Admin**: Full system access.
  - **Worker**: Restricted access (Billing/Inventory only).
- **Employee Directory**: Manage staff profiles, contact details, and salaries.

### ⚙️ Application Settings
- **Business Profile**: Configurable business details (Name, Address, GSTIN, Phone) for invoices.
- **Theme**: Built-in Dark and Light mode support.

## 🛠 Tech Stack

- **Runtime**: [Electron 39](https://www.electronjs.org/)
- **Frontend**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Database**: [SQLite](https://www.sqlite.org/) (via `better-sqlite3`)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Installation

### Prerequisites
- **Node.js**: v18 or higher (Recommended).
- **Python**: Required for building native modules (`better-sqlite3`).
- **Build Tools**:
  - **Windows**: Visual Studio Build Tools (`npm install --global --production windows-build-tools`).
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`).

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rehan0013/oil-inventory-management-desktop-app.git
   cd oil-inventory
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   *Note: This may trigger a compilation of `better-sqlite3`. Ensure your build tools are set up correctly.*

3. **Run in Development Mode**
   ```bash
   npm start
   ```
   This command concurrently runs the Vite dev server and the Electron application.

## 🏗 Building for Production

To create a collaborative installer/executable for your operating system:

```bash
npm run package
```

Artifacts will be generated in the `release/` directory:
- **Windows**: `.exe` (NSIS Installer)
- **macOS**: `.dmg`
- **Linux**: `.AppImage` / `.deb`

## 📂 Project Structure

```
├── electron/           # Main process & Preload scripts
│   ├── main.cjs        # Application entry point
│   ├── preload.cjs     # Context Bridge & IPC
│   └── db.cjs          # Database connection & queries
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application Views (Dashboard, Billing, etc.)
│   ├── context/        # React Context (Auth, Theme)
│   └── assets/         # Static assets
├── release/            # Build output directory
└── package.json        # Dependencies & Build Config
```

## 🔒 Security

This application uses **Context Isolation** and **Sandboxing** to ensure security. Direct Node.js access is disabled in the renderer process; all system operations (FileSystem, Database) are routed through a secure `IPC Bridge`.

---

Developed by **Rehan Ali**
