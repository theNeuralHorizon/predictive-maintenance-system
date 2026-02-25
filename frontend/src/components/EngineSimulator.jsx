import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, ShieldCheck, Settings, Play, Pause, Thermometer, Fan, Zap } from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EngineSimulator = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0.5);
  const [telemetry, setTelemetry] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const eventSourceRef = useRef(null);

  const startStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // Connect to SSE stream
    const url = `http://localhost:8000/api/simulate?noise_level=${noiseLevel}`;
    const source = new EventSource(url);
    
    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveData(data);
      
      setTelemetry((prev) => {
        const newHistory = [...prev, data];
        // Keep last 10 readings for the window
        if (newHistory.length > 10) {
          newHistory.shift();
        }
        return newHistory;
      });
    };

    source.onerror = (error) => {
      console.error("SSE Error:", error);
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

  // When we hit 10 samples, trigger prediction
  useEffect(() => {
    if (telemetry.length === 10) {
      const runPrediction = async () => {
        try {
          // Format based on MachineData schema
          const payload = telemetry.map(t => ({
            "Air temperature [K]": t.air_temperature,
            "Process temperature [K]": t.process_temperature,
            "Rotational speed [rpm]": t.rotational_speed,
            "Torque [Nm]": t.torque,
            "Tool wear [min]": t.tool_wear
          }));

          // Send POST to /api/predict/sequence
          // Need to include auth token if backend requires it.
          // Assuming the endpoint handles CORS and Auth properly.
          const token = localStorage.getItem('token') || '';
          
          const response = await axios.post('http://localhost:8000/api/predict/sequence', 
            { sequence: payload },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setPrediction(response.data);
        } catch (error) {
          console.error("Prediction failed:", error);
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
              Live Stochastic Noise Injection & Temporal Inference
            </p>
          </div>
          <div className="flex items-center gap-4">
             <a href="/dashboard" className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-white">
                Back to Dashboard
             </a>
          </div>
        </div>

        {/* Controls & Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls */}
          <div className="p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f] flex flex-col gap-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" /> Simulator Controls
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
                    // Restart stream with new noise level
                    startStream();
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
               <Activity className="w-4 h-4 text-blue-500" /> Core Engine Telemetry
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Engine RPM</span>
                <p className="text-2xl font-black text-white mt-2">{liveData ? liveData.engine_rpm.toFixed(1) : '---'}</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Oil Pressure (PSI)</span>
                <p className="text-2xl font-black text-white mt-2">{liveData ? liveData.oil_pressure_psi.toFixed(1) : '---'}</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Coolant Temp (°C)</span>
                <p className="text-2xl font-black text-white mt-2">{liveData ? liveData.coolant_temp_c.toFixed(1) : '---'}</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vibration Level</span>
                <p className="text-2xl font-black text-white mt-2">{liveData ? liveData.vibration_level.toFixed(2) : '---'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inference Results area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${
            !prediction ? 'bg-[#0d0d0f] border-white/5' : 
            prediction.anomaly ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
          } relative overflow-hidden flex flex-col justify-center`}>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                LSTM Sequence Prediction
              </span>
              
              {!prediction ? (
                <>
                  <ShieldCheck className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-xl font-black text-slate-500 uppercase tracking-tight">Awaiting Window...</p>
                </>
              ) : prediction.anomaly ? (
                <>
                  <AlertTriangle className="w-16 h-16 text-rose-500 mb-4 animate-pulse" />
                  <p className="text-3xl font-black text-rose-500 uppercase tracking-tighter">Failure Predicted</p>
                  <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mt-2">{Math.round(prediction.failure_probability * 100)}% Confidence</p>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-16 h-16 text-emerald-500 mb-4" />
                  <p className="text-3xl font-black text-emerald-500 uppercase tracking-tighter">Nominal</p>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-2">{Math.round((1 - prediction.failure_probability) * 100)}% Health Score</p>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0d0f]">
             <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
               <Fan className="w-4 h-4 text-purple-500" /> Temporal Window (RPM Variability)
             </h3>
             <div className="h-[250px]">
                {telemetry.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetry.map((t, i) => ({ index: i, rpm: t.engine_rpm }))}>
                      <defs>
                        <linearGradient id="rpmGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                      <XAxis dataKey="index" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip contentStyle={{ backgroundColor: '#0d0d0f', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="rpm" stroke="#a855f7" strokeWidth={3} fill="url(#rpmGradient)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold uppercase text-xs tracking-widest border border-dashed border-white/10 rounded-2xl">
                     Wait for stream...
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
