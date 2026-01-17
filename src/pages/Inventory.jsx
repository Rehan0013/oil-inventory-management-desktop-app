import { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertCircle, Trash2, Edit2, X, RotateCcw, ArrowUpCircle, Filter, SortAsc } from 'lucide-react';
import Dropdown from '../components/Dropdown';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Inventory = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false); // New Modal state
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, low_stock, out_of_stock
    const [sortBy, setSortBy] = useState('name'); // name, price_asc, price_desc, quantity_asc, quantity_desc
    const [loading, setLoading] = useState(false);

    const [currentProduct, setCurrentProduct] = useState({
        id: null,
        name: '',
        quantity: '',
        price: '',
        description: '',
        batchNumber: ''
    });

    const [stockToAdd, setStockToAdd] = useState(''); // State for adding stock

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        if (window.api) {
            setLoading(true);
            try {
                const data = await window.api.getProducts();
                setProducts(data);
            } catch (err) {
                console.error(err);
                addToast('Failed to load products', 'error');
            }
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode('add');
        setCurrentProduct({ id: null, name: '', quantity: '', price: '', description: '', batchNumber: '' });
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        // Map database snake_case to frontend camelCase
        setCurrentProduct({ ...product, batchNumber: product.batch_number || product.batchNumber || '' });
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
            await loadProducts();
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
            await loadProducts();
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
                    await loadProducts();
                    addToast('Product deleted', 'success');
                } catch (err) {
                    console.error(err);
                    addToast('Failed to delete product', 'error');
                }
            }
        }
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

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage stock, prices, and product details</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* Filters & Sort */}
                    <div className="flex gap-2 z-20">
                        <Dropdown
                            options={filterOptions}
                            value={filterStatus}
                            onChange={setFilterStatus}
                            icon={Filter}
                            label="Filter"
                        />
                        <Dropdown
                            options={sortOptions}
                            value={sortBy}
                            onChange={setSortBy}
                            icon={SortAsc}
                            label="Sort"
                        />
                    </div>

                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full md:w-64 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Allow Owner AND Workers to Add Product */}
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/30 font-medium active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={20} />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                                <th className="p-4 font-semibold">Product Name</th>
                                <th className="p-4 font-semibold">Batch</th>
                                <th className="p-4 font-semibold">Stock Level</th>
                                <th className="p-4 font-semibold">Price</th>
                                <th className="p-4 font-semibold">Description</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        Loading inventory...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-gray-500">
                                        <Package className="mx-auto h-12 w-12 opacity-20 mb-3" />
                                        <p>No products found matching "{searchTerm}"</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                                <Package size={20} />
                                            </div>
                                            <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                                        {product.batch_number || '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${product.quantity < 10
                                            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                                            : 'bg-green-50 border-green-200 text-green-600 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400'
                                            }`}>
                                            {product.quantity < 10 && <AlertCircle size={12} className="mr-1.5" />}
                                            {product.quantity} Units
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-900 dark:text-white font-medium">₹{product.price.toFixed(2)}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm max-w-xs truncate">{product.description || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Add Stock Button - Visible to Everyone */}
                                            <button
                                                onClick={() => openAddStockModal(product)}
                                                className="text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg"
                                                title="Add Stock"
                                            >
                                                <ArrowUpCircle size={18} />
                                            </button>

                                            {/* Edit Button - Visible to Everyone */}
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"
                                                title="Edit Product"
                                            >
                                                <Edit2 size={18} />
                                            </button>

                                            {/* Delete Button - OWNER ONLY */}
                                            {user?.role === 'owner' && (
                                                <button
                                                    onClick={() => handleDelete(product.id, product.name)}
                                                    className="text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                                    title="Delete Product"
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

            {/* Add/Edit Product Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Product Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 5W-30 Synthetic Oil"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                        value={currentProduct.name}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Batch Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. BATCH-001"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                        value={currentProduct.batchNumber || ''}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, batchNumber: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Quantity</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                            value={currentProduct.quantity}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Price (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                            value={currentProduct.price}
                                            onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Description</label>
                                    <textarea
                                        placeholder="Optional product details..."
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none h-24 resize-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                        value={currentProduct.description}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/40 active:scale-95"
                                    >
                                        {modalMode === 'add' ? 'Add Product' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Add Stock Modal */}
            {
                showStockModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Stock</h2>
                                <button onClick={() => setShowStockModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleStockSubmit} className="space-y-6">
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Product</p>
                                    <p className="font-medium text-gray-900 dark:text-white mb-2">{currentProduct.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>Current Stock:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{currentProduct.quantity}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Units to Add</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Enter quantity"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-lg font-medium"
                                        value={stockToAdd}
                                        onChange={(e) => setStockToAdd(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowStockModal(false)}
                                        className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-900/40 active:scale-95 flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Add Stock
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Inventory;
