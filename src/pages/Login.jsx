import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(username, password);
        if (success) {
            addToast(`Welcome back, ${username}!`, 'success');
            navigate('/');
        } else {
            addToast('Invalid credentials. Please try again.', 'error');
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-950 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />

            <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 animate-fade-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
                        <Droplets size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                    <p className="text-gray-400 mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
                            placeholder="Enter username"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-300 block mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
                            placeholder="Enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-900/50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
