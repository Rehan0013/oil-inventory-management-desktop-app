# Oil Inventory Management System

A comprehensive desktop application for managing oil inventory, billing, and employees. Built with Electron, React, and SQLite.

## Features

### 📦 Inventory Management
- **Product Catalog**: Add, edit, and update products with ease.
- **Stock Management**: Track stock levels with visual indicators (Low/Out of Stock).
- **Quick Add Stock**: Incrementally add stock to existing products.
- **Search**: Fast product filtering.

### 💰 Billing & Invoicing
- **Point of Sale**: Quick billing interface with product search and cart.
- **Professional Bills**: Generate A4-compatible bills for printing.
- **Bill History**: View and reprint past transaction records.
- **PDF Export**: Save bills as PDF files.

### 👥 User & Employee Management
- **Role-Based Access**:
  - **Owner**: Full access to all features including Employee/User management and Deletion.
  - **Worker**: Access to Billing and Inventory (Add/Edit/Stock) but restricted from deleting items.
- **Employee Tracking**: Manage staff details.

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Fully responsive theme support.
- **Dashboard**: Real-time statistics on sales, revenue, and stock.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend/Shell**: Electron
- **Database**: SQLite (better-sqlite3)
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- Python (for building `better-sqlite3` native modules)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd oil-inventory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application in development mode:
   ```bash
   npm start
   ```
   This will run the Vite dev server and launch Electron.

## Building for Production

To create a distributable installer for your OS (macOS, Windows, or Linux):

```bash
npm run package
```

The artifacts (DMG, EXE, etc.) will be generated in the `release/` directory.

### GitHub Actions
This project includes a CI/CD workflow (`.github/workflows/electron-build.yml`) to automatically build and upload artifacts on push.

## Project Structure

- `electron/` - Main process and preload scripts.
- `src/`
  - `components/` - Reusable UI components (Sidebar, BillTemplate, etc.).
  - `context/` - React Contexts (Auth, Theme, Toast).
  - `pages/` - Application views (Dashboard, Billing, Inventory, etc.).
  - `lib/` - Utilities.
- `release/` - Output directory for builds.

## License

[Your License Here]
