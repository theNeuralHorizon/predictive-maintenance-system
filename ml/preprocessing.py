import pandas as pd
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Optional
import joblib
import os

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

def preprocess_data(df: pd.DataFrame, is_training: bool = True, scaler_path: str = None) -> Tuple[pd.DataFrame, pd.DataFrame, Optional[StandardScaler]]:
    """
    Preprocesses data: drops IDs, scales features.
    Returns: (X, y, scaler)
    """
    
    # Columns to drop (IDs and original texts if any)
    # Based on AI4I dataset structure
    drop_cols = ['UDI', 'Product ID', 'Type'] # 'Type' could be OHE, but let's drop for simplicity as per prompt constraints or keep it simple
    
    # Target columns
    target_col = 'Machine failure'
    # There are also other failure modes (TWF, HDF, PWF, OSF, RNF) - we treat them as part of the label or ignore?
    # Prompt says Target: Machine failure (binary)
    # We should drop the specific failure columns to avoid leakage if we are predicting the general 'Machine failure'
    leakage_cols = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    
    available_drop = [c for c in drop_cols + leakage_cols if c in df.columns]
    
    X = df.drop(columns=available_drop)
    
    if target_col in X.columns:
        y = X[target_col]
        X = X.drop(columns=[target_col])
    else:
        y = None
        
    # Scaling
    # Default path fallback ONLY if not provided
    if not scaler_path:
         # raise ValueError("scaler_path must be provided") # Ideal
         # Fallback for now to avoid breaking train script before we edit it
         scaler_path = os.path.join(ARTIFACTS_DIR, "scaler.joblib")
    
    if is_training:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
        joblib.dump(scaler, scaler_path)
    else:
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            X_scaled = scaler.transform(X)
        else:
            raise FileNotFoundError(f"Scaler not found at {scaler_path}. Train model first.")
            
    # Convert back to DataFrame for convenience (optional, useful for column tracking)
    X_scaled_df = pd.DataFrame(X_scaled, columns=X.columns)
    
    return X_scaled_df, y, scaler
