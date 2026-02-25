import numpy as np
import time
import json
import logging
from typing import Dict, Any

# Configure basic standard logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)

class SensorSimulator:
    """
    Simulates telemetry data by injecting Gaussian noise into a baseline payload
    to mimic sensor degradation or environmental interference.
    """
    def __init__(self, baseline: Dict[str, float] = None, noise_std_dev: float = 0.5):
        # Default baseline for ai4i2020/car engine (normalized or raw)
        self.baseline = baseline or {
            "air_temperature": 298.1,
            "process_temperature": 308.6,
            "rotational_speed": 1551.0,
            "torque": 42.8,
            "tool_wear": 0.0,
            "engine_rpm": 2500.0,
            "oil_pressure_psi": 40.0,
            "coolant_temp_c": 90.0,
            "vibration_level": 0.5,
            "engine_temp_c": 100.0
        }
        self.noise_std_dev = noise_std_dev
        self.tick = 0
        
    def generate_noisy_payload(self) -> Dict[str, Any]:
        """
        Generates a new payload by adding Gaussian noise to the baseline.
        Simulates engine degradation over time to trigger LSTM failures.
        """
        self.tick += 1
        # AGGRESSIVE compounding degradation — reaches critical within ~30 ticks
        degradation_factor = self.tick * 0.5 * (1 + self.tick * 0.05)

        noisy_payload = {}
        for key, value in self.baseline.items():
            base_val = value
            
            # Apply targeted engine degradation to cause drifting out-of-bounds metrics
            if key == "coolant_temp_c":
                base_val += degradation_factor * 1.5   # spike temp hard
            elif key == "engine_temp_c":
                base_val += degradation_factor * 1.2
            elif key == "vibration_level":
                base_val += degradation_factor * 0.08  # ramp vibration
            elif key == "oil_pressure_psi":
                base_val -= degradation_factor * 0.8   # drain pressure fast

            # Inject noise: N(0, std_dev)
            scale_factor = max(1.0, abs(base_val) * 0.05) # 5% of value as base std dev
            proportional_noise = np.random.normal(0, scale_factor * self.noise_std_dev)
            
            noisy_val = base_val + proportional_noise
            
            # Ensure no negative values for things like speed, temp (in K), pressure
            if noisy_val < 0 and key not in ['torque', 'vibration_level']:
                 noisy_val = 0.0
                 
            noisy_payload[key] = round(noisy_val, 2)
            
        noisy_payload["timestamp"] = time.time()
        return noisy_payload

    def stream_data(self, delay_seconds: float = 1.0):
        """
        Generator for Server-Sent Events (SSE).
        Yields a JSON string representing the event payload.
        """
        logger.info("Starting sensor simulation stream")
        try:
            while True:
                payload = self.generate_noisy_payload()
                # Yield in SSE format: "data: <json>\n\n"
                yield f"data: {json.dumps(payload)}\n\n"
                time.sleep(delay_seconds)
        except GeneratorExit:
            logger.info("Client disconnected from simulation stream")
        except Exception as e:
            logger.error(f"Error in simulation stream: {e}")
