import { useState, useEffect } from 'react';
import { Save, Building2, MapPin, Phone, FileText, Lock, Edit2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState({
        businessName: '',
        addressLine1: '',
        addressLine2: '',
        phone: '',
        gstin: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        if (window.api) {
            try {
                const data = await window.api.getSettings();
                setSettings(prev => ({ ...prev, ...data }));
            } catch (err) {
                console.error(err);
                addToast('Failed to load settings', 'error');
            }
        }
    };

    const handleSave = async () => {
        if (window.api) {
            setLoading(true);
            try {
                await window.api.saveSettings(settings);
                addToast('Settings updated successfully', 'success');
                setIsEditing(false);
                // Force reload to update other components if necessary 
                // but local state update is enough for this page.
            } catch (err) {
                addToast('Failed to save settings', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 size={20} /> Business Details
                    </h2>
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${isEditing ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}
                    >
                        {isEditing ? <><Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}</> : <><Edit2 size={18} /> Edit Profile</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                        <input
                            type="text"
                            value={settings.businessName}
                            onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                            readOnly={!isEditing}
                            className={`w-full rounded-lg px-4 py-3 outline-none transition-all ${isEditing ? 'bg-white dark:bg-gray-950 border-blue-500 ring-4 ring-blue-500/10' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-500'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-2"><MapPin size={16} /> Address Line 1</span>
                        </label>
                        <input
                            type="text"
                            value={settings.addressLine1}
                            onChange={(e) => setSettings({ ...settings, addressLine1: e.target.value })}
                            readOnly={!isEditing}
                            className={`w-full rounded-lg px-4 py-3 outline-none transition-all ${isEditing ? 'bg-white dark:bg-gray-950 border-blue-500 ring-4 ring-blue-500/10' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-500'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-2"><MapPin size={16} /> Address Line 2</span>
                        </label>
                        <input
                            type="text"
                            value={settings.addressLine2}
                            onChange={(e) => setSettings({ ...settings, addressLine2: e.target.value })}
                            readOnly={!isEditing}
                            className={`w-full rounded-lg px-4 py-3 outline-none transition-all ${isEditing ? 'bg-white dark:bg-gray-950 border-blue-500 ring-4 ring-blue-500/10' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-500'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-2"><Phone size={16} /> Phone Number</span>
                        </label>
                        <input
                            type="text"
                            value={settings.phone}
                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            readOnly={!isEditing}
                            className={`w-full rounded-lg px-4 py-3 outline-none transition-all ${isEditing ? 'bg-white dark:bg-gray-950 border-blue-500 ring-4 ring-blue-500/10' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-500'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-2"><FileText size={16} /> GSTIN / Tax ID</span>
                        </label>
                        <input
                            type="text"
                            value={settings.gstin}
                            onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                            readOnly={!isEditing}
                            className={`w-full rounded-lg px-4 py-3 outline-none transition-all ${isEditing ? 'bg-white dark:bg-gray-950 border-blue-500 ring-4 ring-blue-500/10' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed text-gray-500'}`}
                        />
                    </div>
                </div>

                {isEditing && (
                    <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-6">
                        <button
                            onClick={() => { setIsEditing(false); loadSettings(); }}
                            className="px-6 py-2.5 text-gray-500 font-bold hover:text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                        >
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
