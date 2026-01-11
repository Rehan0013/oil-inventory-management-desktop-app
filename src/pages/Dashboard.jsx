import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, Receipt, IndianRupee, TrendingUp, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        products: 0,
        employees: 0,
        totalSales: 0,
        lowStock: 0,
        recentBills: [],
        salesData: []
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        if (window.api) {
            try {
                const data = await window.api.getDashboardStats();
                setStats({
                    products: data.products,
                    employees: data.employees,
                    totalSales: data.totalRevenue,
                    lowStock: data.lowStock,
                    recentBills: data.recentBills,
                    salesData: data.salesData
                });
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            }
        }
    };

    const cards = [
        { title: 'Total Products', value: stats.products, icon: <Package size={24} />, color: 'bg-blue-600', textColor: 'text-blue-600' },
        { title: 'Total Employees', value: stats.employees, icon: <Users size={24} />, color: 'bg-purple-600', textColor: 'text-purple-600' },
        { title: 'Low Stock Items', value: stats.lowStock, icon: <AlertTriangle size={24} />, color: 'bg-orange-600', textColor: 'text-orange-600' },
        { title: 'Total Revenue', value: `₹${stats.totalSales.toFixed(2)}`, icon: <IndianRupee size={24} />, color: 'bg-emerald-600', textColor: 'text-emerald-600' },
    ];

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                        <div className={`${card.color} p-4 rounded-xl text-white shadow-lg shadow-opacity-20`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{card.title}</p>
                            <h3 className={`text-2xl font-bold text-gray-900 dark:text-white`}>{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Sales Analytics & Recent Transactions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Sales Analytics Chart Area */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-500" />
                                Sales Analytics (Last 7 Days)
                            </h3>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {stats.salesData.length > 0 ? stats.salesData.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="relative w-full flex justify-center">
                                        <span className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                                            ₹{day.amount.toFixed(2)}
                                        </span>
                                        <div
                                            className="w-full max-w-[40px] bg-blue-500/80 hover:bg-blue-600 rounded-t-lg transition-all"
                                            style={{ height: `${(day.amount / Math.max(...stats.salesData.map(d => d.amount))) * 200}px` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium rotate-0 truncate w-full text-center">{new Date(day.day).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                </div>
                            )) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No sales data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions moved here for mobile usually, but keeping layout consistent */}
                </div>

                {/* Right Sidebar - Recent Activity & Actions */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => navigate('/inventory')}
                                className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-4 rounded-xl flex items-center gap-4 transition-all group border border-gray-200 dark:border-gray-700"
                            >
                                <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <Package size={24} />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-gray-900 dark:text-white">Add Product</span>
                                    <span className="text-xs text-gray-500">Update inventory stock</span>
                                </div>
                            </button>
                            <button
                                onClick={() => navigate('/billing')}
                                className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-4 rounded-xl flex items-center gap-4 transition-all group border border-gray-200 dark:border-gray-700"
                            >
                                <div className="bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                    <Receipt size={24} />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-gray-900 dark:text-white">New Bill</span>
                                    <span className="text-xs text-gray-500">Create invoice & print</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Sales</h3>
                        <div className="space-y-4">
                            {stats.recentBills.length > 0 ? stats.recentBills.map(bill => (
                                <div key={bill.id} className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{bill.customer_name || 'Walk-in Customer'}</p>
                                        <p className="text-xs text-gray-500">{new Date(bill.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+₹{bill.total_amount.toFixed(2)}</span>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-sm text-center py-4">No recent sales</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
