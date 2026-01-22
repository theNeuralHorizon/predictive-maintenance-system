import React, { useState } from 'react';
import axios from 'axios';
import { RadialBarChart, RadialBar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const SENSOR_DEFAULTS = {
    "Air temperature [K]": 300.0,
    "Process temperature [K]": 310.0,
    "Rotational speed [rpm]": 1500,
    "Torque [Nm]": 40.0,
    "Tool wear [min]": 0
};

const Dashboard = () => {
    const [formData, setFormData] = useState(SENSOR_DEFAULTS);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: parseFloat(e.target.value)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post('http://localhost:8000/api/predict', formData);
            setResult(response.data);
        } catch (err) {
            setError("Failed to fetch prediction. Ensure backend is running.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const gaugeData = result ? [
        {
            name: 'Safe',
            value: 100,
            fill: '#e5e7eb'
        },
        {
            name: 'Failure Prob',
            value: result.failure_probability * 100,
            fill: result.failure_probability > 0.5 ? '#ef4444' : '#10b981'
        }
    ] : [];

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Predictive Maintenance Dashboard
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold mb-6 text-gray-700">Sensor Readings</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {Object.keys(SENSOR_DEFAULTS).map((key) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">{key}</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name={key}
                                        value={formData[key]}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            ))}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 px-4 rounded-lg text-white font-bold transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {loading ? 'Analyzing...' : 'Predict Status'}
                                </button>
                            </div>
                        </form>
                        {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
                    </div>

                    {/* Results Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center">
                        <h2 className="text-xl font-semibold mb-6 text-gray-700 w-full text-left">Analysis Result</h2>

                        {!result && !loading && (
                            <p className="text-gray-400 text-center">Enter sensor data to see predictions.</p>
                        )}

                        {result && (
                            <div className="w-full flex flex-col items-center animate-fade-in">
                                {/* Status Badge */}
                                <div className={`px-6 py-2 rounded-full text-lg font-bold mb-8 ${result.anomaly
                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                    }`}>
                                    {result.anomaly ? '⚠ ANOMALY DETECTED' : '✔ NORMAL OPERATION'}
                                </div>

                                {/* Probability Gauge */}
                                <div className="h-64 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="60%"
                                            outerRadius="100%"
                                            barSize={20}
                                            data={gaugeData}
                                            startAngle={180}
                                            endAngle={0}
                                        >
                                            <RadialBar
                                                minAngle={15}
                                                background
                                                clockWise
                                                dataKey="value"
                                                cornerRadius={10}
                                            />
                                            <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-gray-700">
                                                {(result.failure_probability * 100).toFixed(1)}%
                                            </text>
                                            <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-gray-500">
                                                Failure Probability
                                            </text>
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-6 w-full grid grid-cols-2 gap-4 text-center">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="block text-xs text-gray-500 uppercase">Prediction Class</span>
                                        <span className="text-lg font-mono font-semibold text-gray-800">{result.prediction}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="block text-xs text-gray-500 uppercase">Confidence</span>
                                        <span className="text-lg font-mono font-semibold text-gray-800">High</span>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
