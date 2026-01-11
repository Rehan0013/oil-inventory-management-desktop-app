import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, User, X, Phone, Calendar, IndianRupee, Edit2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Employees = () => {
    const { addToast } = useToast();
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        phone: '',
        photo: '',
        joining_date: '',
        salary: ''
    });

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        if (window.api) {
            setLoading(true);
            try {
                const data = await window.api.getEmployees();
                setEmployees(data);
            } catch (err) {
                addToast('Failed to load employees', 'error');
            }
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode('add');
        setFormData({ id: null, name: '', phone: '', photo: '', joining_date: '', salary: '' });
        setShowModal(true);
    };

    const openEditModal = (emp) => {
        setModalMode('edit');
        setFormData({ ...emp });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!window.api) return;

        try {
            if (modalMode === 'add') {
                await window.api.addEmployee(formData);
                addToast('Employee added successfully', 'success');
            } else {
                await window.api.updateEmployee(formData);
                addToast('Employee updated successfully', 'success');
            }
            await loadEmployees();
            setShowModal(false);
        } catch (err) {
            console.error(err);
            addToast(`Failed to ${modalMode} employee`, 'error');
        }
    };

    const handleDelete = async (id, name) => {
        if (confirm(`Are you sure you want to remove ${name}?`)) {
            if (window.api) {
                try {
                    await window.api.deleteEmployee(id);
                    await loadEmployees();
                    addToast('Employee removed', 'success');
                } catch (err) {
                    addToast('Failed to remove employee', 'error');
                }
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your team and sales staff</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/30 font-medium active:scale-95"
                >
                    <Plus size={20} />
                    Add Employee
                </button>
            </div>

            {loading ? (
                <div className="text-center text-gray-500 py-12">Loading employees...</div>
            ) : employees.length === 0 ? (
                <div className="text-center text-gray-500 py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <User className="mx-auto h-12 w-12 opacity-20 mb-3" />
                    <p>No employees found. Add your first team member.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((emp) => (
                        <div key={emp.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 relative group hover:border-blue-500/50 hover:shadow-xl transition-all duration-300">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(emp)}
                                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"
                                    title="Edit Employee"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(emp.id, emp.name)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                    title="Remove Employee"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-blue-500/30 group-hover:border-blue-500 transition-colors shadow-lg">
                                    {emp.photo ? (
                                        <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={32} className="text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{emp.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <Phone size={14} />
                                        <span>{emp.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-1">
                                        <IndianRupee size={12} />
                                        Salary
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-semibold">₹ {emp.salary}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-1">
                                        <Calendar size={12} />
                                        Joined
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-semibold">{emp.joining_date}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Employee Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{modalMode === 'add' ? 'Add New Employee' : 'Edit Employee'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="+1 234 567 890"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Photo URL (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                    value={formData.photo}
                                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Join Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                        value={formData.joining_date}
                                        onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Salary (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                        value={formData.salary}
                                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                        required
                                    />
                                </div>
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
                                    {modalMode === 'add' ? 'Create Employee' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
