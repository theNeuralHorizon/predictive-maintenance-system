import pandas as pd
import joblib
import os
import sys

# Add project root to path to ensure we can import from ml
sys.path.append(os.path.join(os.path.dirname(__file__), "../../"))

from ml.preprocessing import ARTIFACTS_DIR as PREPROC_ARTIFACTS
from ml.models import MODEL_PATH as FAILURE_MODEL_PATH
from ml.anomaly_detection import MODEL_PATH as ANOMALY_MODEL_PATH
from backend.schemas.request import MachineData

class MLService:
    def __init__(self):
        self.scaler = None
        self.failure_model = None
        self.anomaly_model = None
        self._load_models()

    def _load_models(self):
        try:
            self.scaler = joblib.load(os.path.join(PREPROC_ARTIFACTS, "scaler.joblib"))
            self.failure_model = joblib.load(FAILURE_MODEL_PATH)
            self.anomaly_model = joblib.load(ANOMALY_MODEL_PATH)
            print("Models loaded successfully.")
        except Exception as e:
            print(f"Error loading models: {e}")
            # In production, we might want to crash if models are critical
            # but for now we'll just log
            pass

    def predict(self, data: MachineData):
        if not self.scaler or not self.failure_model or not self.anomaly_model:
            raise RuntimeError("Models are not loaded.")

        # Convert simple input to DataFrame
        # input_dict keys must match what the model expects (original loading phase)
        # However, our model expects features AFTER feature engineering (rolling means etc)
        # mapping request fields to raw CSV column names
        input_dict = {
            "Air temperature [K]": [data.air_temperature],
            "Process temperature [K]": [data.process_temperature],
            "Rotational speed [rpm]": [data.rotational_speed],
            "Torque [Nm]": [data.torque],
            "Tool wear [min]": [data.tool_wear]
        }
        
        df = pd.DataFrame(input_dict)
        
        # FEATURE ENGINEERING ADAPTATION
        # Since we only get a single point, we cannot compute real rolling stats.
        # We will approximate:
        # Rolling Mean = Current Value
        # Rolling Std = 0
        # Delta = 0
        
        sensor_cols = ['Air temperature [K]', 'Process temperature [K]', 'Rotational speed [rpm]', 'Torque [Nm]']
        
        for col in sensor_cols:
            df[f'{col}_rolling_mean'] = df[col]
            df[f'{col}_rolling_std'] = 0.0
            df[f'{col}_delta'] = 0.0
            
        # Preprocessing (Scaling)
        # Note: We manually load/scale because our ml.preprocessing function drops columns we don't have (ID)
        # But our input df doesn't have IDs anyway.
        # We just need to ensure column order matches scaler.
        
        # We need to trust the scaler was trained on specific columns.
        # The scaler stores feature_names_in_ in newer sklearn versions.
        
        try:
            # Reorder df columns to match scaler's expected input
            if hasattr(self.scaler, 'feature_names_in_'):
                df = df[self.scaler.feature_names_in_]
            
            X_scaled = self.scaler.transform(df)
            
            # Prediction
            anomaly_score = self.anomaly_model.predict(X_scaled)[0] # -1 for anomaly, 1 for normal
            is_anomaly = True if anomaly_score == -1 else False
            
            failure_prob = self.failure_model.predict_proba(X_scaled)[0][1] # Probability of class 1
            prediction = self.failure_model.predict(X_scaled)[0]
            
            return {
                "anomaly": is_anomaly,
                "failure_probability": float(failure_prob),
                "prediction": int(prediction)
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            raise e

ml_service = MLService()
