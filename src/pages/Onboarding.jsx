import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Phone, MapPin, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Onboarding = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [businessData, setBusinessData] = useState({
        businessName: '',
        addressLine1: '',
        addressLine2: '',
        phone: '',
        gstin: ''
    });

    const [ownerData, setOwnerData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });

    const handleNext = () => {
        if (step === 1) {
            if (!businessData.businessName || !businessData.phone) {
                return addToast('Please fill in essential business details', 'error');
            }
            setStep(2);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (ownerData.password !== ownerData.confirmPassword) {
            return addToast('Passwords do not match', 'error');
        }
        if (ownerData.password.length < 4) {
            return addToast('Password must be at least 4 characters', 'error');
        }

        setLoading(true);
        try {
            if (window.api) {
                // In production, we should hash the password here or in the main process
                // Since Task 2 is password hashing, I'll keep it simple for now and rely on Task 2 implementation later
                // OR I can hash it now using bcryptjs if I want to be proactive.
                // Let's just pass it to 'complete-setup' and let the backend handle it if possible, 
                // but db.cjs currently just inserts. I'll update db.cjs to hash if I can.

                await window.api.completeSetup({
                    businessDetails: businessData,
                    ownerDetails: {
                        username: ownerData.username,
                        password: ownerData.password // Will be hashed in Task 2 or I can do it now
                    }
                });
                addToast('Setup completed successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '#/login';
                    window.location.reload();
                }, 1000);
            }
        } catch (err) {
            console.error(err);
            addToast('Failed to complete setup', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">

                {/* Visual Side */}
                <div className="hidden lg:flex flex-col justify-center p-12 bg-blue-600 text-white relative">
                    <div className="relative z-10">
                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Welcome to Oilstro</h1>
                        <p className="text-blue-100 text-lg leading-relaxed">
                            Let's get your inventory management system ready. It only takes a minute to set up your business profile and owner account.
                        </p>
                    </div>
                    {/* Abstract circles */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-500 rounded-full opacity-50 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-blue-400 rounded-full opacity-50 blur-3xl"></div>
                </div>

                {/* Form Side */}
                <div className="p-8 lg:p-12">
                    {/* Stepper */}
                    <div className="flex items-center gap-4 mb-10">
                        <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600' : 'text-emerald-500'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-emerald-500 text-white'}`}>
                                {step > 1 ? <CheckCircle2 size={16} /> : '1'}
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">Business</span>
                        </div>
                        <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1"></div>
                        <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                                2
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">Owner</span>
                        </div>
                    </div>

                    {step === 1 ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business Profile</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">Enter the details that will appear on your invoices.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Business Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="e.g. Royal Oil Suppliers"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                            value={businessData.businessName}
                                            onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="tel"
                                                placeholder="+91 XXXXX XXXXX"
                                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                                value={businessData.phone}
                                                onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">GSTIN (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="27XXXXX0000X1Z5"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                            value={businessData.gstin}
                                            onChange={(e) => setBusinessData({ ...businessData, gstin: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Address Line 1</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                                        <textarea
                                            placeholder="Street address, P.O. box, company name"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white h-20 resize-none"
                                            value={businessData.addressLine1}
                                            onChange={(e) => setBusinessData({ ...businessData, addressLine1: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full mt-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 group"
                            >
                                Continue to Owner Setup
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Owner Account</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">Set up your administrator credentials.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Full Name / Username</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Admin"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                            value={ownerData.username}
                                            onChange={(e) => setOwnerData({ ...ownerData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                        value={ownerData.password}
                                        onChange={(e) => setOwnerData({ ...ownerData, password: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                        value={ownerData.confirmPassword}
                                        onChange={(e) => setOwnerData({ ...ownerData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-10">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Finalizing...' : 'Complete Setup & Login'}
                                    {!loading && <CheckCircle2 size={20} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-gray-500 font-medium py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    Back to Business Profile
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
