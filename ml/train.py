import os
from ml.data_loader import load_data
from ml.feature_engineering import add_rolling_features
from ml.preprocessing import preprocess_data
from ml.anomaly_detection import train_anomaly_detector
from ml.models import train_failure_model
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

import argparse
import joblib

def main():
    parser = argparse.ArgumentParser(description='Train Predictive Maintenance Models')
    parser.add_argument('--version', type=str, default='v1', help='Model version tag (default: v1)')
    args = parser.parse_args()
    
    version_dir = os.path.join(os.path.dirname(__file__), "artifacts", args.version)
    os.makedirs(version_dir, exist_ok=True)
    print(f"Training Model Version: {args.version}")
    print(f"Artifacts will be saved to: {version_dir}")

    print("Loading data...")
    df = load_data()
    
    print("Feature engineering...")
    df_feat = add_rolling_features(df)
    
    # ... split logic ...
    train_df, test_df = train_test_split(df_feat, test_size=0.2, random_state=42, stratify=df_feat['Machine failure'])
    
    print("Preprocessing Train...")
    scaler_path = os.path.join(version_dir, "scaler.joblib")
    X_train, y_train, scaler = preprocess_data(train_df, is_training=True, scaler_path=scaler_path)
    
    # Save reference data for drift detection (sample 1000 rows)
    ref_data_path = os.path.join(version_dir, "reference_data.joblib")
    # Store as DataFrame to keep column names if possible, but X_train is numpy array from StandardScaler
    # We should reconstruct DF with columns if we want feature names
    # preprocess_data returns numpy array for X_train because scaler.fit_transform returns array
    # Let's save the array for now, or check if we can get feature names
    
    # Actually, preprocess_data returns (X, y, scaler). 
    # In preprocessing.py: X_scaled = scaler.fit_transform(X) -> returns numpy array.
    
    # To facilitate easier drift detection with feature names, let's try to save as DF if possible, 
    # or just save the array and use indices or scaler feature names.
    # We'll save the numpy array for simplicity and robustness.
    
    # Sample 1000 rows
    if X_train.shape[0] > 1000:
        reference_data = X_train[:1000]
    else:
        reference_data = X_train
        
    joblib.dump(reference_data, ref_data_path)
    print(f"Saved reference data to {ref_data_path}")
    
    print("Preprocessing Test...")
    X_test, y_test, _ = preprocess_data(test_df, is_training=False, scaler_path=scaler_path)
    
    print("Training Anomaly Detector (Isolation Forest) on Train set...")
    iso_model_path = os.path.join(version_dir, "anomaly_model.joblib")
    iso_forest = train_anomaly_detector(X_train, save_path=iso_model_path)
    
    print("Training Failure Predictor (Random Forest) on Train set...")
    rf_model_path = os.path.join(version_dir, "failure_model.joblib")
    rf_model = train_failure_model(X_train, y_train, save_path=rf_model_path)
    
    print("Evaluating on TEST set...")
    y_pred = rf_model.predict(X_test)
    print(classification_report(y_test, y_pred))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    print(f"Training complete. Artifacts saved in {version_dir}")

if __name__ == "__main__":
    main()
