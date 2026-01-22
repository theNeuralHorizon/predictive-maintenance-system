from sklearn.ensemble import IsolationForest
import joblib
import os
import pandas as pd

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "anomaly_model.joblib")

def train_anomaly_detector(X: pd.DataFrame, contamination: float = 0.05, save_path: str = None) -> IsolationForest:
    """Trains an Isolation Forest for anomaly detection."""
    model = IsolationForest(contamination=contamination, random_state=42)
    model.fit(X)
    
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        joblib.dump(model, save_path)
    
    return model

def load_anomaly_detector(path: str = None) -> IsolationForest:
    if path is None:
        raise ValueError("path must be provided to load_anomaly_detector")
        
    if not os.path.exists(path):
        raise FileNotFoundError(f"Anomaly model not found at {path}")
    return joblib.load(path)
