import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Thermometer,
  Settings,
  TrendingUp,
  ShieldCheck,
  Zap,
  RefreshCcw,
  DollarSign,
  ChevronRight,
  Gauge,
  BarChart3,
  Database,
  Terminal,
  Cpu,
  Fan
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
 * STEELPULSE - REAL-TIME INFERENCE ENGINE
 * DATA SCHEMA MAPPED TO AI4I 2020 CSV
 */

const App = () => {
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Simulation: Triggering updates every 2 seconds
  useEffect(() => {
    // Defined inside useEffect to avoid dependency array instability and re-render loops
    const generateNewPacket = (prevHistory) => {
      const time = new Date().toLocaleTimeString();
      const lastPacket = prevHistory[prevHistory.length - 1];

      // 1. Base Sensor Simulation (Physical Logic mirroring AI4I 2020 dataset)
      const airTemp = 297 + (Math.sin(Date.now() / 10000) * 2) + Math.random();
      const processTemp = airTemp + 10 + (Math.random() * 1.5);

      // Torque and RPM are usually inversely related in motors
      const rpm = 1400 + (Math.random() * 200) - (Math.random() * 50);
      const torque = (60000 * (4 + Math.random())) / (2 * Math.PI * rpm);

      const wear = lastPacket ? lastPacket.sensor_data.tool_wear + 0.5 : 0;

      // 2. Failure Mode Logic (HDF, PWF, OSF, TWF)
      const hdf = (processTemp - airTemp < 8.6) && (rpm < 1380);
      const pwf = (torque * (rpm * (2 * Math.PI / 60))) < 3500 || (torque * (rpm * (2 * Math.PI / 60))) > 9000;
      const osf = (torque * wear) > 11000;
      const twf = wear > 200;

      const machineFailure = hdf || pwf || osf || twf || (Math.random() > 0.995);

      return {
        timestamp: time,
        sensor_data: {
          UDI: Math.floor(Math.random() * 10000),
          product_id: "M14860",
          type: "M",
          air_temp: parseFloat(airTemp.toFixed(2)),
          process_temp: parseFloat(processTemp.toFixed(2)),
          rpm: Math.floor(rpm),
          torque: parseFloat(torque.toFixed(2)),
          tool_wear: parseFloat(wear.toFixed(1))
        },
        model_outputs: {
          failure_probability: machineFailure ? 0.95 : (wear / 300) + (Math.random() * 0.05),
          is_anomaly: machineFailure ? -1 : (Math.random() > 0.96 ? -1 : 1),
          anomaly_score: machineFailure ? -0.85 : (Math.random() * 0.4) - 0.2, // Mocking decision_function
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
            "Rotational speed [rpm]": 0.041,
            "Torque [Nm]": 0.22,
            "Tool wear [min]": 0.91
          }
        }
      };
    };

    const updateLoop = () => {
      setHistory(prev => {
        const nextPacket = generateNewPacket(prev);
        return [...prev.slice(-24), nextPacket];
      });
    };

    const interval = setInterval(updateLoop, 2000);
    updateLoop(); // Initial run
    return () => clearInterval(interval);
  }, []); // Empty dependency array ensures this only runs once on mount

  // Derive current state from history
  const currentJson = useMemo(() => history[history.length - 1], [history]);

  // Derived anomaly stats
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

    if (health < 30) return { label: 'CRITICAL', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
    if (health < 70) return { label: 'WARNING', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { label: 'OPTIMAL', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  }, [currentJson]);

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
    <div className="min-h-screen bg-[#060608] text-slate-300 font-sans selection:bg-blue-500/30">
      <header className="border-b border-white/5 bg-[#0a0a0c]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Activity className="text-black w-7 h-7 stroke-[2.5px]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">SteelPulse</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Live Inference Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono text-blue-400 font-bold tracking-widest">{currentJson.timestamp}</span>
            </div>
            <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Health Score */}
          <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${currentStatus.bg} ${currentStatus.border}`}>
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
            <div className="mt-6 flex flex-wrap gap-2">
              {Object.entries(currentJson.model_outputs.active_failure_modes).map(([mode, active]) => (
                active && <span key={mode} className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black uppercase tracking-tighter">{mode} FLAG</span>
              ))}
            </div>
          </div>

          {/* Anomaly Watch - Updated with Stats */}
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
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${activeTab === tab ? 'bg-white text-black border-white shadow-xl shadow-white/10' : 'bg-transparent text-slate-500 border-white/10 hover:border-white/20'
                }`}
            >
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
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Continuous Risk Profile (Random Forest Output)</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Flag</span>
                    </div>
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
                      <Area
                        type="step"
                        dataKey={(d) => (1 - d.model_outputs.failure_probability) * 100}
                        stroke="#3b82f6"
                        strokeWidth={4}
                        fill="url(#pulseGradient)"
                      />
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
                          <p className={`text-xl font-mono ${pValue < 0.05 ? 'text-rose-500 font-black' : 'text-slate-400'}`}>{pValue.toFixed(4)}</p>
                          <p className={`text-[8px] font-black uppercase tracking-widest ${pValue < 0.05 ? 'text-rose-600' : 'text-emerald-500'}`}>{pValue < 0.05 ? 'DRIFT ALERT' : 'MODEL STABLE'}</p>
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
          {['System Logs', 'Inference Config', 'XAI Audit'].map(item => (
            <button key={item} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors font-bold">{item}</button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default App;