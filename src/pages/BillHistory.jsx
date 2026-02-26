import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Filter, DollarSign, ChevronDown, ChevronUp, FileText, Eye, X, Printer, IndianRupee, RotateCcw, AlertCircle } from 'lucide-react';
import BillTemplate from '../components/BillTemplate';
import Dropdown from '../components/Dropdown';

const BillHistory = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewBill, setViewBill] = useState(null);
    const [settings, setSettings] = useState({});

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        minPrice: '',
        maxPrice: '',
        sellerName: '',
        customerName: '',
        paymentStatus: 'all'
    });

    const [expandedBill, setExpandedBill] = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [payBillData, setPayBillData] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnItem, setReturnItem] = useState(null);
    const [returnQty, setReturnQty] = useState(1);
    const [returnReason, setReturnReason] = useState('');
    const [activeBill, setActiveBill] = useState(null);

    useEffect(() => {
        loadBills();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        if (window.api) {
            try {
                const data = await window.api.getSettings();
                setSettings(data);
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        }
    };

    const loadBills = async () => {
        setLoading(true);
        if (window.api) {
            try {
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

    const paymentOptions = [
        { label: 'All Payments', value: 'all' },
        { label: 'Paid', value: 'Paid' },
        { label: 'Unpaid / Partial', value: 'unpaid_partial' }
    ];

    const toggleExpand = (id) => {
        setExpandedBill(expandedBill === id ? null : id);
    };

    const handlePrint = () => {
        document.body.classList.add("printing");

        setTimeout(() => {
            window.print();

            setTimeout(() => {
                document.body.classList.remove("printing");
            }, 500);
        }, 100);
    };

    return (
        <div className="p-6 h-full flex flex-col relative">

            {/* Hidden Template for Printing the VIEWED bill */}
            <div className="print-only">
                <BillTemplate bill={viewBill} settings={settings} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bill History</h1>

            {/* Filters Section */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 mb-6 shadow-sm">

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Date Range */}
                    <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                            />
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Seller Name */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Seller Name</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="sellerName"
                                placeholder="Search Seller"
                                value={filters.sellerName}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Customer Name */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Customer Name</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="customerName"
                                placeholder="Search Customer"
                                value={filters.customerName}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Price Range</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                name="minPrice"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                            />
                            <input
                                type="number"
                                name="maxPrice"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Payment Status</label>
                        <Dropdown
                            options={paymentOptions}
                            value={filters.paymentStatus}
                            onChange={(val) =>
                                setFilters({ ...filters, paymentStatus: val })
                            }
                            label="Status"
                        />
                    </div>

                </div>

                {/* Action Button */}
                <div className="flex justify-end mt-5">
                    <button
                        onClick={applyFilters}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition active:scale-95 shadow-lg shadow-blue-500/30"
                    >
                        <Filter size={18} />
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

                                                    {/* Payment Details & Update */}
                                                    <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Payment Status: <span className={`font-bold ${bill.payment_status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>{bill.payment_status}</span></p>
                                                            {bill.payment_status !== 'Paid' && (
                                                                <>
                                                                    <p className="text-sm text-gray-500">Paid: <span className="font-medium text-gray-900 dark:text-white">₹{bill.amount_paid || 0}</span></p>
                                                                    <p className="text-sm text-gray-500">Due: <span className="font-medium text-red-600">₹{bill.balance_due || (bill.total_amount - (bill.amount_paid || 0))}</span></p>
                                                                </>
                                                            )}
                                                        </div>
                                                        {bill.payment_status !== 'Paid' && (
                                                            <button
                                                                onClick={() => {
                                                                    setPayBillData(bill);
                                                                    setPaymentAmount(bill.balance_due || (bill.total_amount - (bill.amount_paid || 0)));
                                                                    setPaymentMode('Cash');
                                                                    setShowPayModal(true);
                                                                }}
                                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors shadow-sm"
                                                            >
                                                                Update Payment
                                                            </button>
                                                        )}
                                                    </div>

                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Bill Items</h4>
                                                    <div className="space-y-2">
                                                        {bill.items && bill.items.map((item, idx) => {
                                                            let displayTaxRate = 0;
                                                            let displayDisc = null;

                                                            // Logic for Displaying Tax/Disc (Mirrors BillTemplate)
                                                            if (bill.calculationMode === 'itemized') {
                                                                displayTaxRate = item.taxRate || 0;
                                                                if (item.discountValue > 0) {
                                                                    displayDisc = item.discountType === 'percent' ? `${item.discountValue}%` : `₹${item.discountValue}`;
                                                                }
                                                            } else {
                                                                // Global Mode
                                                                displayTaxRate = bill.taxRate || bill.tax_rate || 0;
                                                                const globalDescVal = bill.discountValue || bill.discount_value || 0;
                                                                const globalDescType = bill.discountType || bill.discount_type || 'amount';

                                                                if (globalDescVal > 0) {
                                                                    displayDisc = globalDescType === 'percent' ? `${globalDescVal}%` : `(Global)`;
                                                                }
                                                            }

                                                            return (
                                                                <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800 last:border-0 border-dashed">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-gray-700 dark:text-gray-300">{item.product_name} x{item.quantity}</span>
                                                                        <div className="text-xs text-gray-500 flex gap-2">
                                                                            <span>Batch: {item.batchNumber || item.batch_number}</span>
                                                                            {displayTaxRate > 0 && <span className="text-blue-600">GST: {displayTaxRate}%</span>}
                                                                            {displayDisc && <span className="text-green-600">Disc: {displayDisc}</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-gray-900 dark:text-white font-medium">₹{(item.price_at_sale * item.quantity).toFixed(2)}</span>
                                                                        <button
                                                                            onClick={() => {
                                                                                setActiveBill(bill);
                                                                                setReturnItem(item);
                                                                                setReturnQty(1);
                                                                                setReturnReason('');
                                                                                setShowReturnModal(true);
                                                                            }}
                                                                            className="text-orange-500 hover:text-orange-600 p-1 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded"
                                                                            title="Return / Refund"
                                                                        >
                                                                            <RotateCcw size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Bill Summary Section */}
                                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mt-4 space-y-1 text-sm">
                                                        {(() => {
                                                            const subtotal = bill.items ? bill.items.reduce((sum, item) => sum + (item.price_at_sale * item.quantity), 0) : 0;
                                                            const isItemized = bill.calculationMode === 'itemized' || bill.calculation_mode === 'itemized';

                                                            let finalDiscountDisplay = 0;
                                                            let finalTaxDisplay = 0;

                                                            if (isItemized && bill.items) {
                                                                bill.items.forEach(item => {
                                                                    const qty = item.quantity || 0;
                                                                    const price = item.price_at_sale || 0;
                                                                    const itemTotal = price * qty;
                                                                    const dVal = parseFloat(item.discountValue !== undefined ? item.discountValue : (item.discount_value !== undefined ? item.discount_value : 0));
                                                                    const dType = item.discountType || item.discount_type || 'amount';
                                                                    const itemDisc = dType === 'percent' ? (itemTotal * dVal / 100) : dVal;
                                                                    finalDiscountDisplay += itemDisc;

                                                                    const tRate = parseFloat(item.taxRate || item.tax_rate || 0);
                                                                    finalTaxDisplay += (itemTotal - itemDisc) * (tRate / 100);
                                                                });
                                                            } else {
                                                                // Global Mode
                                                                const savedDiscountAmt = bill.discount_amount !== undefined ? bill.discount_amount : (bill.discountAmount || 0);
                                                                if (savedDiscountAmt > 0) {
                                                                    finalDiscountDisplay = parseFloat(savedDiscountAmt);
                                                                } else {
                                                                    const dVal = parseFloat(bill.discountValue !== undefined ? bill.discountValue : (bill.discount_value !== undefined ? bill.discount_value : 0));
                                                                    const dType = bill.discountType || bill.discount_type || 'amount';
                                                                    finalDiscountDisplay = dType === 'percent' ? (subtotal * dVal / 100) : dVal;
                                                                }

                                                                const savedTaxAmt = bill.tax_amount !== undefined ? bill.tax_amount : (bill.taxAmount || 0);
                                                                if (savedTaxAmt > 0) {
                                                                    finalTaxDisplay = parseFloat(savedTaxAmt);
                                                                } else {
                                                                    const tRate = parseFloat(bill.tax_rate !== undefined ? bill.tax_rate : (bill.taxRate || 0));
                                                                    finalTaxDisplay = (subtotal - finalDiscountDisplay) * (tRate / 100);
                                                                }
                                                            }

                                                            return (
                                                                <>
                                                                    {finalDiscountDisplay > 0 && (
                                                                        <div className="flex justify-between text-gray-500">
                                                                            <span>Discount</span>
                                                                            <span className="text-green-600">-₹{finalDiscountDisplay.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {finalTaxDisplay > 0 && (
                                                                        <div className="flex justify-between text-gray-500">
                                                                            <span>Tax (GST)</span>
                                                                            <span className="text-red-600">+₹{finalTaxDisplay.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                        <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <span>Total Amount</span>
                                                            <span>₹{bill.total_amount.toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    {bill.payments && bill.payments.length > 0 && (
                                                        <>
                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 mt-4 border-t border-gray-100 dark:border-gray-800 pt-3">Payment History</h4>
                                                            <div className="space-y-1">
                                                                {bill.payments.map((p, i) => (
                                                                    <div key={i} className="flex justify-between text-xs text-gray-500">
                                                                        <span>{new Date(p.date).toLocaleString()} ({p.payment_mode})</span>
                                                                        <span className="font-medium text-gray-900 dark:text-gray-300">₹{parseFloat(p.amount).toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
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
                            <div className="print-only">
                                <BillTemplate bill={viewBill} settings={settings} className="block w-full min-h-[500px] shadow-lg" />
                            </div>
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


            {/* Update Payment Modal */}
            {
                showPayModal && payBillData && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Update Payment</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Amount to Pay (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-lg font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Balance Due: ₹{payBillData.balance_due || (payBillData.total_amount - (payBillData.amount_paid || 0))}</p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 uppercase mb-2 block">Payment Mode</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Cash', 'UPI/Online'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setPaymentMode(mode)}
                                                className={`py-2 rounded-lg border text-sm font-medium transition-all ${paymentMode === mode
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button onClick={() => setShowPayModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                    <button
                                        onClick={async () => {
                                            if (window.api) {
                                                const paid = parseFloat(paymentAmount) || 0;
                                                const totalPaid = (payBillData.amount_paid || 0) + paid;
                                                const newBalance = Math.max(0, payBillData.total_amount - totalPaid);
                                                const status = newBalance <= 0 ? 'Paid' : 'Partial';

                                                try {
                                                    await window.api.updateBillPayment({
                                                        billId: payBillData.id,
                                                        amountPaid: totalPaid,
                                                        paymentMode: paymentMode, // Updates last payment mode
                                                        status,
                                                        balanceDue: newBalance,
                                                        newPaymentAmount: paid
                                                    });

                                                    loadBills();
                                                    setShowPayModal(false);
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            }
                                        }}
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/30 active:scale-95"
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div >
                )
            }

            {/* Return Item Modal */}
            {showReturnModal && returnItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in text-gray-900 dark:text-white">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3 text-orange-600">
                                <RotateCcw size={24} />
                                <h3 className="text-xl font-black">Process Return</h3>
                            </div>
                            <button onClick={() => setShowReturnModal(false)}><X size={20} /></button>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-500/10 p-4 rounded-2xl mb-6 border border-orange-100 dark:border-orange-500/20">
                            <p className="text-sm font-bold text-orange-700 dark:text-orange-400">{returnItem.product_name}</p>
                            <p className="text-xs text-orange-600/70 mt-1"> Purchased Qty: {returnItem.quantity}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Return Quantity</label>
                                <input
                                    type="number"
                                    max={returnItem.quantity}
                                    min={1}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 font-bold text-lg focus:border-orange-500 outline-none transition-all"
                                    value={returnQty}
                                    onChange={(e) => setReturnQty(Math.min(returnItem.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Reason for Return</label>
                                <textarea
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none h-24 resize-none transition-all"
                                    placeholder="Explain why the customer is returning this item..."
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                />
                                <div className="flex items-center gap-2 mt-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-500/5 p-2 rounded-lg">
                                    <AlertCircle size={14} />
                                    Refund Amount: ₹{(returnItem.price_at_sale * returnQty).toFixed(2)}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => setShowReturnModal(false)}
                                    className="flex-1 py-4 font-bold text-gray-500 hover:text-gray-900 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (window.api) {
                                            try {
                                                await window.api.processReturn({
                                                    bill_id: activeBill.id,
                                                    product_id: returnItem.product_id,
                                                    quantity: returnQty,
                                                    refund_amount: returnItem.price_at_sale * returnQty,
                                                    reason: returnReason
                                                });
                                                loadBills();
                                                setShowReturnModal(false);
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }
                                    }}
                                    className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-500/30 active:scale-95 transition-all"
                                >
                                    Confirm Refund
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default BillHistory;
