
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, User, ArrowLeft, CheckCircle } from 'lucide-react';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('/api/auth/register', { username, password });
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError('Registration failed. Username may be taken.');
        }
    };

    return (
        <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center relative overflow-hidden font-sans text-gray-300">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[20%] right-[30%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 w-full max-w-md p-8 bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
                <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors mb-8 uppercase tracking-wider">
                    <ArrowLeft className="w-3 h-3" /> Back to Login
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Register Console</h1>
                    <p className="text-sm text-gray-500">Create a new operator identity for SteelPulse access.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-wider text-gray-500 ml-1">New Operator ID</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Choose Username"
                                className="w-full bg-[#121214] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-wider text-gray-500 ml-1">Secure Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="password"
                                placeholder="Choose Password"
                                className="w-full bg-[#121214] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group mt-4"
                    >
                        <CheckCircle className="w-4 h-4" />
                        <span>Create Account</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signup;
