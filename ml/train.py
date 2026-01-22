import os
from ml.data_loader import load_data
from ml.feature_engineering import add_rolling_features
from ml.preprocessing import preprocess_data
from ml.anomaly_detection import train_anomaly_detector
from ml.models import train_failure_model
from sklearn.metrics import classification_report, confusion_matrix

def main():
    print("Loading data...")
    df = load_data()
    
    print("Feature engineering...")
    df_feat = add_rolling_features(df)
    
    print("Preprocessing...")
    X, y, _ = preprocess_data(df_feat, is_training=True)
    
    print("Training Anomaly Detector (Isolation Forest)...")
    iso_forest = train_anomaly_detector(X)
    # Isolation Forest predicts -1 for anomalies, 1 for normal
    # We can print some stats
    anomalies = iso_forest.predict(X)
    print(f"Anomalies found in training set: {(anomalies == -1).sum()} / {len(anomalies)}")
    
    print("Training Failure Predictor (Random Forest)...")
    rf_model = train_failure_model(X, y)
    
    print("Evaluating Failure Predictor...")
    y_pred = rf_model.predict(X)
    print(classification_report(y, y_pred))
    print("Confusion Matrix:")
    print(confusion_matrix(y, y_pred))
    
    print("Training complete. Artifacts saved in ml/artifacts/")

if __name__ == "__main__":
    main()
