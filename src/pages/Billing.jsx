import { useState, useEffect, useRef } from 'react';
import { Printer, X, Search, User, CreditCard, Percent, ShoppingCart, IndianRupee, Check, Package, Trash2, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import BillTemplate from '../components/BillTemplate';
import Dropdown from '../components/Dropdown';

const Billing = () => {
    const { addToast } = useToast();
    const [sellers, setSellers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [productSuggestions, setProductSuggestions] = useState([]);
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    // UI Loading & Mode
    const [loading, setLoading] = useState(false);
    const [calculationMode, setCalculationMode] = useState('global'); // 'global' or 'itemized'

    const [paymentMode, setPaymentMode] = useState('Cash'); // Cash, UPI/Online
    // New Payment State
    const [paymentStatus, setPaymentStatus] = useState('Paid'); // Paid, Partial, Unpaid
    const [amountPaid, setAmountPaid] = useState(''); // For Partial input
    const [balanceDue, setBalanceDue] = useState(0);

    // Global Discount State
    const [globalDiscountValue, setGlobalDiscountValue] = useState(0);
    const [globalDiscountType, setGlobalDiscountType] = useState('amount'); // 'amount' or 'percent'

    // Global Tax State
    const [globalTaxRate, setGlobalTaxRate] = useState(0); // GST %

    // Customer State
    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Bill State
    const [currentBillId, setCurrentBillId] = useState(null);
    const [lastBillData, setLastBillData] = useState(null); // For template
    const [showBillModal, setShowBillModal] = useState(false);
    const [settings, setSettings] = useState({});

    const searchInputRef = useRef(null);

    useEffect(() => {
        loadData();
        loadSettings();
        const handleKeyDown = (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'F12') {
                e.preventDefault();
                if (cart.length > 0) {
                    handleCheckout();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products.length]); // Re-bind if products load or just once

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

    const loadData = async () => {
        if (window.api) {
            try {
                setLoading(true);
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
            } catch (err) {
                console.error("Failed to load initial data", err);
                addToast('Failed to load data', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    // Product Search & Add Logic
    useEffect(() => {
        if (searchTerm.length >= 1) {
            const matches = products.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.batch_number && p.batch_number.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setProductSuggestions(matches);
            setShowProductSuggestions(true);
        } else {
            setProductSuggestions([]);
            setShowProductSuggestions(false);
        }
    }, [searchTerm, products]);

    const addToCart = (product) => {
        if (product.quantity <= 0) {
            return addToast('Item is out of stock', 'error');
        }

        const existing = cart.find(item => item.id === product.id);

        if (existing) {
            if (existing.count < product.quantity) {
                updateQuantity(product.id, existing.count + 1);
                addToast(`Added another ${product.name}`, 'success');
            } else {
                addToast(`Only ${product.quantity} items available in stock`, 'error');
            }
        } else {
            // New Item Structure for Itemized Calculation
            setCart([...cart, {
                ...product,
                count: 1,
                // Default itemized values
                discountValue: 0,
                discountType: 'amount',
                taxRate: 0 // Optional: Infer from product if available in future
            }]);
            addToast(`${product.name} added`, 'success');
        }

        // Reset Search
        setSearchTerm('');
        setShowProductSuggestions(false);
        if (searchInputRef.current) searchInputRef.current.focus();
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

    const updateItemField = (id, field, value) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    // --- Calculation Logic ---

    const calculateItemTotal = (item) => {
        const basePrice = item.price * item.count;
        let discount = 0;

        if (calculationMode === 'itemized') {
            if (item.discountType === 'percent') {
                discount = basePrice * (parseFloat(item.discountValue || 0) / 100);
            } else {
                discount = parseFloat(item.discountValue || 0);
            }
        }

        const afterDiscount = Math.max(0, basePrice - discount);

        let tax = 0;
        if (calculationMode === 'itemized') {
            tax = afterDiscount * (parseFloat(item.taxRate || 0) / 100);
        }

        return {
            basePrice,
            discount,
            tax,
            final: afterDiscount + tax
        };
    };

    const calculateBillDetails = () => {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        let grandTotal = 0;

        if (calculationMode === 'global') {
            // Standard Logic
            subtotal = cart.reduce((sum, item) => sum + (item.price * item.count), 0);

            let globalDisc = 0;
            if (globalDiscountType === 'percent') {
                globalDisc = subtotal * (globalDiscountValue / 100);
            } else {
                globalDisc = parseFloat(globalDiscountValue) || 0;
            }
            totalDiscount = globalDisc;

            const afterDiscount = Math.max(0, subtotal - totalDiscount);

            const taxAmount = afterDiscount * (globalTaxRate / 100);
            totalTax = taxAmount;

            grandTotal = afterDiscount + taxAmount;
        } else {
            // Itemized Logic
            cart.forEach(item => {
                const { basePrice, discount, tax, final } = calculateItemTotal(item);
                subtotal += basePrice;
                totalDiscount += discount;
                totalTax += tax;
                grandTotal += final;
            });
        }

        return {
            subtotal,
            discount: totalDiscount,
            taxableAmount: grandTotal - totalTax, // Approx
            taxAmount: totalTax,
            total: grandTotal
        };
    };

    // Calculate Balance Due whenever Total or Amount Paid changes
    useEffect(() => {
        const { total } = calculateBillDetails();
        if (paymentStatus === 'Paid') {
            setBalanceDue(0);
            setAmountPaid(total.toFixed(2));
        } else if (paymentStatus === 'Unpaid') {
            setBalanceDue(total);
            setAmountPaid('0');
        } else {
            // Partial
            const paid = parseFloat(amountPaid) || 0;
            setBalanceDue(Math.max(0, total - paid));
        }
    }, [cart, globalDiscountValue, globalDiscountType, globalTaxRate, calculationMode, paymentStatus, amountPaid]);

    const processCheckout = async (shouldOpenModal = false) => {
        if (!selectedSeller) return addToast('Please select a seller', 'error');
        if (cart.length === 0) return addToast('Cart is empty', 'error');
        if (!customer.name || !customer.phone) return addToast('Please enter customer details', 'error');

        setLoading(true);
        const { subtotal, discount, taxableAmount, taxAmount, total } = calculateBillDetails();

        // Check stock availability one last time? (Optional but good practice)
        // ...

        const billData = {
            employee_id: selectedSeller.type === 'employee' ? selectedSeller.id : null,
            customer: { ...customer, seller_name: selectedSeller.name },
            // Filter necessary item fields
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                batch_number: item.batch_number,
                price: item.price,
                count: item.count,
                // Save itemized details regardless of mode, but they only matter if mode matches
                discountValue: item.discountValue,
                discountType: item.discountType,
                taxRate: item.taxRate
            })),
            total_amount: total,
            date: new Date().toISOString(),

            paymentMode: {
                mode: paymentMode,
                status: paymentStatus,
                amountPaid: parseFloat(amountPaid) || 0,
                balanceDue: balanceDue
            },

            // Save Calculation Details
            calculationMode,

            // Global Values (relevant if mode is global)
            discountValue: parseFloat(globalDiscountValue) || 0,
            discountType: globalDiscountType,
            taxRate: parseFloat(globalTaxRate) || 0,

            // Computed Totals for Receipt
            discountAmount: discount,
            taxAmount: taxAmount
        };

        if (window.api) {
            try {
                const billId = await window.api.createBill(billData);
                setCurrentBillId(billId);

                // Prepare data for template
                setLastBillData({ ...billData, id: billId });

                await loadData(); // Refresh stock
                setCart([]);
                addToast('Bill Created Successfully!', 'success');

                if (shouldOpenModal) {
                    setShowBillModal(true);
                }
            } catch (err) {
                console.error(err);
                addToast('Failed to create bill', 'error');
            }
        }
        setLoading(false);
    };

    const handleCheckout = () => processCheckout(false);
    const handlePrintAndComplete = () => processCheckout(true);

    const handlePrint = async () => {
        if (!lastBillData) return;
        document.body.classList.add("printing");
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.body.classList.remove("printing");
            }, 500);
        }, 100);
    };

    const resetBill = () => {
        setCart([]);
        setCurrentBillId(null);
        setLastBillData(null);
        setSelectedSeller(null);
        setCustomer({ name: '', phone: '' });
        setPaymentMode('Cash');
        setPaymentStatus('Paid');
        setAmountPaid('');
        setBalanceDue(0);
        setGlobalDiscountValue(0);
        setGlobalDiscountType('amount');
        setGlobalTaxRate(0);
        addToast('New bill started', 'info');
    };

    // Calculate totals for rendering
    const totals = calculateBillDetails();

    return (
        <div className="flex flex-col gap-6 p-6 pb-20">

            {/* Print Template (Hidden) */}
            <div className="print-only">
                <BillTemplate bill={lastBillData} settings={settings} />
            </div>

            {/* TOP BAR: Seller & Customer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
                {/* Seller Selection */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Seller</h2>
                    <Dropdown
                        options={sellers.map(s => ({ value: s.id, label: s.name + (s.displayRole ? ` (${s.displayRole})` : '') }))}
                        value={selectedSeller?.id}
                        onChange={(val) => {
                            const seller = sellers.find(s => s.id === val);
                            setSelectedSeller(seller);
                        }}
                        label="Select Staff Member"
                        icon={Users}
                    />
                </div>

                {/* Customer Details */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col relative z-40">
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Customer</h2>
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                className="w-full pl-10 bg-gray-50 dark:bg-gray-800 border-none p-3 rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 ring-blue-500/20"
                                value={customer.phone}
                                onChange={(e) => handleCustomerSearch(e.target.value, 'phone')}
                            />
                        </div>
                        <div className="flex-[1.5] relative">
                            <input
                                type="text"
                                placeholder="Customer Name"
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none p-3 rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 ring-blue-500/20"
                                value={customer.name}
                                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto z-50">
                                    {suggestions.map(s => (
                                        <div
                                            key={s.id}
                                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                                            onClick={() => selectCustomer(s)}
                                        >
                                            <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                                            <p className="text-gray-500">{s.phone}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MIDDLE: Search & Cart Table (Consolidated View) */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl flex flex-col">

                {/* Search Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-4 relative z-30">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Type to search products (e.g. 'Engine Oil')..."
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {/* Product Suggestions Dropdown */}
                        {showProductSuggestions && productSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-[60vh] overflow-y-auto z-50">
                                {productSuggestions.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className={`p-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors flex justify-between items-center group ${product.quantity === 0 ? 'opacity-60 grayscale' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-base">{product.name}</h4>
                                                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono">{product.batch_number || 'N/A'}</span>
                                                    <span className={product.quantity < 5 ? 'text-red-500 font-bold' : 'text-green-600'}>Stock: {product.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg text-gray-900 dark:text-white">₹{product.price}</div>
                                            {product.quantity > 0 && <div className="text-xs text-blue-600 font-medium group-hover:underline">Add to Bill</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Calculation Mode Toggle */}
                    <div className="shrink-0 flex items-center bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                        <button
                            onClick={() => setCalculationMode('global')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${calculationMode === 'global' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Overall Tax/Disc
                        </button>
                        <button
                            onClick={() => setCalculationMode('itemized')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${calculationMode === 'itemized' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Per Item
                        </button>
                    </div>
                </div>

                {/* Main Cart Table */}
                <div className="bg-gray-50 dark:bg-gray-900/50 relative min-h-[500px]">
                    {cart.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-60">
                            <ShoppingCart size={64} className="mb-4" strokeWidth={1} />
                            <p className="text-xl font-medium">Cart is empty</p>
                            <p className="text-sm mt-1">Search for products to add them to the bill</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white dark:bg-gray-800 sticky top-0 z-10 shadow-sm text-xs uppercase text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="p-4 w-[5%]">#</th>
                                    <th className="p-4 w-[25%]">Product</th>
                                    <th className="p-4 w-[15%] text-right">Price</th>
                                    <th className="p-4 w-[15%] text-center">Qty</th>
                                    {calculationMode === 'itemized' && (
                                        <>
                                            <th className="p-4 w-[15%] text-center">Discount</th>
                                            <th className="p-4 w-[10%] text-center">Tax %</th>
                                        </>
                                    )}
                                    <th className="p-4 w-[15%] text-right bg-blue-50/20 dark:bg-blue-900/5">Total</th>
                                    <th className="p-4 w-[5%]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                                {cart.map((item, idx) => {
                                    const itemTotals = calculateItemTotal(item);
                                    return (
                                        <tr key={item.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="p-4 text-gray-400">{idx + 1}</td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-0.5">{item.batch_number}</div>
                                            </td>
                                            <td className="p-4 text-right font-mono">₹{item.price}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => updateQuantity(item.id, item.count - 1)} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors">-</button>
                                                    <span className="w-8 text-center font-bold">{item.count}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.count + 1)} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors">+</button>
                                                </div>
                                            </td>

                                            {calculationMode === 'itemized' && (
                                                <>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-white dark:bg-gray-800">
                                                            <input
                                                                type="number"
                                                                className="w-16 min-w-0 bg-transparent text-right outline-none text-sm"
                                                                placeholder="0"
                                                                value={item.discountValue}
                                                                onChange={(e) => updateItemField(item.id, 'discountValue', e.target.value)}
                                                            />
                                                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded overflow-hidden shrink-0">
                                                                <button
                                                                    onClick={() => updateItemField(item.id, 'discountType', 'amount')}
                                                                    className={`px-1.5 py-1 ${item.discountType === 'amount' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                                                                ><IndianRupee size={12} /></button>
                                                                <button
                                                                    onClick={() => updateItemField(item.id, 'discountType', 'percent')}
                                                                    className={`px-1.5 py-1 ${item.discountType === 'percent' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                                                                ><Percent size={12} /></button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-white dark:bg-gray-800">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-transparent text-center outline-none text-sm"
                                                                placeholder="0"
                                                                value={item.taxRate}
                                                                onChange={(e) => updateItemField(item.id, 'taxRate', e.target.value)}
                                                            />
                                                            <span className="text-gray-400 pr-1">%</span>
                                                        </div>
                                                    </td>
                                                </>
                                            )}

                                            <td className="p-4 text-right font-bold text-gray-900 dark:text-white bg-blue-50/20 dark:bg-blue-900/5">
                                                ₹{itemTotals.final.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Footer Row in Table for visual weight */}
                                <tr className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                    <td colSpan={calculationMode === 'itemized' ? 7 : 5} className="p-8"></td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Controls & Totals */}
                <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex flex-col xl:flex-row gap-8">

                    {/* LEFT: Controls (Discount, Tax, Payment) */}
                    <div className="flex-1 space-y-6">
                        {/* Global Settings (Only visible in Global Mode) */}
                        {calculationMode === 'global' && (
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Global Discount</label>
                                    <div className="flex gap-2">
                                        <div className="flex bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 flex-shrink-0">
                                            <button onClick={() => setGlobalDiscountType('amount')} className={`p-2 rounded-md ${globalDiscountType === 'amount' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-400'}`}><IndianRupee size={16} /></button>
                                            <button onClick={() => setGlobalDiscountType('percent')} className={`p-2 rounded-md ${globalDiscountType === 'percent' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-400'}`}><Percent size={16} /></button>
                                        </div>
                                        <input
                                            type="number"
                                            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 outline-none focus:border-blue-500"
                                            value={globalDiscountValue}
                                            onChange={(e) => setGlobalDiscountValue(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Global Tax (%)</label>
                                    <div className="flex items-center gap-2">
                                        {[0, 5, 12, 18].map(r => (
                                            <button key={r} onClick={() => setGlobalTaxRate(r)} className={`px-3 py-2 rounded-lg border text-sm font-medium ${globalTaxRate === r ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-gray-500'}`}>{r}%</button>
                                        ))}
                                        <input
                                            type="number"
                                            className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                            value={globalTaxRate}
                                            onChange={(e) => setGlobalTaxRate(e.target.value)}
                                            placeholder="%"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-6">
                            {/* Payment Mode */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Payment Mode</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setPaymentMode('Cash')} className={`px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium flex items-center gap-2 ${paymentMode === 'Cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : ''}`}>
                                        <IndianRupee size={14} /> Cash
                                    </button>
                                    <button onClick={() => setPaymentMode('UPI/Online')} className={`px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium flex items-center gap-2 ${paymentMode === 'UPI/Online' ? 'bg-purple-50 border-purple-500 text-purple-700' : ''}`}>
                                        <CreditCard size={14} /> UPI
                                    </button>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Payment Status</label>
                                <div className="flex items-center gap-3">
                                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                        {['Paid', 'Partial', 'Unpaid'].map(s => (
                                            <button key={s} onClick={() => setPaymentStatus(s)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${paymentStatus === s ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500'}`}>{s}</button>
                                        ))}
                                    </div>
                                    {paymentStatus === 'Partial' && (
                                        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg text-yellow-700">
                                            <span className="text-xs font-bold">PAID: ₹</span>
                                            <input
                                                type="number"
                                                className="w-20 bg-transparent outline-none font-bold"
                                                value={amountPaid}
                                                onChange={(e) => setAmountPaid(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Totals & Final Buttons */}
                    <div className="w-full xl:w-96 flex flex-col gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>₹{totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-₹{totals.discount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Tax</span>
                                <span>+₹{totals.taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between items-center px-1">
                                <span className="font-bold text-xl text-gray-900 dark:text-white">Total</span>
                                <span className="font-bold text-3xl text-blue-600">₹{totals.total.toFixed(2)}</span>
                            </div>
                            {(paymentStatus === 'Partial' || paymentStatus === 'Unpaid') && (
                                <div className="flex justify-between items-center text-red-500 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                                    <span>Balance Due</span>
                                    <span>₹{balanceDue.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                className="flex-1 bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg py-3 flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
                                onClick={handlePrintAndComplete}
                                disabled={loading || cart.length === 0}
                            >
                                <Printer size={20} />
                                Print
                            </button>
                            <button
                                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                                onClick={handleCheckout}
                                disabled={loading || cart.length === 0}
                            >
                                <Check size={20} />
                                Complete Bill
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bill Success Modal */}
            {showBillModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Bill Created Successfully</h2>
                            <button onClick={() => setShowBillModal(false)}><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-100 p-6 flex justify-center">
                            <BillTemplate bill={lastBillData} settings={settings} className="block w-full min-h-[500px] shadow-lg" />
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                            <button onClick={() => setShowBillModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Close</button>
                            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Printer size={18} /> Print</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
