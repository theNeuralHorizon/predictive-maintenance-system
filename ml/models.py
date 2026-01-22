from sklearn.ensemble import RandomForestClassifier
import joblib
import os
import pandas as pd

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "failure_model.joblib")

def train_failure_model(X: pd.DataFrame, y: pd.Series, save_path: str = None) -> RandomForestClassifier:
    """Trains a Random Forest classifier for failure prediction."""
    model = RandomForestClassifier(class_weight="balanced", random_state=42)
    model.fit(X, y)
    
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        joblib.dump(model, save_path)
    
    return model

def load_failure_model(path: str = None) -> RandomForestClassifier:
    if path is None:
        # Fallback to default mostly for legacy or testing without config
        # But really we should assume path is passed now.
        # Construct default path relative to this file? 
        # For now let's raise if not provided or if devault is needed we can keep old logic?
        # Let's support the passed path primarily.
        ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
        # Check if v1 exists? No, that's ambiguous.
        # Let's just default to the CURRENT default which is now broken since we moved files?
        # Better: Require path.
        raise ValueError("path must be provided to load_failure_model")
        
    if not os.path.exists(path):
        raise FileNotFoundError(f"Failure model not found at {path}")
    return joblib.load(path)
