import { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertCircle, Trash2, Edit2, X, RotateCcw, ArrowUpCircle, Filter, SortAsc, Download, Upload, AlertTriangle, IndianRupee } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Inventory = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [loading, setLoading] = useState(false);

    const [currentProduct, setCurrentProduct] = useState({
        id: null,
        name: '',
        quantity: '',
        price: '',
        description: '',
        batchNumber: '',
        unit_cost: '',
        category_id: '',
        supplier_id: ''
    });

    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [stockToAdd, setStockToAdd] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (window.api) {
            setLoading(true);
            try {
                const [productsData, categoriesData, suppliersData] = await Promise.all([
                    window.api.getProducts(),
                    window.api.getCategories(),
                    window.api.getSuppliers()
                ]);
                setProducts(productsData);
                setCategories(categoriesData);
                setSuppliers(suppliersData);
            } catch (err) {
                console.error(err);
                addToast('Failed to load inventory data', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const openCreateModal = () => {
        setModalMode('add');
        setCurrentProduct({ id: null, name: '', quantity: '', price: '', description: '', batchNumber: '', unit_cost: '', category_id: '', supplier_id: '' });
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        setCurrentProduct({
            ...product,
            batchNumber: product.batch_number || '',
            unit_cost: product.unit_cost || '',
            category_id: product.category_id || '',
            supplier_id: product.supplier_id || ''
        });
        setShowModal(true);
    };

    const openAddStockModal = (product) => {
        setCurrentProduct({ ...product });
        setStockToAdd('');
        setShowStockModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!window.api) return;

        try {
            if (modalMode === 'add') {
                await window.api.addProduct(currentProduct);
                addToast('Product added successfully', 'success');
            } else {
                await window.api.updateProduct(currentProduct);
                addToast('Product updated successfully', 'success');
            }
            await loadData();
            setShowModal(false);
        } catch (err) {
            console.error(err);
            addToast(`Failed to ${modalMode} product`, 'error');
        }
    };

    const handleStockSubmit = async (e) => {
        e.preventDefault();
        if (!window.api) return;

        const qtyToAdd = parseInt(stockToAdd);
        if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
            return addToast('Please enter a valid quantity', 'error');
        }

        try {
            const newTotal = parseInt(currentProduct.quantity) + qtyToAdd;
            await window.api.updateProductQuantity(currentProduct.id, newTotal);
            addToast(`Stock updated! New Total: ${newTotal}`, 'success');
            await loadData();
            setShowStockModal(false);
        } catch (err) {
            console.error(err);
            addToast('Failed to update stock', 'error');
        }
    };

    const handleDelete = async (id, name) => {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            if (window.api) {
                try {
                    await window.api.deleteProduct(id);
                    await loadData();
                    addToast('Product deleted', 'success');
                } catch (err) {
                    console.error(err);
                    addToast('Failed to delete product', 'error');
                }
            }
        }
    };

    const handleExport = async () => {
        try {
            const data = await window.api.exportInventory();
            const csvContent = "data:text/csv;charset=utf-8,"
                + "Name,Quantity,Price,Unit Cost,Batch,Description,Category,Supplier\n"
                + data.map(p => `${p.name},${p.quantity},${p.price},${p.unit_cost},${p.batch_number || ''},${(p.description || '').replace(/,/g, ' ')},${p.category || ''},${p.supplier || ''}`).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            addToast('Export successful', 'success');
        } catch (err) {
            addToast('Export failed', 'error');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n').filter(r => r.trim()).slice(1);
            const productsToImport = rows.map(row => {
                const cols = row.split(',');
                if (cols.length < 3) return null;
                return {
                    name: cols[0],
                    quantity: parseFloat(cols[1]),
                    price: parseFloat(cols[2]),
                    unit_cost: parseFloat(cols[3] || 0),
                    batch_number: cols[4] || '',
                    description: cols[5] || ''
                };
            }).filter(p => p !== null);

            try {
                await window.api.importInventory(productsToImport);
                addToast(`Successfully imported ${productsToImport.length} products`, 'success');
                loadData();
            } catch (err) {
                addToast('Import failed', 'error');
            }
        };
        reader.readAsText(file);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterStatus === 'all' ||
            (filterStatus === 'low_stock' && p.quantity > 0 && p.quantity < 10) ||
            (filterStatus === 'out_of_stock' && p.quantity === 0))
    ).sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'quantity_asc') return a.quantity - b.quantity;
        if (sortBy === 'quantity_desc') return b.quantity - a.quantity;
        return 0;
    });

    const filterOptions = [
        { label: 'All Products', value: 'all' },
        { label: 'Low Stock (< 10)', value: 'low_stock' },
        { label: 'Out of Stock', value: 'out_of_stock' }
    ];

    const sortOptions = [
        { label: 'Name (A-Z)', value: 'name' },
        { label: 'Price (Low to High)', value: 'price_asc' },
        { label: 'Price (High to Low)', value: 'price_desc' },
        { label: 'Stock (Low to High)', value: 'quantity_asc' },
        { label: 'Stock (High to Low)', value: 'quantity_desc' }
    ];

    const stats = {
        totalProducts: products.length,
        lowStock: products.filter(p => p.quantity > 0 && p.quantity < 10).length,
        outOfStock: products.filter(p => p.quantity === 0).length,
        totalValue: products.reduce((sum, p) => sum + (p.quantity * (p.unit_cost || 0)), 0)
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Inventory</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and track your product stock levels</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold transition-all border border-emerald-100 dark:border-emerald-500/20"
                        title="Export to CSV"
                    >
                        <Download size={18} />
                        <span>Export</span>
                    </button>
                    <label className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold cursor-pointer transition-all border border-blue-100 dark:border-blue-500/20" title="Import from CSV">
                        <Upload size={18} />
                        <span>Import</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                    </label>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={20} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Products</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalProducts}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Low Stock</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.lowStock}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl">
                            <X size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Out of Stock</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.outOfStock}</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Toolbar Section */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center mb-6">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products by name or batch..."
                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white pl-12 pr-4 py-3 rounded-2xl focus:border-blue-500 outline-none transition-all focus:ring-4 focus:ring-blue-500/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto z-20">
                    <Dropdown
                        options={filterOptions}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        icon={Filter}
                        label="Status"
                    />
                    <Dropdown
                        options={sortOptions}
                        value={sortBy}
                        onChange={setSortBy}
                        icon={SortAsc}
                        label="Sort By"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-[0.1em] border-b border-gray-100 dark:border-gray-800">
                                <th className="p-6 font-black">Product Details</th>
                                <th className="p-6 font-black">Batch Info</th>
                                <th className="p-6 font-black">Availability</th>
                                <th className="p-6 font-black text-emerald-600 dark:text-emerald-400">Unit Cost</th>
                                <th className="p-6 font-black">Selling Price</th>
                                <th className="p-6 font-black text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                            <p className="text-gray-400 font-medium">Fetching inventory...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-gray-400">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Package className="opacity-20" size={40} />
                                        </div>
                                        <p className="font-bold text-gray-500">No products match your search</p>
                                        <p className="text-sm opacity-60">Try adjusting your filters or search term</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                <Package size={22} />
                                            </div>
                                            <div>
                                                <span className="text-gray-900 dark:text-white font-bold block text-lg leading-tight mb-1">{product.name}</span>
                                                <div className="flex items-center gap-2">
                                                    {product.category && <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">{product.category}</span>}
                                                    {product.supplier && <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">{product.supplier}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 font-mono text-sm text-gray-500 dark:text-gray-400">
                                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                                            {product.batch_number || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className={`inline-flex flex-col`}>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-sm font-bold border ${product.quantity < 10
                                                ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                                                : 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                                }`}>
                                                <div className={`w-2 h-2 rounded-full animate-pulse ${product.quantity < 10 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                {product.quantity} Units
                                            </div>
                                            {product.quantity < 10 && (
                                                <span className="text-[10px] font-bold text-red-500 mt-1 ml-1 uppercase">{product.quantity === 0 ? 'Out of Stock' : 'Low Stock Warning'}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6 font-bold text-emerald-600 dark:text-emerald-400 text-lg">₹{(product.unit_cost || 0).toFixed(2)}</td>
                                    <td className="p-6 text-gray-900 dark:text-white font-black text-lg">₹{product.price.toFixed(2)}</td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openAddStockModal(product)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                                                title="Quick Stock Update"
                                            >
                                                <Plus size={20} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                                title="Edit Details"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {user?.role === 'owner' && (
                                                <button
                                                    onClick={() => handleDelete(product.id, product.name)}
                                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                    title="Remove Product"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white/20">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/30">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Please fill in all the details below</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-2">Product Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                                        value={currentProduct.name}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        placeholder="e.g. Engine Oil 5W-30"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-2">Initial Quantity</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                                        value={currentProduct.quantity}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-2 text-emerald-600">Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl px-5 py-4 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-lg"
                                        value={currentProduct.price}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-2 text-blue-600">Unit Cost (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl px-5 py-4 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-lg"
                                        value={currentProduct.unit_cost}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, unit_cost: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-2">Batch Number</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono"
                                        value={currentProduct.batchNumber}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, batchNumber: e.target.value })}
                                        placeholder="BATCH-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-2">Category</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                                        value={currentProduct.category_id}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, category_id: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-2">Supplier</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                                        value={currentProduct.supplier_id}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, supplier_id: e.target.value })}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-2">Description / Notes</label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all h-24 resize-none"
                                        value={currentProduct.description}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                        placeholder="Add any additional details or specs..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="pt-8 flex gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-8 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-95 text-lg">
                                    {modalMode === 'add' ? 'Create Product' : 'Apply Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showStockModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center bg-blue-600 text-white relative">
                            <button onClick={() => setShowStockModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-lg">
                                <RotateCcw size={32} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">Update Stock</h2>
                            <p className="mt-2 text-blue-100 font-bold opacity-80 uppercase tracking-widest text-xs">{currentProduct.name}</p>
                        </div>
                        <form onSubmit={handleStockSubmit} className="p-10">
                            <div className="mb-8">
                                <div className="flex justify-between items-end mb-4 px-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity to Add</label>
                                    <span className="text-xs font-bold text-gray-400">Current: {currentProduct.quantity}</span>
                                </div>
                                <input
                                    type="number"
                                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-[2rem] px-6 py-6 text-4xl font-black text-center text-gray-900 dark:text-white outline-none focus:ring-[12px] focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    value={stockToAdd}
                                    onChange={(e) => setStockToAdd(e.target.value)}
                                    placeholder="0"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowStockModal(false)} className="px-8 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/40 transition-all active:scale-95 text-lg">Update Inventory</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
