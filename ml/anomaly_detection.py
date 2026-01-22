from sklearn.ensemble import IsolationForest
import joblib
import os
import pandas as pd

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "anomaly_model.joblib")

def train_anomaly_detector(X: pd.DataFrame, contamination: float = 0.05) -> IsolationForest:
    """Trains an Isolation Forest for anomaly detection."""
    model = IsolationForest(contamination=contamination, random_state=42)
    model.fit(X)
    
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    
    return model

def load_anomaly_detector() -> IsolationForest:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Anomaly model not found at {MODEL_PATH}")
    return joblib.load(MODEL_PATH)
