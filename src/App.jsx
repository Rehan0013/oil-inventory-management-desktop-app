import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Employees from './pages/Employees';
import Users from './pages/Users';
import BillHistory from './pages/BillHistory';
import Settings from './pages/Settings';

// Protected Route Component
const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">Loading...</div>;

  return user ? (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 overflow-auto p-4">
        <Outlet />
      </div>
    </div>
  ) : (
    <Navigate to="/login" />
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/bill-history" element={<BillHistory />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
