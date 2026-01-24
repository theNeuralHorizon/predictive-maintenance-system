import React, { useState } from 'react';
import { predictFailure } from '../services/api';

const InputField = ({ label, name, value, onChange, type = "number", step = "0.1" }) => (
    <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
        </label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            step={step}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
            required
        />
    </div>
);

const ResultCard = ({ result }) => {
    if (!result) return null;

    const isFailure = result.prediction === 1;
    const statusColor = isFailure ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800';
    const statusIcon = isFailure ? '⚠️' : '✅';

    return (
        <div className={`mt-6 p-6 rounded-lg border ${statusColor} animate-fade-in`}>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                {statusIcon} {isFailure ? 'Failure Predicted' : 'System Healthy'}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="block opacity-70">Anomaly Detected</span>
                    <span className="font-semibold">{result.anomaly ? 'YES' : 'NO'}</span>
                </div>
                <div>
                    <span className="block opacity-70">Failure Probability</span>
                    <span className="font-semibold">{(result.failure_probability * 100).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [formData, setFormData] = useState({
        udi: 'M14860',
        air_temperature: '298.1',
        process_temperature: '308.6',
        rotational_speed: '1551',
        torque: '42.8',
        tool_wear: '0'
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error/result on change to encourage re-submission
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await predictFailure(formData);
            setResult(data);
        } catch (err) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            {/* Header */}
            <header className="mb-8 text-center md:text-left border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Predictive Maintenance Dashboard</h1>
                <p className="text-slate-500 mt-2">Real-time anomaly detection and equipment health monitoring system.</p>
            </header>

            <div className="grid md:grid-cols-3 gap-8">

                {/* Input Panel */}
                <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
                    <h2 className="text-xl font-semibold mb-5 text-slate-800">Sensor Readings</h2>
                    <form onSubmit={handleSubmit}>
                        <InputField label="UDI" name="udi" type="text" value={formData.udi} onChange={handleChange} />
                        <InputField label="Air Temp [K]" name="air_temperature" value={formData.air_temperature} onChange={handleChange} />
                        <InputField label="Process Temp [K]" name="process_temperature" value={formData.process_temperature} onChange={handleChange} />
                        <InputField label="Rotational Speed [rpm]" name="rotational_speed" value={formData.rotational_speed} onChange={handleChange} step="1" />
                        <InputField label="Torque [Nm]" name="torque" value={formData.torque} onChange={handleChange} />
                        <InputField label="Tool Wear [min]" name="tool_wear" value={formData.tool_wear} onChange={handleChange} step="1" />

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full mt-4 py-2.5 px-4 rounded-lg text-white font-medium transition-all ${loading
                                    ? 'bg-indigo-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
                                }`}
                        >
                            {loading ? 'Analyzing...' : 'Predict Status'}
                        </button>
                    </form>
                </div>

                {/* Results Panel */}
                <div className="md:col-span-2">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
                        <h2 className="text-xl font-semibold mb-5 text-slate-800">Diagnostic Analysis</h2>

                        {!result && !error && !loading && (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                <span className="text-4xl mb-3">🔍</span>
                                <p>Enter sensor parameters to run inference.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="h-64 flex flex-col items-center justify-center text-indigo-500">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                                <p>Running random forest classification...</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <p className="font-bold">Error</p>
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}

                        <ResultCard result={result} />

                        {result && (
                            <div className="mt-8">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Model Insights</h3>
                                <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
                                    <p>This prediction was generated by the <b>v1.0 Ensemble Model</b> (Isolation Forest + Random Forest).</p>
                                    <p className="mt-2 text-xs opacity-75">Response Latency: &lt;100ms</p>
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
