import { useState, useEffect } from 'react';
import { Save, Building2, MapPin, Phone, FileText, Lock } from 'lucide-react';
import { BUSINESS_DETAILS } from '../config/business';

const Settings = () => {
    // We can keep local state if we want to show values, but they will be read-only
    const settings = BUSINESS_DETAILS;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 size={20} /> Business Details
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                        <Lock size={14} />
                        <span>Managed by Administrator</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                        <input
                            type="text"
                            value={settings.businessName}
                            readOnly
                            disabled
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-2"><MapPin size={16} /> Address Line 1</span>
                        </label>
                        <input
                            type="text"
                            value={settings.addressLine1}
                            readOnly
                            disabled
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-2"><MapPin size={16} /> Address Line 2</span>
                        </label>
                        <input
                            type="text"
                            value={settings.addressLine2}
                            readOnly
                            disabled
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-2"><Phone size={16} /> Phone Number</span>
                        </label>
                        <input
                            type="text"
                            value={settings.phone}
                            readOnly
                            disabled
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-2"><FileText size={16} /> GSTIN / Tax ID</span>
                        </label>
                        <input
                            type="text"
                            value={settings.gstin || '-'}
                            readOnly
                            disabled
                            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="mt-6 text-xs text-gray-500 italic text-center">
                    To update these details, please contact the system administrator.
                </div>
            </div>
        </div>
    );
};

export default Settings;
