import joblib
import pandas as pd
from sklearn.model_selection import train_test_split

from data_loader import load_data
from preprocessing import preprocess_data
from feature_engineering import add_rolling_features, add_sensor_deltas
from anomaly_detection import train_isolation_forest
from models import train_random_forest

DATA_PATH = "../data/raw/ai4i2020.csv"
ARTIFACT_PATH = "artifacts/"

def main():
    # Load data
    df = load_data(DATA_PATH)

    # Feature engineering
    df = add_rolling_features(df)
    df = add_sensor_deltas(df)

    # Preprocessing
    X, y, scaler = preprocess_data(df)

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train models
    anomaly_model = train_isolation_forest(X_train)
    failure_model = train_random_forest(X_train, y_train)

    # Save artifacts
    joblib.dump(scaler, ARTIFACT_PATH + "scaler.joblib")
    joblib.dump(anomaly_model, ARTIFACT_PATH + "anomaly_model.joblib")
    joblib.dump(failure_model, ARTIFACT_PATH + "failure_model.joblib")

    print("Models trained and saved successfully.")

if __name__ == "__main__":
    main()
import joblib
from sklearn.model_selection import train_test_split

from ml.data_loader import load_data
from ml.preprocessing import preprocess_data
from ml.feature_engineering import add_rolling_features, add_sensor_deltas
from ml.anomaly_detection import train_isolation_forest
from ml.models import train_random_forest

DATA_PATH = "data/raw/ai4i2020.csv"
ARTIFACT_PATH = "ml/artifacts/"

def main():
    df = load_data(DATA_PATH)

    df = add_rolling_features(df)
    df = add_sensor_deltas(df)

    X, y, scaler = preprocess_data(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    anomaly_model = train_isolation_forest(X_train)
    failure_model = train_random_forest(X_train, y_train)

    joblib.dump(scaler, ARTIFACT_PATH + "scaler.joblib")
    joblib.dump(anomaly_model, ARTIFACT_PATH + "anomaly_model.joblib")
    joblib.dump(failure_model, ARTIFACT_PATH + "failure_model.joblib")

    print("Models trained and saved successfully.")

if __name__ == "__main__":
    main()
