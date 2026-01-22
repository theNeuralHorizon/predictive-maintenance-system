import numpy as np
from scipy.stats import ks_2samp
import joblib
import os
from threading import Lock

class DriftDetector:
    def __init__(self, reference_path: str, window_size: int = 1000, threshold: float = 0.05):
        self.reference_data = None
        self.window_size = window_size
        self.threshold = threshold
        self.window = []
        self.lock = Lock()
        self.feature_names = ["Air temperature [K]", "Process temperature [K]", "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]"] # Approximate mapping based on input columns order in ml_service

        if os.path.exists(reference_path):
            try:
                self.reference_data = joblib.load(reference_path)
                # Convert DataFrame to numpy array if essential
                if hasattr(self.reference_data, "values"):
                     self.reference_data = self.reference_data.values
                print(f"DriftDetector loaded reference data from {reference_path}")
            except Exception as e:
                print(f"DriftDetector failed to load reference data: {e}")
        else:
            print(f"DriftDetector: Reference path {reference_path} not found.")

    def add_data(self, data_point: np.array):
        """
        Add a single data point (1D array) to the sliding window.
        """
        with self.lock:
            self.window.append(data_point)
            if len(self.window) > self.window_size:
                self.window.pop(0)

    def detect_drift(self) -> dict:
        """
        Compare window against reference data using KS-test.
        Returns a dictionary of drift results per feature.
        """
        if self.reference_data is None:
            return {"error": "No reference data loaded"}
        
        with self.lock:
            if len(self.window) < 50: # Minimum samples to run test
                return {"status": "insufficient_data", "current_samples": len(self.window)}
            
            current_data = np.array(self.window)
        
        drift_report = {}
        has_drift = False
        
        # reference_data shape: (N, n_features)
        # current_data shape: (M, n_features)
        
        n_features = self.reference_data.shape[1]
        
        for i in range(n_features):
            ref_feature = self.reference_data[:, i]
            curr_feature = current_data[:, i]
            
            # KS Test
            try:
                statistic, p_value = ks_2samp(ref_feature, curr_feature)
                
                is_drift = p_value < self.threshold
                if is_drift:
                    has_drift = True
                
                feat_name = self.feature_names[i] if i < len(self.feature_names) else f"Feature {i}"
                
                drift_report[feat_name] = {
                    "drift_detected": bool(is_drift),
                    "p_value": float(p_value),
                    "statistic": float(statistic)
                }
            except Exception as e:
                drift_report[f"Feature {i}"] = {"error": str(e)}

        return {
            "overall_drift": has_drift,
            "report": drift_report,
            "samples": len(self.window)
        }
