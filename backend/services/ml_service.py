import pandas as pd
import joblib
import os
import sys
import numpy as np

# Add project root to path to ensure we can import from ml
sys.path.append(os.path.join(os.path.dirname(__file__), "../../"))

from backend.schemas.request import MachineData
from backend.utils.logger import setup_logger
from backend.utils.metrics import metrics_collector
from ml.drift_detector import DriftDetector

logger = setup_logger(__name__)

class MLService:
    def __init__(self):
        self.scaler = None
        self.failure_model = None
        self.anomaly_model = None
        self.drift_detector = None
        
        # Determine version and paths
        self.version = os.getenv("MODEL_VERSION", "v1")
        # Go up from backend/services -> backend -> root, then ml/artifacts/{version}
        # Current file: backend/services/ml_service.py
        # root is ../../
        base_dir = os.path.join(os.path.dirname(__file__), "../../")
        self.artifacts_dir = os.path.join(base_dir, "ml", "artifacts", self.version)
        
        logger.info(f"Initializing MLService with Model Version: {self.version}")
        logger.info(f"Artifacts path: {self.artifacts_dir}")
        
        self._load_models()

    def _load_models(self):
        try:
            scaler_path = os.path.join(self.artifacts_dir, "scaler.joblib")
            failure_path = os.path.join(self.artifacts_dir, "failure_model.joblib")
            anomaly_path = os.path.join(self.artifacts_dir, "anomaly_model.joblib")
            ref_data_path = os.path.join(self.artifacts_dir, "reference_data.joblib")
            
            if not os.path.exists(scaler_path):
                raise FileNotFoundError(f"Scaler not found at {scaler_path}")
                
            self.scaler = joblib.load(scaler_path)
            self.failure_model = joblib.load(failure_path)
            self.anomaly_model = joblib.load(anomaly_path)
            
            # Initialize Drift Detector
            self.drift_detector = DriftDetector(ref_data_path)
            
            logger.info("Models loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            pass

    def predict(self, data: MachineData):
        if not self.scaler or not self.failure_model or not self.anomaly_model:
            logger.error("Attempted prediction with unloaded models.")
            raise RuntimeError("Models are not loaded.")

        try:
            # Update total predictions metric
            metrics_collector.increment_predictions()
            
            # Convert simple input to DataFrame
            input_dict = {
                "Air temperature [K]": [data.air_temperature],
                "Process temperature [K]": [data.process_temperature],
                "Rotational speed [rpm]": [data.rotational_speed],
                "Torque [Nm]": [data.torque],
                "Tool wear [min]": [data.tool_wear]
            }
            
            df = pd.DataFrame(input_dict)
            
            # FEATURE ENGINEERING ADAPTATION (Simplified as before)
            sensor_cols = ['Air temperature [K]', 'Process temperature [K]', 'Rotational speed [rpm]', 'Torque [Nm]']
            
            for col in sensor_cols:
                df[f'{col}_rolling_mean'] = df[col]
                df[f'{col}_rolling_std'] = 0.0
                df[f'{col}_delta'] = 0.0
                
            # Preprocessing (Scaling)
            try:
                if hasattr(self.scaler, 'feature_names_in_'):
                    df = df[self.scaler.feature_names_in_]
                
                X_scaled = self.scaler.transform(df)
                
                # Update Drift Detector with single data point
                if self.drift_detector:
                    self.drift_detector.add_data(X_scaled[0])
                
                # Prediction
                anomaly_score = self.anomaly_model.predict(X_scaled)[0]
                is_anomaly = True if anomaly_score == -1 else False
                
                if is_anomaly:
                    metrics_collector.increment_anomalies()
                
                failure_prob = self.failure_model.predict_proba(X_scaled)[0][1]
                prediction = self.failure_model.predict(X_scaled)[0]
                
                if prediction == 1:
                    metrics_collector.increment_failures()
                
                result = {
                    "anomaly": is_anomaly,
                    "failure_probability": float(failure_prob),
                    "prediction": int(prediction)
                }

                logger.info("Prediction successful", extra={
                    "input_uid": data.udi, 
                    "result": result
                })
                
                return result
                
            except Exception as e:
                raise e
            
        except Exception as e:
            logger.error("Prediction failed", extra={"error": str(e)}, exc_info=True)
            raise e
            
    def get_drift_report(self):
        if self.drift_detector:
            return self.drift_detector.detect_drift()
        return {"error": "Drift detector not initialized"}

    def get_feature_importance(self):
        """
        Returns feature importance from the trained Random Forest model.
        """
        if not self.failure_model:
            raise RuntimeError("Failure model not loaded.")
            
        importances = self.failure_model.feature_importances_
        feature_names = ["Air temperature [K]", "Process temperature [K]", "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]"]
        
        if hasattr(self.failure_model, "feature_names_in_"):
             feature_names = self.failure_model.feature_names_in_.tolist()
        elif hasattr(self.scaler, "feature_names_in_"):
             feature_names = self.scaler.feature_names_in_.tolist()
             
        feature_importance = [
            {"feature": f, "importance": float(i)} 
            for f, i in zip(feature_names, importances)
        ]
        
        feature_importance.sort(key=lambda x: x["importance"], reverse=True)
        
        return feature_importance

ml_service = MLService()
