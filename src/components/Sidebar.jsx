import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, Package, Users, Receipt, LogOut, Shield, Moon, Sun, Monitor } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { title: 'Inventory', icon: <Package size={20} />, path: '/inventory' },
        { title: 'Billing', icon: <Receipt size={20} />, path: '/billing' },
        { title: 'History', icon: <Receipt size={20} className="opacity-50" />, path: '/bill-history' },
    ];

    if (user?.role === 'owner') {
        menuItems.push({ title: 'Employees', icon: <Users size={20} />, path: '/employees' });
        menuItems.push({ title: 'Users', icon: <Shield size={20} />, path: '/users' });
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const cycleTheme = () => {
        if (theme === 'system') setTheme('dark');
        else if (theme === 'dark') setTheme('light');
        else setTheme('system');
    };

    const getThemeIcon = () => {
        if (theme === 'system') return <Monitor size={16} />;
        if (theme === 'dark') return <Moon size={16} />;
        return <Sun size={16} />;
    };

    return (
        <div className="w-64 h-screen flex flex-col transition-colors duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-xl font-bold tracking-wider text-gray-900 dark:text-white">OIL MASTER</h1>
                <p className="text-xs text-gray-500 mt-1">Inventory Management</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                    <div
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${location.pathname === item.path
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        {item.icon}
                        <span className="font-medium">{item.title}</span>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <button
                    onClick={cycleTheme}
                    className="w-full flex items-center gap-2 justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                    <span className="flex items-center gap-2">
                        {getThemeIcon()}
                        <span className="capitalize">{theme} Mode</span>
                    </span>
                </button>

                <div className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 justify-center p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
