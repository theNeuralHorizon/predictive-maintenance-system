/**
 * API Service for Predictive Maintenance System
 * centralized fetch logic for consistency
 */


const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Validates request data before sending
 * @param {Object} data - The sensor data
 * @throws {Error} If validation fails
 */
const validateInput = (data) => {
    const expectedKeys = ['udi', 'air_temperature', 'process_temperature', 'rotational_speed', 'torque', 'tool_wear'];
    for (const key of expectedKeys) {
        if (data[key] === undefined || data[key] === '') {
            throw new Error(`Missing required field: ${key}`);
        }
        if (key !== 'udi' && isNaN(Number(data[key]))) {
            throw new Error(`Field ${key} must be a number`);
        }
    }
};

/**
 * Sends a prediction request to the backend
 * @param {Object} sensorData - The sensor readings
 * @returns {Promise<Object>} The prediction result
 */
export const predictFailure = async (sensorData) => {
    validateInput(sensorData);

    // Ensure numeric types
    const payload = {
        udi: sensorData.udi,
        air_temperature: Number(sensorData.air_temperature),
        process_temperature: Number(sensorData.process_temperature),
        rotational_speed: Number(sensorData.rotational_speed),
        torque: Number(sensorData.torque),
        tool_wear: Number(sensorData.tool_wear)
    };

    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorMsg = `Request failed (Status: ${response.status})`;
            try {
                const errorData = await response.json();
                if (errorData.detail) errorMsg = errorData.detail;
            } catch { /* ignore JSON parse error */ }
            throw new Error(errorMsg);
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};
