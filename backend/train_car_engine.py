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

def train_lstm(X, y, save_dir: str, seq_length: int = 10, epochs: int = 100):
    """
    Trains the LSTM model with manual class weighting and train/val split.
    Uses standard forward() (with sigmoid) + BCELoss for consistency.
    """
    logger.info(f"Creating sequences for LSTM (seq_length={seq_length})...")
    X_seq = create_sequences(X.tolist(), seq_length=seq_length)
    y_seq = y[seq_length - 1:]
    
    if len(X_seq) != len(y_seq):
        raise ValueError(f"Sequence mismatch: X={len(X_seq)}, y={len(y_seq)}")
    
    # Train/Val split (80/20)
    split_idx = int(len(X_seq) * 0.8)
    X_train, X_val = X_seq[:split_idx], X_seq[split_idx:]
    y_train, y_val = y_seq[:split_idx], y_seq[split_idx:]
    
    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
    X_val_t = torch.tensor(X_val, dtype=torch.float32)
    y_val_t = torch.tensor(y_val, dtype=torch.float32).unsqueeze(1)
    
    # Compute manual class weights for BCELoss — CAPPED at 10x to prevent collapse
    n_pos = y_train.sum()
    n_neg = len(y_train) - n_pos
    w_pos = min(n_neg / max(n_pos, 1), 10.0)  # Cap at 10x
    w_neg = 1.0
    logger.info(f"Class weighting: w_pos={w_pos:.2f}, w_neg={w_neg:.2f} (neg={n_neg}, pos={n_pos})")
    
    # Build per-sample weight tensor for training set
    sample_weights_train = torch.where(y_train_t == 1, w_pos, w_neg)
    sample_weights_val = torch.where(y_val_t == 1, w_pos, w_neg)
    
    input_size = X.shape[1]
    model = PredictiveRNN(input_size=input_size, hidden_size=64, num_layers=2)
    criterion = nn.BCELoss(reduction='none')  # no reduction so we can apply manual weights
    optimizer = optim.Adam(model.parameters(), lr=0.003, weight_decay=1e-5)  # Higher LR
    
    logger.info(f"Training LSTM Model for {epochs} epochs...")
    model.train()
    train_losses = []
    val_losses = []
    
    for epoch in range(epochs):
        optimizer.zero_grad()
        outputs = model(X_train_t)  # forward() with sigmoid
        raw_loss = criterion(outputs, y_train_t)
        weighted_loss = (raw_loss * sample_weights_train).mean()
        weighted_loss.backward()
        optimizer.step()
        train_losses.append(weighted_loss.item())
        
        # Validation loss
        model.eval()
        with torch.no_grad():
            val_out = model(X_val_t)
            val_raw = criterion(val_out, y_val_t)
            val_weighted = (val_raw * sample_weights_val).mean()
            val_losses.append(val_weighted.item())
        model.train()
        
        if (epoch + 1) % 10 == 0:
            logger.info(f"Epoch {epoch+1}/{epochs} - Train Loss: {weighted_loss.item():.4f} | Val Loss: {val_weighted.item():.4f}")
    
    model_path = os.path.join(save_dir, "lstm_car_engine.pt")
    torch.save(model.state_dict(), model_path)
    logger.info(f"LSTM model saved to {model_path}")
    
    # Generate predictions for evaluation using forward() with sigmoid
    model.eval()
    X_all_t = torch.tensor(X_seq, dtype=torch.float32)
    with torch.no_grad():
        preds = model(X_all_t).numpy()
        
    return train_losses, val_losses, y_seq, preds

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
        train_losses, val_losses, y_true, y_preds = train_lstm(X_scaled, y, save_dir=SAVE_DIR)
        
        # MLOps Evaluation Graphs
        logger.info("Generating LSTM Evaluation Reports...")
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        # 1. Training History (Train vs Val Loss)
        plt.figure(figsize=(10, 6))
        epochs_range = range(1, len(train_losses)+1)
        plt.plot(epochs_range, train_losses, marker='o', color='#a855f7', label='Train Loss', markersize=3)
        plt.plot(epochs_range, val_losses, marker='s', color='#3b82f6', label='Val Loss', markersize=3)
        plt.title('LSTM Training History')
        plt.xlabel('Epoch')
        plt.ylabel('BCEWithLogitsLoss')
        plt.legend()
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
