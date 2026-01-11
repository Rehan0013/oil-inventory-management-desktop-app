import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Filter, DollarSign, ChevronDown, ChevronUp, FileText, Eye, X, Printer } from 'lucide-react';
import BillTemplate from '../components/BillTemplate';

const BillHistory = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewBill, setViewBill] = useState(null);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        minPrice: '',
        maxPrice: '',
        sellerName: '',
        customerName: ''
    });

    const [expandedBill, setExpandedBill] = useState(null);

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        setLoading(true);
        if (window.api) {
            try {
                // Pass filters to backend
                const data = await window.api.getBills(filters);
                setBills(data);
            } catch (err) {
                console.error("Failed to load bills", err);
            }
        }
        setLoading(false);
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = () => {
        loadBills();
    };

    const toggleExpand = (id) => {
        setExpandedBill(expandedBill === id ? null : id);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 h-full flex flex-col relative">

            {/* Hidden Template for Printing the VIEWED bill */}
            <div className="print-only">
                <BillTemplate bill={viewBill} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bill History</h1>

            {/* Filters Section */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                            />
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Seller Name</label>
                        <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="sellerName"
                                placeholder="Search Seller"
                                value={filters.sellerName}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Customer Name</label>
                        <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="customerName"
                                placeholder="Search Customer"
                                value={filters.customerName}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Price Range</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                name="minPrice"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                            />
                            <input
                                type="number"
                                name="maxPrice"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={applyFilters}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <Filter size={16} />
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seller</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mode</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="p-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {bills.map((bill) => (
                                <React.Fragment key={bill.id}>
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 text-sm text-gray-900 dark:text-white">
                                            {new Date(bill.date).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-gray-900 dark:text-white font-medium">
                                            {bill.customer_name || 'Walk-in'}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                                                {bill.seller_name || bill.employee_name || 'Owner'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${bill.payment_mode === 'Cash'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                }`}>
                                                {bill.payment_mode || 'Cash'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            ₹{bill.total_amount.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center flex justify-center gap-2">
                                            <button
                                                onClick={() => setViewBill(bill)}
                                                className="p-2 hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors"
                                                title="View Receipt"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => toggleExpand(bill.id)}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                                                title="Expand Details"
                                            >
                                                {expandedBill === bill.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedBill === bill.id && (
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/20">
                                            <td colSpan="6" className="p-4">
                                                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Bill Items</h4>
                                                    <div className="space-y-2">
                                                        {bill.items && bill.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800 last:border-0 border-dashed">
                                                                <span className="text-gray-700 dark:text-gray-300">{item.product_name} x{item.quantity}</span>
                                                                <span className="text-gray-900 dark:text-white font-medium">₹{item.price_at_sale.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {bills.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p>No bills found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* View Bill Modal */}
            {viewBill && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bill Receipt</h2>
                            <button onClick={() => setViewBill(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto bg-gray-100 p-6">
                            <BillTemplate bill={viewBill} className="block w-full min-h-[500px] shadow-lg" />
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setViewBill(null)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                            >
                                <Printer size={18} />
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillHistory;
