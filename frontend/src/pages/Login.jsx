
import React from 'react';
import { Activity, ShieldCheck, Zap, Server, Globe, Lock, Github } from 'lucide-react';

const Login = () => {
    return (
        <div className="min-h-screen bg-[#060608] flex items-center justify-center relative overflow-hidden font-sans text-gray-300">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
            </div>

            <div className="z-10 w-full max-w-[400px] mx-4">
                <div className="bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative group">
                    {/* Glowing border effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 -z-10"></div>

                    <div className="p-8 pb-6 text-center">
                        <div className="w-16 h-16 bg-white mx-auto flex items-center justify-center rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-white"></div>
                            <Activity className="text-black w-8 h-8 stroke-[2.5px] relative z-10" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic mb-1">SteelPulse</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span> System Secure
                        </p>
                    </div>

                    <div className="px-8 py-2 space-y-4">

                        <a
                            href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/login/github`}
                            className="group w-full py-4 bg-[#24292e] hover:bg-[#2f363d] text-white border border-white/10 rounded-xl transition-all flex items-center justify-center gap-3"
                        >
                            <Github className="w-5 h-5" />
                            <span className="text-sm font-black uppercase tracking-widest">Sign in with GitHub</span>
                        </a>
                    </div>

                    <div className="p-8 mt-2 text-center">
                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed max-w-[280px] mx-auto">
                            Restricted Access. SteelPulse requires verified credentials for telemetry stream connection.
                        </p>
                    </div>

                    <div className="py-4 border-t border-white/5 flex justify-between px-8 bg-black/20">
                        <div className="flex items-center gap-1.5" title="Encryption Active">
                            <Lock className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">TLS 1.3</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-blue-500" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Region: US-East</span>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-6 text-[10px] text-slate-700 font-mono uppercase">
                    v2.1.0 • Build 8842 • Latency 12ms
                </p>
            </div>
        </div>
    );
};

export default Login;
