import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, User, X, Phone, Calendar, IndianRupee, Edit2, History, CreditCard } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Employees = () => {
    const { addToast } = useToast();
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        phone: '',
        photo: '',
        joining_date: '',
        salary: ''
    });

    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [salaryForm, setSalaryForm] = useState({
        amount: '',
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear().toString(),
        mode: 'Cash'
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

    const loadSalaryHistory = async (empId) => {
        if (window.api) {
            try {
                const data = await window.api.getSalaryHistory(empId);
                setSalaryHistory(data);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handlePaySalary = async (e) => {
        e.preventDefault();
        if (!window.api || !selectedEmp) return;
        try {
            await window.api.paySalary({
                employee_id: selectedEmp.id,
                ...salaryForm
            });
            await loadSalaryHistory(selectedEmp.id);
            addToast('Salary payment recorded', 'success');
            setShowSalaryModal(false);
        } catch (err) {
            addToast('Failed to record payment', 'error');
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
                    <p>No employees found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((emp) => (
                        <div key={emp.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 relative group hover:border-blue-500/50 transition-all duration-300">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(emp)} className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(emp.id, emp.name)} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-lg">
                                    {emp.photo ? (
                                        <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={32} className="text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{emp.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Phone size={14} />
                                        <span>{emp.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-2">
                                        <IndianRupee size={12} /> Salary
                                    </div>
                                    <p className="font-semibold text-gray-900 dark:text-white">₹{emp.salary}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-2">
                                        <Calendar size={12} /> Joined
                                    </div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{emp.joining_date}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => { setSelectedEmp(emp); setSalaryForm({ ...salaryForm, amount: emp.salary }); setShowSalaryModal(true); loadSalaryHistory(emp.id); }}
                                className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 py-2.5 rounded-xl font-bold transition-all"
                            >
                                <IndianRupee size={18} />
                                Pay Salary
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{modalMode === 'add' ? 'Add New Employee' : 'Edit Employee'}</h2>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                placeholder="Full Name"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Phone"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                                    value={formData.joining_date}
                                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Salary"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                    required
                                />
                            </div>
                            <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30">
                                {modalMode === 'add' ? 'Create' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showSalaryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Salary Payment</h2>
                                <button onClick={() => setShowSalaryModal(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handlePaySalary} className="space-y-4 mb-8">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl">
                                    <p className="text-sm font-bold text-emerald-600 uppercase tracking-tight">{selectedEmp?.name}</p>
                                    <p className="text-xs text-emerald-500 mt-1">Monthly Salary: ₹{selectedEmp?.salary}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl p-3"
                                        value={salaryForm.month}
                                        onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })}
                                    >
                                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                                    </select>
                                    <input
                                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl p-3"
                                        value={salaryForm.year}
                                        onChange={(e) => setSalaryForm({ ...salaryForm, year: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-3 pl-10 pr-4 font-bold text-lg"
                                            value={salaryForm.amount}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <select
                                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl p-3 font-medium text-sm"
                                        value={salaryForm.mode}
                                        onChange={(e) => setSalaryForm({ ...salaryForm, mode: e.target.value })}
                                    >
                                        <option value="Cash">Cash Payment</option>
                                        <option value="Bank/UPI">Bank / UPI</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                                <button className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <CreditCard size={20} />
                                    Record Payment
                                </button>
                            </form>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 w-full md:w-80 p-6 overflow-auto border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800">
                            <h3 className="font-bold flex items-center gap-2 mb-4">
                                <History size={18} /> Payment History
                            </h3>
                            <div className="space-y-3">
                                {salaryHistory.length === 0 ? (
                                    <p className="text-center text-gray-400 text-sm py-8">No history yet</p>
                                ) : salaryHistory.map(h => (
                                    <div key={h.id} className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>{h.period_month} {h.period_year}</span>
                                            <span>{new Date(h.payment_date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="font-bold">₹{h.amount}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
