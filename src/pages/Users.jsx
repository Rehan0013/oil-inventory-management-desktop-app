import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, User, X, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Users = () => {
    const { user: currentUser } = useAuth();
    const { addToast } = useToast();
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [formData, setFormData] = useState({
        id: null,
        username: '',
        password: '',
        role: 'worker'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        if (window.api) {
            try {
                const data = await window.api.getUsers();
                setUsers(data);
            } catch (err) {
                addToast('Failed to load users', 'error');
            }
        }
    };

    const openCreateModal = () => {
        setModalMode('add');
        setFormData({ id: null, username: '', password: '', role: 'worker' });
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setModalMode('edit');
        setFormData({ ...user, password: '' }); // Don't show current password
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!window.api) return;

        try {
            if (modalMode === 'add') {
                await window.api.addUser(formData);
                addToast('User created successfully', 'success');
            } else {
                await window.api.updateUser(formData);
                addToast('User updated successfully', 'success');
            }
            await loadUsers();
            setShowModal(false);
        } catch (err) {
            console.error(err);
            addToast(`Failed to ${modalMode} user`, 'error');
        }
    };

    const handleDelete = async (id, username) => {
        if (confirm(`Are you sure you want to delete user ${username}?`)) {
            if (window.api) {
                try {
                    await window.api.deleteUser(id);
                    await loadUsers();
                    addToast('User deleted', 'success');
                } catch (err) {
                    addToast('Failed to delete user', 'error');
                }
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Users</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage application access and roles</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/30 font-medium active:scale-95"
                >
                    <Plus size={20} />
                    Add User
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((u) => (
                    <div key={u.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl flex justify-between items-center group hover:border-blue-500/50 transition-all hover:shadow-xl relative">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-xl ${u.role === 'owner' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'} transition-colors`}>
                                {u.role === 'owner' ? <Shield size={28} /> : <User size={28} />}
                            </div>
                            <div>
                                <p className="font-bold text-lg text-gray-900 dark:text-white">{u.username}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{u.role}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => openEditModal(u)}
                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Edit User"
                            >
                                <Edit2 size={18} />
                            </button>
                            {u.username !== 'admin' && u.id !== currentUser.id && (
                                <button
                                    onClick={() => handleDelete(u.id, u.username)}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete User"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{modalMode === 'add' ? 'Add System User' : 'Edit User'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Username</label>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">
                                    Password {modalMode === 'edit' && <span className="text-gray-400 normal-case">(Leave blank to keep current)</span>}
                                </label>
                                <input
                                    type="password"
                                    placeholder={modalMode === 'mod' ? "New Password" : "Password"}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={modalMode === 'add'}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Role</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none appearance-none transition-all focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="worker">Worker</option>
                                        <option value="owner">Owner</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                                        <Shield size={16} />
                                    </div>
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
                                    {modalMode === 'add' ? 'Create User' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
