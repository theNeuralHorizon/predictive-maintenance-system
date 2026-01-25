
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, User, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await axios.post('/api/auth/token', formData);
            localStorage.setItem('token', response.data.access_token);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center relative overflow-hidden font-sans text-gray-300">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="z-10 w-full max-w-md p-8 bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] mb-6">
                        <Activity className="text-black w-8 h-8 stroke-[2.5px]" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">SteelPulse</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Industrial AI Monitor</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-wider text-gray-500 ml-1">Operator ID</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Enter Username"
                                className="w-full bg-[#121214] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-wider text-gray-500 ml-1">Access Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="password"
                                placeholder="Enter Password"
                                className="w-full bg-[#121214] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group mt-2"
                    >
                        <span>Initiate Session</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="text-center mt-6">
                        <span className="text-sm text-gray-500">New System Operator? </span>
                        <Link to="/signup" className="text-sm font-bold text-white hover:text-emerald-400 transition-colors">Register Console</Link>
                    </div>
                </form>

                <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center opacity-40">
                    <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Secure TLS 1.3</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Low Latency</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
