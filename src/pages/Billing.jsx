import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, Plus, Printer, X, Check, RefreshCw, Search, FileText, CreditCard, Percent, IndianRupee, Package } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import BillTemplate from '../components/BillTemplate';

const Billing = () => {
    const { addToast } = useToast();
    const [sellers, setSellers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentMode, setPaymentMode] = useState('Cash'); // Cash, UPI/Online

    // Discount State
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'

    // Customer State
    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Bill State
    const [currentBillId, setCurrentBillId] = useState(null);
    const [lastBillData, setLastBillData] = useState(null); // For template

    const templateRef = useRef();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (window.api) {
            const empData = await window.api.getEmployees();
            const userData = await window.api.getUsers();
            const prodData = await window.api.getProducts();

            const formattedEmployees = empData.map(e => ({ ...e, type: 'employee', displayRole: 'Staff' }));
            const formattedOwners = userData.filter(u => u.role === 'owner').map(u => ({
                id: `owner_${u.id}`,
                name: u.username,
                type: 'owner',
                displayRole: 'Owner',
                dbId: u.id
            }));

            setSellers([...formattedOwners, ...formattedEmployees]);
            setProducts(prodData);
        }
    };

    const handleCustomerSearch = async (value, field) => {
        setCustomer(prev => ({ ...prev, [field]: value }));

        if (value.length > 2 && window.api) {
            try {
                const results = await window.api.searchCustomers(value);
                setSuggestions(results);
                setShowSuggestions(true);
            } catch (err) {
                console.error(err);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectCustomer = (cust) => {
        setCustomer({ name: cust.name, phone: cust.phone });
        setShowSuggestions(false);
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.count < product.quantity) {
                setCart(cart.map(item => item.id === product.id ? { ...item, count: item.count + 1 } : item));
            } else {
                addToast(`Only ${product.quantity} items available in stock`, 'error');
            }
        } else {
            setCart([...cart, { ...product, count: 1 }]);
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const updateQuantity = (id, newCount) => {
        const count = parseInt(newCount);
        if (isNaN(count) || count < 1) return;

        setCart(cart.map(item => {
            if (item.id === id) {
                const product = products.find(p => p.id === id);
                if (count > product.quantity) {
                    addToast(`Cannot set ${count}. Only ${product.quantity} in stock.`, 'error');
                    return { ...item, count: product.quantity };
                }
                return { ...item, count: count };
            }
            return item;
        }));
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.count), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        let discount = 0;
        if (discountType === 'percent') {
            discount = subtotal * (discountValue / 100);
        } else {
            discount = parseFloat(discountValue) || 0;
        }
        return Math.max(0, subtotal - discount);
    };

    const handleCheckout = async () => {
        if (!selectedSeller) return addToast('Please select a seller', 'error');
        if (cart.length === 0) return addToast('Cart is empty', 'error');
        if (!customer.name || !customer.phone) return addToast('Please enter customer details', 'error');

        setLoading(true);
        const total = calculateTotal();

        const billData = {
            employee_id: selectedSeller.type === 'employee' ? selectedSeller.id : null,
            customer: { ...customer, seller_name: selectedSeller.name },
            items: cart,
            total_amount: total,
            date: new Date().toISOString(),
            paymentMode: paymentMode,
            discountValue: parseFloat(discountValue) || 0,
            discountType: discountType
        };

        if (window.api) {
            try {
                const billId = await window.api.createBill(billData);
                setCurrentBillId(billId);

                // Prepare data for template
                setLastBillData({ ...billData, id: billId });

                await loadData();
                setCart([]);
                addToast('Bill Created Successfully!', 'success');
            } catch (err) {
                console.error(err);
                addToast('Failed to create bill', 'error');
            }
        }
        setLoading(false);
    };

    const handlePrint = async () => {
        if (!lastBillData) return;
        window.print();
    };

    const handleSavePdf = async () => {
        if (window.api && window.api.savePdf) {
            const result = await window.api.savePdf();
            if (result.success) {
                addToast(`Saved to ${result.filePath}`, 'success');
            } else if (result.error) {
                addToast('Failed to save PDF', 'error');
            }
        }
    };

    const resetBill = () => {
        setCart([]);
        setCurrentBillId(null);
        setLastBillData(null);
        setSelectedSeller(null);
        setCustomer({ name: '', phone: '' });
        setPaymentMode('Cash');
        setDiscountValue(0);
        setDiscountType('amount');
        addToast('New bill started', 'info');
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6 p-6">

            {/* Hidden Print Template */}
            <div className="print-only">
                <BillTemplate bill={lastBillData} />
            </div>

            {/* Left Side: Product Selection */}
            <div className="flex-1 flex flex-col gap-6">

                {/* Employee/Seller Selection */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Seller</h2>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {sellers.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedSeller(s)}
                                className={`flex-shrink-0 cursor-pointer p-3 rounded-lg border transition-all min-w-[150px] ${selectedSeller?.id === s.id
                                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-600/20 dark:border-blue-500'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                                        {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <User className="p-2 w-full h-full text-gray-500 dark:text-gray-400" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className={`font-medium text-sm truncate ${selectedSeller?.id === s.id ? 'text-blue-700 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{s.name}</p>
                                        <p className={`text-xs truncate ${selectedSeller?.id === s.id ? 'text-blue-600/70 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>{s.displayRole}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product List */}
                {/* Product List */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder-gray-500 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 custom-scrollbar content-start">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className={`group relative bg-white dark:bg-gray-800 p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3 ${product.quantity === 0
                                    ? 'opacity-60 grayscale border-gray-200 dark:border-gray-700'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 cursor-pointer'
                                    }`}
                                onClick={() => product.quantity > 0 && addToCart(product)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${product.quantity > 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                                        <Package size={20} />
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${product.quantity === 0
                                        ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                        : product.quantity < 5
                                            ? 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-300'
                                            : 'bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-300'
                                        }`}>
                                        {product.quantity === 0 ? 'Out of Stock' : `${product.quantity} Left`}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1" title={product.name}>{product.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Unit Price</p>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">₹{product.price}</span>
                                    {product.quantity > 0 && (
                                        <button className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md transform translate-x-2 group-hover:translate-x-0">
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side: Cart, Customer & Checkout */}
            <div className="w-full lg:w-96 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col shadow-xl transition-colors duration-300">

                {/* Customer Details */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User size={20} /> Customer
                    </h2>
                    <input
                        type="tel"
                        placeholder="Contact No."
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                        value={customer.phone}
                        onChange={(e) => handleCustomerSearch(e.target.value, 'phone')}
                    />
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Customer Name"
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                            value={customer.name}
                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 mt-1 max-h-48 overflow-y-auto">
                                {suggestions.map(s => (
                                    <div
                                        key={s.id}
                                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        onClick={() => selectCustomer(s)}
                                    >
                                        <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                                        <p className="text-xs text-gray-500">{s.phone}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
                            <ShoppingCart size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bill</h2>
                    </div>
                    <button onClick={resetBill} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" title="New Bill">
                        <RefreshCw size={18} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-auto p-4 space-y-3 custom-scrollbar min-h-[200px]">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                            <ShoppingCart size={48} className="mb-2 opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : cart.map(item => (
                        <div key={item.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center group border border-transparent dark:border-gray-700">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">₹{(item.price * item.count).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    onClick={() => updateQuantity(item.id, item.count - 1)}
                                >-</button>
                                <input
                                    type="number"
                                    className="w-8 text-center bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none"
                                    value={item.count || 0}
                                    onChange={(e) => updateQuantity(item.id, e.target.value)}
                                />
                                <button
                                    className="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    onClick={() => updateQuantity(item.id, item.count + 1)}
                                >+</button>
                            </div>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer Section */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 backdrop-blur-sm space-y-4">

                    {/* Discount Input */}
                    <div className="flex gap-2">
                        <div className="flex bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-1 flex-shrink-0">
                            <button
                                onClick={() => setDiscountType('amount')}
                                className={`p-2 rounded-md transition-all ${discountType === 'amount' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                title="Fixed Amount (₹)"
                            >
                                <IndianRupee size={16} />
                            </button>
                            <button
                                onClick={() => setDiscountType('percent')}
                                className={`p-2 rounded-md transition-all ${discountType === 'percent' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                title="Percentage (%)"
                            >
                                <Percent size={16} />
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <input
                                type="number"
                                placeholder="Discount"
                                className="w-full h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                                value={discountValue || ''}
                                onChange={(e) => setDiscountValue(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentMode('Cash')}
                            className={`py-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${paymentMode === 'Cash'
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                }`}
                        >
                            <IndianRupee className={paymentMode === 'Cash' ? 'text-emerald-500' : 'text-gray-400'} size={16} />
                            Cash
                        </button>
                        <button
                            onClick={() => setPaymentMode('UPI/Online')}
                            className={`py-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${paymentMode === 'UPI/Online'
                                ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                }`}
                        >
                            <CreditCard className={paymentMode === 'UPI/Online' ? 'text-purple-500' : 'text-gray-400'} size={16} />
                            UPI
                        </button>
                    </div>

                    {/* Totals */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>₹{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        {discountValue > 0 && (
                            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                <span>Discount ({discountType === 'percent' ? `${discountValue}%` : '₹'})</span>
                                <span>-₹{(calculateSubtotal() - calculateTotal()).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-gray-900 dark:text-white">Total</span>
                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">
                                ₹{calculateTotal().toFixed(2)}
                            </span>
                        </div>
                    </div>


                    <button
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg py-3 flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-70"
                        onClick={handleCheckout}
                        disabled={loading || cart.length === 0}
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Check size={18} />}
                        {loading ? 'Processing...' : 'Complete Bill'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Billing;
