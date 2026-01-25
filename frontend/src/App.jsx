import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// Mock data for Predictive Maintenance
const maintenanceData = [
  { time: '08:00', temp: 65, pressure: 120, health: 95 },
  { time: '09:00', temp: 68, pressure: 122, health: 92 },
  { time: '10:00', temp: 75, pressure: 130, health: 85 },
  { time: '11:00', temp: 85, pressure: 145, health: 70 },
  { time: '12:00', temp: 92, pressure: 160, health: 45 }, // Potential Failure Point
  { time: '13:00', temp: 88, pressure: 140, health: 50 },
];

const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-blue-400">Predictive Maintenance Dashboard</h1>
        <p className="text-gray-400">Real-time Machine Health Monitoring</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Sensor Trends */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Sensor Trends (Temp & Pressure)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={maintenanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="time" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="temp" stroke="#f87171" name="Temp (°C)" strokeWidth={2} />
                <Line type="monotone" dataKey="pressure" stroke="#60a5fa" name="Pressure (PSI)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Machine Health Prediction */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Predicted Health Status (%)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={maintenanceData}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#999" />
                <YAxis stroke="#999" />
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none' }} />
                <Area type="monotone" dataKey="health" stroke="#34d399" fillOpacity={1} fill="url(#colorHealth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-red-900/30 border border-red-500 rounded-lg">
        <p className="text-red-400 font-bold">⚠️ Warning: Abnormal temperature rise detected at 12:00. Maintenance recommended.</p>
      </div>
    </div>
  );
};

export default App;