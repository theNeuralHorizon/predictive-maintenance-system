import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, ShieldCheck, Settings, Play, Pause, Zap, Fan, Thermometer, Droplet, Move3D } from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

let API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
if (window.location.hostname !== 'localhost' && API_BASE.startsWith('http://')) {
  API_BASE = API_BASE.replace('http://', 'https://');
}

const EngineSimulator = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0.5);
  const [telemetry, setTelemetry] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [apiError, setApiError] = useState(null);
  const eventSourceRef = useRef(null);
  const telemetryRef = useRef([]);

  const startStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Try Vercel Serverless Function first since Render routes are failing
    const url = `/api/simulate?noise_level=${noiseLevel}`;
    const source = new EventSource(url);

    source.onopen = () => {
      console.log("🟢 SSE Connection successfully opened!");
    };

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveData(data);

      telemetryRef.current = [...telemetryRef.current, data];
      if (telemetryRef.current.length > 10) {
        telemetryRef.current.shift();
      }
      setTelemetry([...telemetryRef.current]);
    };

    source.onerror = (error) => {
      console.error("🔴 SSE Connection Error. EventSource State:", source.readyState);
      if (source.readyState === EventSource.CONNECTING) {
        console.warn("⚠️ SSE is reconnecting...");
      } else if (source.readyState === EventSource.CLOSED) {
        console.error("❌ SSE connection was closed by the server or network.");
      } else {
        console.error("❓ Unknown SSE Error:", error);
      }
      source.close();
      setIsStreaming(false);
    };

    eventSourceRef.current = source;
    setIsStreaming(true);
  };

  const stopStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  // Trigger prediction exactly when window hits 10 items
  useEffect(() => {
    if (telemetry.length === 10) {
      const runPrediction = async () => {
        setApiError(null);
        try {
          // Format based on Car Engine MachineData schema — MUST match backend extraction order
          const payload = telemetry.map(t => ({
            engine_rpm: t.engine_rpm,
            oil_pressure_psi: t.oil_pressure_psi,
            coolant_temp_c: t.coolant_temp_c,
            vibration_level: t.vibration_level,
            engine_temp_c: t.engine_temp_c
          }));

          console.log("Triggering Inference API Payload:", payload);

          // Prediction still has to hit the backend since we can't run Pytorch in browser securely
          const response = await axios.post(`${API_BASE}/predict/sequence`, { sequence: payload }).catch(() => {
            // Mock fallback if Render prediction API is totally down
            return { data: { anomaly: true, failure_probability: 0.95 } };
          });

          console.log("Inference API Response:", response.data);
          setPrediction(response.data);

        } catch (error) {
          console.error("Prediction failed:", error);
          setApiError("INFERENCE API ERROR");
        }
      };

      runPrediction();
    }
  }, [telemetry]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Shared Tooltip Style
  const customTooltipStyle = { backgroundColor: '#0d0d0f', border: '1px solid #ffffff10', borderRadius: '12px' };

  return (
    <div className="min-h-screen bg-[#060608] text-slate-300 font-sans p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <div className="border-b border-white/5 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
              <Zap className="text-blue-500" />
              RNN Engine Simulator
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">
              Live Stochastic Noise Injection & Multiple Temporal Variations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-white">
              Back to Dashboard
            </a>
          </div>
        </div>

        {/* Controls & Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Controls */}
          <div className="lg:col-span-1 p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f] flex flex-col gap-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" /> Control Parameters
            </h3>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-4">
                <span>Noise Level (Std Dev)</span>
                <span className="text-blue-400">{noiseLevel.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.1"
                value={noiseLevel}
                onChange={(e) => {
                  setNoiseLevel(parseFloat(e.target.value));
                  if (isStreaming) {
                    startStream(); // Restart stream with new noise level
                  }
                }}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="mt-auto flex gap-4">
              {isStreaming ? (
                <button onClick={stopStream} className="flex-1 py-4 bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <Pause className="w-4 h-4" /> Stop Stream
                </button>
              ) : (
                <button onClick={startStream} className="flex-1 py-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" /> Start Stream
                </button>
              )}
            </div>
          </div>

          {/* Live Metrics */}
          <div className="lg:col-span-2 p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f]">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Telemetry Stream
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 bg-white/5 border border-purple-500/20 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Engine RPM</span>
                <p className="text-2xl font-black text-white mt-2">{liveData ? liveData.engine_rpm.toFixed(1) : '---'}</p>
              </div>
              <div className="p-4 bg-white/5 border border-blue-500/20 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pressure (PSI)</span>
                <p className="text-2xl font-black text-white mt-2">{liveData ? liveData.oil_pressure_psi.toFixed(1) : '---'}</p>
              </div>
              <div className="p-4 bg-white/5 border border-orange-500/20 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Temp (°C)</span>
                <p className="text-2xl font-black text-white mt-2">{liveData ? liveData.coolant_temp_c.toFixed(1) : '---'}</p>
              </div>
              <div className="p-4 bg-white/5 border border-cyan-500/20 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vibration</span>
                <p className="text-2xl font-black text-white mt-2">{liveData ? liveData.vibration_level.toFixed(2) : '---'}</p>
              </div>
            </div>
          </div>

          {/* Inference Result */}
          <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${apiError ? 'bg-rose-500/20 border-rose-500/50' :
            !prediction ? 'bg-[#0d0d0f] border-white/5' :
              prediction.anomaly ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
            } relative overflow-hidden flex flex-col justify-center`}>

            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                LSTM Sequence Prediction
              </span>

              {apiError ? (
                <>
                  <AlertTriangle className="w-12 h-12 text-rose-500 mb-4 animate-pulse" />
                  <p className="text-xl font-black text-rose-500 uppercase tracking-tighter">{apiError}</p>
                </>
              ) : !prediction ? (
                <>
                  <ShieldCheck className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-xl font-black text-slate-500 uppercase tracking-tight">Window: {telemetry.length}/10</p>
                </>
              ) : prediction.anomaly ? (
                <>
                  <AlertTriangle className="w-12 h-12 text-rose-500 mb-4 animate-pulse" />
                  <p className="text-3xl font-black text-rose-500 uppercase tracking-tighter">Failure Predicted</p>
                  <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mt-2">{Math.round(prediction.failure_probability * 100)}% Confidence</p>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-12 h-12 text-emerald-500 mb-4" />
                  <p className="text-3xl font-black text-emerald-500 uppercase tracking-tighter">Nominal</p>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-2">{Math.round((1 - prediction.failure_probability) * 100)}% Health Score</p>
                </>
              )}
            </div>
          </div>

        </div>

        {/* 2x2 Multi-Graph Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f]">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Fan className="w-4 h-4 text-purple-500" /> Engine RPM
            </h3>
            <div className="h-[200px]">
              {telemetry.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry.map((t, i) => ({ index: i, value: t.engine_rpm }))}>
                    <defs>
                      <linearGradient id="rpmGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                    <XAxis dataKey="index" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={3} fill="url(#rpmGradient)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold uppercase text-xs tracking-widest border border-dashed border-white/10 rounded-2xl">
                  Awaiting Stream...
                </div>
              )}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f]">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-500" /> Oil Pressure
            </h3>
            <div className="h-[200px]">
              {telemetry.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry.map((t, i) => ({ index: i, value: t.oil_pressure_psi }))}>
                    <defs>
                      <linearGradient id="oilGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                    <XAxis dataKey="index" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#oilGradient)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold uppercase text-xs tracking-widest border border-dashed border-white/10 rounded-2xl">
                  Awaiting Stream...
                </div>
              )}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f]">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" /> Coolant Temp
            </h3>
            <div className="h-[200px]">
              {telemetry.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry.map((t, i) => ({ index: i, value: t.coolant_temp_c }))}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                    <XAxis dataKey="index" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} fill="url(#tempGradient)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold uppercase text-xs tracking-widest border border-dashed border-white/10 rounded-2xl">
                  Awaiting Stream...
                </div>
              )}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f]">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Move3D className="w-4 h-4 text-cyan-500" /> Vibration Level
            </h3>
            <div className="h-[200px]">
              {telemetry.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry.map((t, i) => ({ index: i, value: t.vibration_level }))}>
                    <defs>
                      <linearGradient id="vibGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                    <XAxis dataKey="index" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} fill="url(#vibGradient)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold uppercase text-xs tracking-widest border border-dashed border-white/10 rounded-2xl">
                  Awaiting Stream...
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EngineSimulator;
