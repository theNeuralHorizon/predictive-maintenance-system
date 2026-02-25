import torch
import torch.nn as nn
import numpy as np
import logging

# Configure basic standard logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
# If no handler is present, add a basic stream handler
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)

class PredictiveRNN(nn.Module):
    """
    Lightweight LSTM architecture for binary classification (Failure / No Failure).
    Captures sequential dependencies in the telemetry data.
    """
    def __init__(self, input_size=5, hidden_size=64, num_layers=2, num_classes=1):
        super(PredictiveRNN, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        # batch_first=True -> (batch_size, seq_length, input_size)
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, num_classes)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # Initialize hidden state and cell state
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = self.fc(out[:, -1, :])
        out = self.sigmoid(out)
        return out

def create_sequences(data: list[list[float]], seq_length: int = 10):
    """
    Takes a 2D array or list of tabular data (samples x features) and creates 
    sliding temporal windows of size seq_length.
    
    Returns:
        np.ndarray of shape (num_samples - seq_length + 1, seq_length, num_features)
    """
    if len(data) < seq_length:
        logger.warning(f"Data length {len(data)} is shorter than sequence length {seq_length}. Using entire data as one sequence.")
        seq_length = len(data)
        if seq_length == 0:
            return np.array([])
    
    sequences = []
    for i in range(len(data) - seq_length + 1):
        seq = data[i:i + seq_length]
        sequences.append(seq)
    
    return np.array(sequences)
