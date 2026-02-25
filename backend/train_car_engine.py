import os
import pandas as pd
import numpy as np
import logging
import joblib
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Import the newly created RNN resources
from backend.models.rnn_model import PredictiveRNN, create_sequences
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_curve, auc

# Configure basic standard logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)

def build_data_pipeline(data_path: str):
    """
    Ingests dataset, extracts core engine features dynamically without hardcoding
    AI4I columns, and engineers the target label.
    """
    logger.info(f"Loading data from {data_path}")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Please download it from Kaggle.")
        
    df = pd.read_csv(data_path)
    
    # Core Engine Features mapping
    features = ['engine_rpm', 'oil_pressure_psi', 'coolant_temp_c', 'vibration_level', 'engine_temp_c']
    
    # Verify new domain features are present dynamically
    missing = [f for f in features if f not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in dataset: {missing}")
        
    logger.info("Engineering target label (Failure: 'Engine' -> 1, Normal/Others -> 0)")
    # Data Engineering requirement: failure_type == 'Engine' maps to 1, everything else to 0
    df['target'] = (df['failure_type'] == 'Engine').astype(int)
    
    label_dist = df['target'].value_counts().to_dict()
    logger.info(f"Target distribution: {label_dist}")
    
    X = df[features].values
    y = df['target'].values
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled, y, scaler, features

def train_isolation_forest(X, save_dir: str):
    """
    Trains the Isolation Forest model on the formatted data.
    """
    logger.info("Training Isolation Forest...")
    # Typically IF is unsupervised, training on all data (or mainly nominal)
    iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    iso_forest.fit(X)
    
    model_path = os.path.join(save_dir, "iso_forest_car_engine.pkl")
    joblib.dump(iso_forest, model_path)
    logger.info(f"Isolation Forest saved to {model_path}")

def train_lstm(X, y, save_dir: str, seq_length: int = 10, epochs: int = 5):
    """
    Trains the new LSTM model on the formatted sequential data.
    """
    logger.info(f"Creating sequences for LSTM (seq_length={seq_length})...")
    # Need to create sequences for both X and y. 
    # The label corresponds to the state at the end of each temporal window.
    X_seq = create_sequences(X.tolist(), seq_length=seq_length)
    
    y_seq = y[seq_length - 1:]
    
    if len(X_seq) != len(y_seq):
        raise ValueError(f"Sequence mismatch: X={len(X_seq)}, y={len(y_seq)}")
        
    X_tensor = torch.tensor(X_seq, dtype=torch.float32)
    y_tensor = torch.tensor(y_seq, dtype=torch.float32).unsqueeze(1)
    
    # Initialize Model with dynamic feature input size
    input_size = X.shape[1]
    model = PredictiveRNN(input_size=input_size, hidden_size=64, num_layers=2)
    criterion = nn.BCELoss()
    # Adding some weight decay for stabilization
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)
    
    logger.info("Training LSTM Model...")
    model.train()
    epoch_losses = []
    for epoch in range(epochs):
        optimizer.zero_grad()
        outputs = model(X_tensor)
        loss = criterion(outputs, y_tensor)
        loss.backward()
        optimizer.step()
        epoch_losses.append(loss.item())
        logger.info(f"Epoch {epoch+1}/{epochs} - Loss: {loss.item():.4f}")
        
    model_path = os.path.join(save_dir, "lstm_car_engine.pt")
    torch.save(model.state_dict(), model_path)
    logger.info(f"LSTM model saved to {model_path}")
    
    # Generate predictions for evaluation
    model.eval()
    with torch.no_grad():
        preds = model(X_tensor).numpy()
        
    return epoch_losses, y_seq, preds

if __name__ == "__main__":
    # Kaggle dataset path assuming it gets downloaded to data/raw
    DATA_PATH = os.path.join("data", "raw", "vehicle_maintenance_telemetry.csv")
    SAVE_DIR = "ml" # Existing folder for ML models
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    try:
        X_scaled, y, scaler, features = build_data_pipeline(DATA_PATH)
        
        # Save scaler for future inference consistency
        scaler_path = os.path.join(SAVE_DIR, "scaler_car_engine.pkl")
        joblib.dump(scaler, scaler_path)
        logger.info(f"Feature scaler saved to {scaler_path}")
        
        # Train Models
        train_isolation_forest(X_scaled, save_dir=SAVE_DIR)
        epoch_losses, y_true, y_preds = train_lstm(X_scaled, y, save_dir=SAVE_DIR)
        
        # MLOps Evaluation Graphs
        logger.info("Generating LSTM Evaluation Reports...")
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        # 1. Training History
        plt.figure(figsize=(10, 6))
        plt.plot(range(1, len(epoch_losses)+1), epoch_losses, marker='o', color='#a855f7')
        plt.title('LSTM Training Loss')
        plt.xlabel('Epoch')
        plt.ylabel('BCELoss')
        plt.grid(True, alpha=0.3)
        plt.savefig(os.path.join(reports_dir, "lstm_training_history.png"))
        plt.close()
        
        # 2. Confusion Matrix
        y_pred_classes = (y_preds > 0.5).astype(int)
        cm = confusion_matrix(y_true, y_pred_classes)
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
        plt.title('LSTM Confusion Matrix')
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        plt.savefig(os.path.join(reports_dir, "lstm_confusion_matrix.png"))
        plt.close()
        
        # 3. ROC Curve
        fpr, tpr, _ = roc_curve(y_true, y_preds)
        roc_auc = auc(fpr, tpr)
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, color='#3b82f6', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('LSTM Receiver Operating Characteristic (ROC)')
        plt.legend(loc="lower right")
        plt.savefig(os.path.join(reports_dir, "lstm_roc_curve.png"))
        plt.close()
        
        # 4. Probability Distribution
        plt.figure(figsize=(10, 6))
        sns.histplot(y_preds, bins=50, kde=True, color='#06b6d4')
        plt.title('LSTM Predicted Probability Distribution')
        plt.xlabel('Predicted Probability of Failure')
        plt.ylabel('Frequency')
        plt.savefig(os.path.join(reports_dir, "lstm_prob_distribution.png"))
        plt.close()
        
        logger.info("Car Engine Case Study training pipeline completed successfully. Reports generated.")
    except Exception as e:
        logger.error(f"Training pipeline failed: {e}")
