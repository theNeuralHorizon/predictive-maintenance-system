from sklearn.ensemble import RandomForestClassifier
import joblib
import os
import pandas as pd

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "failure_model.joblib")

def train_failure_model(X: pd.DataFrame, y: pd.Series) -> RandomForestClassifier:
    """Trains a Random Forest classifier for failure prediction."""
    model = RandomForestClassifier(class_weight="balanced", random_state=42)
    model.fit(X, y)
    
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    
    return model

def load_failure_model() -> RandomForestClassifier:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Failure model not found at {MODEL_PATH}")
    return joblib.load(MODEL_PATH)
