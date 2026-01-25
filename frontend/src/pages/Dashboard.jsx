import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Activity,
    AlertTriangle,
    Thermometer,
    Settings,
    ShieldCheck,
    Zap,
    RefreshCcw,
    Terminal,
    Cpu,
    Fan,
    X,
    Save,
    Play,
    Pause,
    AlertOctagon,
    Factory,
    Download,
    Wrench,
    Info,
    CheckCircle2,
    BarChart3,
    Database,
    ChevronRight,
    BrainCircuit,
    Loader2,
    Sparkles,
    FileText
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell
} from 'recharts';

/**
 * STEELPULSE - REAL-TIME INFERENCE ENGINE v3.3
 * POWERED BY GEMINI 2.5 FLASH
 */

// API Key injected by environment
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const Dashboard = () => {
    // --- STATE ---
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState("M14860");
    const [toasts, setToasts] = useState([]);
    const [lastRepairTimestamp, setLastRepairTimestamp] = useState(0);

    // Insight State
    const [aiInsight, setAiInsight] = useState("System initializing... Waiting for telemetry stream.");
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const lastAnalyzedStatus = useRef(null); // To debounce API calls

    // --- CONFIG ---
    const [config, setConfig] = useState({
        modelVersion: 'v2.1 (Prod)',
        pollInterval: 2000,
        healthThreshold: 30,
        driftThreshold: 0.05,
        isPaused: false,
        forceFailure: false
    });

    // --- HELPERS ---
    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const handleRepair = () => {
        setLastRepairTimestamp(Date.now());
        setConfig(p => ({ ...p, forceFailure: false }));
        addToast(`Maintenance ticket created for ${selectedMachine}. Tool replaced.`, 'success');
        setAiInsight("Maintenance verified. System baseline restored. Monitoring for new patterns.");
    };

    // --- SIMULATION LOOP ---
    useEffect(() => {
        setHistory([]);
        setAiInsight("Connecting to new machine telemetry stream...");
        lastAnalyzedStatus.current = null; // Reset analysis trigger
    }, [selectedMachine]);

    useEffect(() => {
        const generateNewPacket = (prevHistory) => {
            if (config.isPaused) return null;

            const time = new Date().toLocaleTimeString();
            const lastPacket = prevHistory[prevHistory.length - 1];

            let wear = 0;
            if (lastRepairTimestamp > 0 && (!lastPacket || Date.now() - lastRepairTimestamp < 2000)) {
                wear = 0;
            } else {
                wear = lastPacket ? lastPacket.sensor_data.tool_wear + (config.forceFailure ? 5 : 0.8) : (Math.random() * 50);
            }

            const anomalyMultiplier = config.forceFailure ? 1.5 : 1.0;
            const machineOffset = selectedMachine === "H29420" ? 5 : (selectedMachine === "L47180" ? -5 : 0);

            const airTemp = (297 + machineOffset + (Math.sin(Date.now() / 10000) * 2) + Math.random());
            const processTemp = (airTemp + 10 + (Math.random() * 1.5)) * (config.forceFailure ? 1.05 : 1.0);

            const rpm = 1400 + (Math.random() * 200) - (Math.random() * 50);
            const torque = ((60000 * (4 + Math.random())) / (2 * Math.PI * rpm)) * anomalyMultiplier;

            const hdf = (processTemp - airTemp < 8.6) && (rpm < 1380);
            const pwf = (torque * (rpm * (2 * Math.PI / 60))) < 3500 || (torque * (rpm * (2 * Math.PI / 60))) > 9000;
            const osf = (torque * wear) > 12000;
            const twf = wear > 220;

            const machineFailure = config.forceFailure || hdf || pwf || osf || twf || (Math.random() > 0.995);

            const isDrifting = config.forceFailure || (Math.random() > 0.98);

            return {
                timestamp: time,
                sensor_data: {
                    UDI: Math.floor(Math.random() * 10000),
                    product_id: selectedMachine,
                    type: selectedMachine.charAt(0),
                    air_temp: parseFloat(airTemp.toFixed(2)),
                    process_temp: parseFloat(processTemp.toFixed(2)),
                    rpm: Math.floor(rpm),
                    torque: parseFloat(torque.toFixed(2)),
                    tool_wear: parseFloat(wear.toFixed(1))
                },
                model_outputs: {
                    failure_probability: machineFailure ? 0.98 : (wear / 350) + (Math.random() * 0.05),
                    is_anomaly: machineFailure ? -1 : (Math.random() > 0.96 ? -1 : 1),
                    anomaly_score: machineFailure ? -0.85 : (Math.random() * 0.4) - 0.2,
                    active_failure_modes: { hdf, pwf, osf, twf },
                    feature_importance: [
                        { name: 'Torque [Nm]', value: osf ? 0.6 : 0.32 },
                        { name: 'Tool wear [min]', value: twf ? 0.7 : 0.28 },
                        { name: 'Rotational speed [rpm]', value: 0.18 },
                        { name: 'Process Temp [K]', value: hdf ? 0.5 : 0.12 },
                        { name: 'Air Temp [K]', value: 0.10 },
                    ],
                    drift_p_values: {
                        "Air temperature [K]": 0.45 + (Math.random() * 0.1),
                        "Process temperature [K]": 0.38 + (Math.random() * 0.1),
                        "Rotational speed [rpm]": isDrifting ? 0.01 : 0.25,
                        "Torque [Nm]": 0.22,
                        "Tool wear [min]": 0.91
                    }
                }
            };
        };

        const updateLoop = () => {
            setHistory(prev => {
                const nextPacket = generateNewPacket(prev);
                if (!nextPacket) return prev;

                if (nextPacket.model_outputs.is_anomaly === -1 && Math.random() > 0.7) {
                    addToast("Isolation Forest detected spectral anomaly", "error");
                }
                if (nextPacket.model_outputs.drift_p_values["Rotational speed [rpm]"] < config.driftThreshold && Math.random() > 0.8) {
                    addToast("Drift detected in RPM distribution (p < 0.05)", "warning");
                }

                return [...prev.slice(-24), nextPacket];
            });
        };

        const interval = setInterval(updateLoop, config.pollInterval);
        if (!config.isPaused) updateLoop();
        return () => clearInterval(interval);
    }, [config.pollInterval, config.isPaused, config.forceFailure, config.driftThreshold, selectedMachine, lastRepairTimestamp]);

    // --- DERIVED STATE ---
    const currentJson = useMemo(() => history[history.length - 1], [history]);

    const anomalyStats = useMemo(() => {
        if (history.length === 0) return { freq: 0, last: 'N/A' };
        const recent = history.slice(-20);
        const flagged = recent.filter(h => h.model_outputs.is_anomaly === -1);
        const lastAnomaly = flagged.length > 0 ? flagged[flagged.length - 1].timestamp : 'None';
        return {
            freq: (flagged.length / recent.length) * 100,
            last: lastAnomaly
        };
    }, [history]);

    const currentStatus = useMemo(() => {
        if (!currentJson) return null;
        const { failure_probability } = currentJson.model_outputs;
        const health = Math.max(0, (1 - failure_probability) * 100);

        if (health < config.healthThreshold) return { label: 'CRITICAL', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', isBad: true };
        if (health < 70) return { label: 'WARNING', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', isBad: true };
        return { label: 'OPTIMAL', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', isBad: false };
    }, [currentJson, config.healthThreshold]);

    // --- GEMINI INSIGHT ENGINE (MOCKED) ---
    const generateAiInsight = async (force = false) => {
        if (!currentJson || isInsightLoading) return;

        // Auto-trigger logic: Only if status changed or forced
        if (!force && currentStatus.label === lastAnalyzedStatus.current) return;

        setIsInsightLoading(true);
        lastAnalyzedStatus.current = currentStatus.label;

        // "Random ass hardcoded" scenarios
        const scenarios = {
            OPTIMAL: [
                "System nominal. Harmonic resonance within sub-micron tolerances. Recommend increasing feed rate by 4% to optimize throughput.",
                "Thermal efficacy at 98.2%. Spindle bearing signature shows negligible deviation. No maintenance required.",
                "Kinetic energy distribution is uniform. Tool wear propagation is linear and predictable. Proceed with standard operation.",
                "Vibration analysis indicates perfect shaft alignment. Hydraulic pressure stable. Efficient power consumption metrics observed.",
                "Micro-vibrations detected but within Green Zone tolerances. Lubrication viscosity optimal. Continuing surveillance."
            ],
            WARNING: [
                "Detected micro-fissure signatures in acoustic emission spectrum. Torque load spiking intermittently. Investigate spindle runout immediately.",
                "Thermal runway potential accumulating in quadrant 3. Coolant flow rate may be insufficient for current RPM. Reduce load.",
                "Non-linear tool wear progression observed. Chip load variance exceeding 12%. Possible material inconsistency or dull cutter.",
                "Harmonic oscillation in Z-axis implies loosened gib strips. Recalibration of servo parameters recommended to prevent backlash.",
                "Minor voltage fluctuations correlative with torque spikes. Check VFD capacitor banks for degradation. Pre-emptive inspection advised."
            ],
            CRITICAL: [
                "CATASTRROPIC FAILURE IMMINENT. Bearing cage disintegration detected via spectral noise. EMERGENCY STOP RECOMMENDED.",
                "Thermal threshold breached. Spindle seizure probability > 85%. Coolant delivery failure suspected. HALT ALL OPERATIONS.",
                "Severe plastic deformation of cutting interface. Torque overload protection active. Tool breakage likely within 30 seconds.",
                "Major impedance mismatch in axis drive. Servo tracking error exceeds safe limits. Risk of collision with workpiece.",
                "Structural integrity compromise detected in tool holder. Vibration magnitude exceeding ISO 2372 Class IV limits. UNSAFE."
            ]
        };

        const getMessage = () => {
            const pool = scenarios[currentStatus.label] || scenarios['OPTIMAL'];
            return pool[Math.floor(Math.random() * pool.length)];
        };

        // Simulate network delay for realism
        setTimeout(() => {
            setAiInsight(getMessage());
            setIsInsightLoading(false);
        }, 1500 + Math.random() * 1000);
    };

    // Trigger AI on status change
    useEffect(() => {
        if (currentStatus) {
            generateAiInsight();
        }
    }, [currentStatus?.label]);

    // --- EXPORT ---
    const handleExport = () => {
        if (history.length === 0) return;
        const headers = ["Timestamp", "UDI", "Product ID", "Air Temp", "Process Temp", "RPM", "Torque", "Tool Wear", "Failure Prob", "Anomaly Score", "Is Anomaly"];
        const csvContent = [
            headers.join(","),
            ...history.map(h => [
                h.timestamp, h.sensor_data.UDI, h.sensor_data.product_id, h.sensor_data.air_temp, h.sensor_data.process_temp,
                h.sensor_data.rpm, h.sensor_data.torque, h.sensor_data.tool_wear, h.model_outputs.failure_probability.toFixed(4),
                h.model_outputs.anomaly_score.toFixed(4), h.model_outputs.is_anomaly
            ].join(","))
        ].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `steelpulse_logs_${selectedMachine}_${new Date().toISOString().slice(0, 19)}.csv`;
        link.click();
    };

    if (!currentJson) {
        return (
            <div className="min-h-screen bg-[#060608] flex items-center justify-center">
                <div className="text-blue-500 flex items-center gap-3 font-bold animate-pulse text-xs tracking-[0.3em]">
                    <Activity className="animate-spin" /> INITIALIZING STEELPULSE CORE...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060608] text-slate-300 font-sans selection:bg-blue-500/30 relative overflow-hidden">

            {/* --- TOAST CONTAINER --- */}
            <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className={`pointer-events-auto px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300 ${toast.type === 'error' ? 'bg-[#0d0d0f] border-rose-500/50 text-rose-200' :
                        toast.type === 'warning' ? 'bg-[#0d0d0f] border-amber-500/50 text-amber-200' :
                            'bg-[#0d0d0f] border-emerald-500/50 text-emerald-200'
                        }`}>
                        {toast.type === 'error' && <Zap className="w-4 h-4 text-rose-500" />}
                        {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        <span className="text-xs font-bold">{toast.message}</span>
                    </div>
                ))}
            </div>

            {/* --- SETTINGS MODAL --- */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0d0d0f] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                <Settings className="w-5 h-5 text-slate-400" /> Control Plane
                            </h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Model Governance</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 mb-2 block">Active Artifact</label>
                                        <select value={config.modelVersion} onChange={(e) => setConfig(p => ({ ...p, modelVersion: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono outline-none">
                                            <option>v2.1 (Prod)</option>
                                            <option>v2.2 (Staging)</option>
                                            <option>v1.0 (Legacy)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 mb-2 block">Poll Rate (ms)</label>
                                        <input type="number" value={config.pollInterval} onChange={(e) => setConfig(p => ({ ...p, pollInterval: parseInt(e.target.value) }))} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alert Sensitivity</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold text-slate-400"><span>Health Threshold</span><span className="text-rose-400">{config.healthThreshold}%</span></div>
                                    <input type="range" min="10" max="60" value={config.healthThreshold} onChange={(e) => setConfig(p => ({ ...p, healthThreshold: parseInt(e.target.value) }))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                                    <div className="flex justify-between text-xs font-bold text-slate-400"><span>Drift P-Value</span><span className="text-blue-400">{config.driftThreshold}</span></div>
                                    <input type="range" min="0.01" max="0.1" step="0.01" value={config.driftThreshold} onChange={(e) => setConfig(p => ({ ...p, driftThreshold: parseFloat(e.target.value) }))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2"><AlertOctagon className="w-3 h-3" /> Simulation Overrides</p>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setConfig(p => ({ ...p, isPaused: !p.isPaused }))} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                        {config.isPaused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4 text-amber-500" />} {config.isPaused ? "Resume" : "Pause"}
                                    </button>
                                    <button onClick={() => setConfig(p => ({ ...p, forceFailure: !p.forceFailure }))} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${config.forceFailure ? 'bg-rose-500 text-white' : 'bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'}`}>
                                        <Zap className="w-4 h-4" /> {config.forceFailure ? "Injecting..." : "Inject Fault"}
                                    </button>
                                </div>
                            </div>

                            {/* --- NEW DOWNLOAD LOGS IN SETTINGS --- */}
                            <div className="pt-4 border-t border-white/5">
                                <button
                                    onClick={handleExport}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-slate-300 hover:text-white"
                                >
                                    <Download className="w-4 h-4" /> Download Telemetry Logs
                                </button>
                            </div>
                        </div>
                        <div className="p-6 bg-black/20 border-t border-white/5 flex justify-end">
                            <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Apply</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- INFO MODAL --- */}
            {isInfoOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0d0d0f] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">System Architecture</h2>
                                <p className="text-sm text-slate-500 mt-1">SteelPulse Predictive Maintenance Pipeline</p>
                            </div>
                            <button onClick={() => setIsInfoOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-400" /> Failure Classification</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    **Model:** Random Forest Classifier (Sklearn)<br />
                                    **Training:** Balanced Class Weights<br />
                                    **Input:** Rolling window statistics (Mean, Std) + Deltas<br />
                                    **Output:** Probability of failure (0-1)
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-400" /> Anomaly Detection</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    **Model:** Isolation Forest<br />
                                    **Strategy:** Unsupervised Outlier Detection<br />
                                    **Contamination:** 5% (Configurable)<br />
                                    **Output:** -1 (Anomaly) / 1 (Normal)
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Drift Detection</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    **Method:** Kolmogorov-Smirnov (KS) Test<br />
                                    **Reference:** Training set baseline (first 1000 rows)<br />
                                    **Trigger:** P-Value &lt; 0.05 implies distribution shift
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Database className="w-4 h-4 text-purple-400" /> Data Schema</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    **Source:** AI4I 2020 Predictive Maintenance Dataset<br />
                                    **Sensors:** Air Temp, Process Temp, RPM, Torque<br />
                                    **Target:** Machine Failure (Binary)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="border-b border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <Activity className="text-black w-7 h-7 stroke-[2.5px]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">SteelPulse</h1>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${config.isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    {config.isPaused ? "Inference Paused" : "Live Inference Active"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                            <Terminal className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-mono text-blue-400 font-bold tracking-widest">{currentJson.timestamp}</span>
                            <span className="text-[10px] text-slate-600 border-l border-white/10 pl-3 ml-1">{config.modelVersion}</span>
                        </div>

                        <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-xl px-2">
                            <Factory className="w-4 h-4 text-slate-400 ml-2" />
                            <select value={selectedMachine} onChange={(e) => setSelectedMachine(e.target.value)} className="bg-transparent text-xs font-bold text-white uppercase tracking-wider py-2.5 pl-2 pr-4 outline-none cursor-pointer">
                                <option value="M14860" className="bg-[#0d0d0f]">Machine M14860</option>
                                <option value="L47180" className="bg-[#0d0d0f]">Machine L47180</option>
                                <option value="H29420" className="bg-[#0d0d0f]">Machine H29420</option>
                            </select>
                        </div>

                        <button onClick={() => setIsSettingsOpen(true)} className={`p-2.5 rounded-xl border transition-all ${isSettingsOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400'}`}>
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-8 space-y-8">
                {config.forceFailure && (
                    <div className="w-full py-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
                        <p className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] animate-pulse"><AlertTriangle className="w-3 h-3 inline-block mb-0.5 mr-2" /> Manual Failure Injection Active</p>
                    </div>
                )}

                {/* --- INSIGHT ENGINE (Moved to Top) --- */}
                <div className="w-full p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f] relative overflow-hidden flex flex-col group">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                            <BrainCircuit className="w-3 h-3 text-indigo-400" /> Insight Engine
                        </span>
                        <button
                            onClick={() => generateAiInsight(true)}
                            disabled={isInsightLoading}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            {isInsightLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <RefreshCcw className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col justify-center relative z-10">
                        {isInsightLoading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-2 bg-white/10 rounded w-3/4"></div>
                                <div className="h-2 bg-white/10 rounded w-1/2"></div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm leading-relaxed font-medium text-slate-300">
                                    <Sparkles className="w-3 h-3 text-indigo-400 inline mr-2" />
                                    {aiInsight}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                </div>

                {/* --- METRICS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Health Score */}
                    <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${currentStatus.bg} ${currentStatus.border} relative group`}>
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-bold">Machine Condition</span>
                            <ShieldCheck className={currentStatus.color} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-6xl font-black tracking-tighter ${currentStatus.color}`}>
                                {((1 - currentJson.model_outputs.failure_probability) * 100).toFixed(0)}%
                            </span>
                            <span className={`text-xs font-black ${currentStatus.color}`}>{currentStatus.label}</span>
                        </div>

                        {/* --- REPAIR ACTION BUTTON --- */}
                        {currentStatus.isBad && (
                            <button
                                onClick={handleRepair}
                                className="mt-6 w-full py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 shadow-lg"
                            >
                                <Wrench className="w-4 h-4" /> Schedule Maintenance
                            </button>
                        )}

                        {!currentStatus.isBad && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-tighter">System Nominal</span>
                            </div>
                        )}
                    </div>

                    {/* Anomaly Watch */}
                    <div className="p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f] relative overflow-hidden flex flex-col justify-between">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-bold">Anomaly Engine</span>
                                <Zap className={currentJson.model_outputs.is_anomaly === -1 ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                            </div>
                            {currentJson.model_outputs.is_anomaly === -1 ? (
                                <div className="space-y-1">
                                    <p className="text-2xl font-black text-amber-400 uppercase tracking-tight italic leading-none">Outlier Flagged</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Score: {currentJson.model_outputs.anomaly_score.toFixed(3)}</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-xl font-black text-slate-300 uppercase tracking-tight italic leading-none">Nominal State</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Score: {currentJson.model_outputs.anomaly_score.toFixed(3)}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Frequency</p>
                                <p className="text-sm font-black text-slate-200">{anomalyStats.freq.toFixed(0)}%</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Last Outlier</p>
                                <p className="text-sm font-black text-slate-200 truncate">{anomalyStats.last}</p>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 opacity-[0.03]">
                            <Zap className="w-24 h-24 text-white" />
                        </div>
                    </div>

                    {/* Torque-RPM Correlation */}
                    <div className="p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f]">
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-bold">Mechanical Load</span>
                            <Fan className="text-blue-500 animate-spin-slow" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-black text-white italic">{currentJson.sensor_data.rpm} <span className="text-sm font-normal text-slate-500 not-italic uppercase tracking-widest ml-1">RPM</span></p>
                            <p className="text-3xl font-black text-white italic">{currentJson.sensor_data.torque} <span className="text-sm font-normal text-slate-500 not-italic uppercase tracking-widest ml-1">Nm</span></p>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-4 uppercase font-bold tracking-tighter">UDI Ref: {currentJson.sensor_data.UDI}</p>
                    </div>

                    {/* Tool Wear Status */}
                    <div className="p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f]">
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-bold">Tool Degradation</span>
                            <Activity className="text-indigo-500" />
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-4xl font-black text-white italic">{currentJson.sensor_data.tool_wear}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1 font-bold">min worn</p>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full mt-6 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-700 ${currentJson.sensor_data.tool_wear > 180 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'}`}
                                style={{ width: `${(currentJson.sensor_data.tool_wear / 250) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    {['overview', 'telemetry', 'drift'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${activeTab === tab ? 'bg-white text-black border-white shadow-xl shadow-white/10' : 'bg-transparent text-slate-500 border-white/10 hover:border-white/20'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 p-10 rounded-[3rem] border border-white/5 bg-[#0d0d0f]">
                        {activeTab === 'overview' && (
                            <>
                                <div className="flex justify-between items-end mb-12">
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Health Pulse</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Continuous Risk Profile</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stable</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Flag</span></div>
                                    </div>
                                </div>
                                <div className="h-[450px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={history}>
                                            <defs>
                                                <linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                            <XAxis dataKey="timestamp" hide />
                                            <YAxis domain={[0, 100]} hide />
                                            <Tooltip contentStyle={{ backgroundColor: '#0d0d0f', border: '1px solid #ffffff10', borderRadius: '20px' }} />
                                            <Area type="step" dataKey={(d) => (1 - d.model_outputs.failure_probability) * 100} stroke="#3b82f6" strokeWidth={4} fill="url(#pulseGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}

                        {activeTab === 'telemetry' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full">
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 font-bold"><Thermometer className="w-4 h-4 text-orange-500" /> Thermal Trend [K]</h4>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={history}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#0d0d0f', border: 'none' }} />
                                                <Line type="monotone" dataKey="sensor_data.air_temp" name="Air" stroke="#f97316" strokeWidth={3} dot={false} />
                                                <Line type="monotone" dataKey="sensor_data.process_temp" name="Process" stroke="#ef4444" strokeWidth={3} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 font-bold"><Cpu className="w-4 h-4 text-indigo-500" /> Dynamics Profile</h4>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={history}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#0d0d0f', border: 'none' }} />
                                                <Line type="monotone" dataKey="sensor_data.rpm" name="RPM" stroke="#6366f1" strokeWidth={3} dot={false} />
                                                <Line type="monotone" dataKey="sensor_data.torque" name="Torque" stroke="#a855f7" strokeWidth={3} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'drift' && (
                            <div className="space-y-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Drift Engine</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">KS-Test Statistical Integrity Monitoring</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                                        <RefreshCcw className="w-3 h-3" /> Baseline Sync
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(currentJson.model_outputs.drift_p_values).map(([feature, pValue]) => (
                                        <div key={feature} className="p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
                                            <p className="text-sm font-bold text-slate-200 uppercase tracking-tight">{feature}</p>
                                            <div className="flex items-center gap-10">
                                                <div className="text-right">
                                                    <p className={`text-xl font-mono ${pValue < config.driftThreshold ? 'text-rose-500 font-black' : 'text-slate-400'}`}>{pValue.toFixed(4)}</p>
                                                    <p className={`text-[8px] font-black uppercase tracking-widest ${pValue < config.driftThreshold ? 'text-rose-600' : 'text-emerald-500'}`}>{pValue < config.driftThreshold ? 'DRIFT ALERT' : 'MODEL STABLE'}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-slate-500 transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-10 rounded-[3rem] border border-white/5 bg-[#0d0d0f] flex flex-col">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                            <BarChart3 className="text-blue-500 w-5 h-5" />
                            Weight Logic
                        </h3>
                        <div className="flex-1 min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={currentJson.model_outputs.feature_importance} layout="vertical" margin={{ left: 10 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9, fontWeight: 'bold' }} width={100} />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                        {currentJson.model_outputs.feature_importance.map((_, i) => (
                                            <Cell key={i} fill={i === 0 ? '#ffffff' : '#1e293b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-8 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                            <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 font-bold">Inference Result</h5>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                The Random Forest classifier is currently prioritizing <span className="text-white font-bold">{currentJson.model_outputs.feature_importance[0].name}</span> as the primary vector for failure prediction.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="max-w-[1600px] mx-auto px-8 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3 opacity-50">
                    <Database className="w-4 h-4" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] font-bold">SteelPulse Engine • Platform v2.1 • Hardware ID: 0x7E3A-99</p>
                </div>
                <div className="flex gap-10">
                    <button onClick={handleExport} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors font-bold flex items-center gap-2">
                        <Download className="w-3 h-3" /> Export Logs
                    </button>
                    <button onClick={() => setIsInfoOpen(true)} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors font-bold flex items-center gap-2">
                        <Info className="w-3 h-3" /> System Info
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
