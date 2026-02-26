import { useState, useEffect } from 'react';
import { Truck, Search, Plus, Edit2, Trash2, X, Phone, Mail, MapPin, User, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Suppliers = () => {
    const { addToast } = useToast();
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        if (window.api) {
            const data = await window.api.getSuppliers();
            setSuppliers(data);
        }
    };

    const handleAddSupplier = async (e) => {
        e.preventDefault();
        try {
            await window.api.addSupplier(currentSupplier);
            addToast('Supplier added successfully', 'success');
            setIsAddModalOpen(false);
            setCurrentSupplier({ name: '', phone: '', email: '', address: '' });
            fetchSuppliers();
        } catch (err) {
            addToast('Failed to add supplier', 'error');
        }
    };

    const handleUpdateSupplier = async (e) => {
        e.preventDefault();
        try {
            await window.api.updateSupplier(currentSupplier);
            addToast('Supplier updated successfully', 'success');
            setIsEditModalOpen(false);
            fetchSuppliers();
        } catch (err) {
            addToast('Failed to update supplier', 'error');
        }
    };

    const handleDeleteSupplier = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                await window.api.deleteSupplier(id);
                addToast('Supplier deleted', 'success');
                fetchSuppliers();
            } catch (err) {
                addToast('Failed to delete supplier', 'error');
            }
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm))
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Suppliers</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your product vendors and procurement contacts</p>
                </div>
                <button
                    onClick={() => {
                        setCurrentSupplier({ name: '', phone: '', email: '', address: '' });
                        setIsAddModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Add New Supplier
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-6 flex items-center gap-4">
                <Search className="text-gray-400 ml-2" size={20} />
                <input
                    type="text"
                    placeholder="Search suppliers by name or phone..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 dark:bg-blue-500/5 rounded-full -z-0 group-hover:scale-110 transition-transform"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-2xl">
                                    <Truck size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setCurrentSupplier(supplier);
                                            setIsEditModalOpen(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSupplier(supplier.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-1">{supplier.name}</h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                    <Phone size={16} className="text-gray-400" />
                                    <span className="text-sm font-medium">{supplier.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                    <Mail size={16} className="text-gray-400" />
                                    <span className="text-sm font-medium truncate">{supplier.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                                    <MapPin size={16} className="text-gray-400 mt-1" />
                                    <span className="text-sm font-medium line-clamp-2">{supplier.address || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                                <span className="flex items-center gap-1 font-medium italic">
                                    <Calendar size={14} />
                                    Joined: {new Date(supplier.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal (Combined logic for brevity) */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {isAddModalOpen ? 'Add New Supplier' : 'Edit Supplier'}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
                                    {isAddModalOpen ? 'Register a new vendor for your items' : 'Update the procurement details'}
                                </p>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-2xl transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={isAddModalOpen ? handleAddSupplier : handleUpdateSupplier} className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Supplier Name</label>
                                <div className="relative">
                                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="e.g. Reliance Oil Refineries"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                        value={currentSupplier.name}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="tel"
                                            placeholder="+91..."
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                            value={currentSupplier.phone}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            placeholder="vendor@company.com"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                            value={currentSupplier.email}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                                    <textarea
                                        placeholder="Warehouse address, City, State..."
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white h-24 resize-none"
                                        value={currentSupplier.address}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, address: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-4 rounded-2xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-95">
                                    {isAddModalOpen ? 'Create Supplier' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
