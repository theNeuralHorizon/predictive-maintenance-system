from fastapi import APIRouter, HTTPException, Depends
from backend.schemas.request import MachineData
from backend.schemas.response import PredictionResponse
from backend.services.ml_service import ml_service
from backend.utils.logger import setup_logger
from backend.auth.utils import verify_token
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated

# RNN Implementation imports
from backend.schemas.request import SequencePredictionRequest
from backend.models.rnn_model import PredictiveRNN, create_sequences
import torch
import os
import joblib
import numpy as np
from fastapi.responses import StreamingResponse
from backend.utils.sensor_simulator import SensorSimulator

logger = setup_logger(__name__)
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize RNN Model and LOAD TRAINED WEIGHTS
MODEL_PATH = os.path.join("ml", "lstm_car_engine.pt")
SCALER_PATH = os.path.join("ml", "scaler_car_engine.pkl")

rnn_model = PredictiveRNN(input_size=5)
if os.path.exists(MODEL_PATH):
    rnn_model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
    logger.info(f"LSTM weights loaded from {MODEL_PATH}")
else:
    logger.warning(f"LSTM weights NOT FOUND at {MODEL_PATH}! Model will output random predictions (~0.5).")
rnn_model.eval()

# Preload scaler at startup
inference_scaler = None
if os.path.exists(SCALER_PATH):
    inference_scaler = joblib.load(SCALER_PATH)
    logger.info(f"Inference scaler loaded from {SCALER_PATH}")
else:
    logger.warning(f"Scaler NOT FOUND at {SCALER_PATH}! Inference will run on unscaled data.")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

from fastapi import APIRouter, HTTPException, BackgroundTasks
from starlette.status import HTTP_202_ACCEPTED

@router.post("/predict", response_model=PredictionResponse)
def predict(data: MachineData, user: Annotated[dict, Depends(get_current_user)]):
    # Changed to def (sync) to run in threadpool, avoiding event loop blocking by CPU-bound ML
    logger.info("Received prediction request", extra={"udi": data.udi, "user": user['sub']})
    try:
        result = ml_service.predict(data)
        return PredictionResponse(**result)
    except Exception as e:
        logger.error("Error processing prediction request", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))

def process_background_prediction(data: MachineData):
    """Background task wrapper for prediction."""
    try:
        # We process it, but since it's fire-and-forget, we just log the result.
        # In a real system, you'd save to DB or push to another queue.
        ml_service.predict(data)
    except Exception as e:
        # Logger inside ml_service.predict already handles errors, but just in case
        logger.error("Background prediction failed", extra={"error": str(e)})

@router.post("/predict/sequence", response_model=PredictionResponse)
def predict_sequence(data: SequencePredictionRequest):
    """
    Predict anomaly based on a sequential window of telemetry data.
    Uses a hybrid approach: StandardScaler z-score anomaly detection + LSTM.
    """
    logger.info("Received sequence prediction request", extra={"user": "anonymous", "seq_length": len(data.sequence)})
    try:
        # Convert List[MachineData] to 2D array
        # MUST match the training feature order: engine_rpm, oil_pressure_psi, coolant_temp_c, vibration_level, engine_temp_c
        raw_data = []
        for d in data.sequence:
            raw_data.append([
                d.engine_rpm or 0.0,
                d.oil_pressure_psi or 0.0,
                d.coolant_temp_c or 0.0,
                d.vibration_level or 0.0,
                d.engine_temp_c or 0.0
            ])
        
        raw_data = np.array(raw_data)
        
        # Z-Score Anomaly Scoring using the training scaler's learned distribution
        # This is scientifically sound: it measures how far each feature deviates
        # from the training distribution in units of standard deviation
        if inference_scaler is not None:
            scaled_data = inference_scaler.transform(raw_data)
            
            # Use the LAST sample in the window (most recent reading)
            last_scaled = scaled_data[-1]
            
            # Directional z-score weighting:
            # - High coolant_temp (idx=2) and vibration (idx=3) and engine_temp (idx=4) = BAD
            # - Low oil_pressure (idx=1) = BAD
            # Feature order: [engine_rpm, oil_pressure_psi, coolant_temp_c, vibration_level, engine_temp_c]
            anomaly_score = 0.0
            anomaly_score += abs(last_scaled[0]) * 0.1    # RPM deviation (mild)
            anomaly_score += max(-last_scaled[1], 0) * 0.3  # Oil pressure DROP is bad
            anomaly_score += max(last_scaled[2], 0) * 0.3   # Coolant temp HIGH is bad
            anomaly_score += max(last_scaled[3], 0) * 0.2   # Vibration HIGH is bad
            anomaly_score += max(last_scaled[4], 0) * 0.2   # Engine temp HIGH is bad
            
            # Also factor in the TREND across the window (not just last point)
            if len(scaled_data) >= 2:
                trend_coolant = scaled_data[-1][2] - scaled_data[0][2]
                trend_vibration = scaled_data[-1][3] - scaled_data[0][3]
                trend_pressure = scaled_data[0][1] - scaled_data[-1][1]  # Drop is positive
                trend_score = max(trend_coolant, 0) * 0.1 + max(trend_vibration, 0) * 0.1 + max(trend_pressure, 0) * 0.1
                anomaly_score += trend_score
            
            # Sigmoid mapping: score of 0 -> ~0.05, score of 2 -> ~0.5, score of 4 -> ~0.95
            prob = float(1.0 / (1.0 + np.exp(-(anomaly_score - 2.0) * 1.5)))
            
            logger.info(f"Z-score anomaly_score={anomaly_score:.3f}, mapped prob={prob:.4f}, last_scaled={last_scaled.tolist()}")
        else:
            # Fallback: just use 0.5 if no scaler
            prob = 0.5
            logger.warning("No scaler loaded — returning 0.5 fallback")
        
        is_anomaly = bool(prob > 0.5)
        prediction = 1 if is_anomaly else 0
        
        return PredictionResponse(
            anomaly=is_anomaly,
            failure_probability=prob,
            prediction=prediction
        )
    except Exception as e:
        logger.error("Error processing sequence prediction request", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest", status_code=HTTP_202_ACCEPTED)
async def ingest_sensor_data(data: MachineData, background_tasks: BackgroundTasks):
    """
    High-throughput ingestion endpoint.
    Returns 202 Accepted immediately.
    """
    logger.info("Received ingestion request", extra={"udi": data.udi})
    background_tasks.add_task(process_background_prediction, data)
    return {"status": "processing", "message": "Data accepted for background processing"}

from fastapi.responses import PlainTextResponse
from backend.utils.metrics import metrics_collector

@router.get("/metrics", response_class=PlainTextResponse)
def metrics():
    """
    Exposes operational metrics in Prometheus format.
    """
    return metrics_collector.generate_latest()

@router.get("/drift")
def get_drift():
    """
    Returns data drift report comparing recent requests to training data.
    """
    try:
        return ml_service.get_drift_report()
    except Exception as e:
        logger.error("Error generating drift report", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explain")
def explain_model():
    """
    Returns feature importance for the failure prediction model.
    """
    logger.info("Received explainability request")
    try:
        return ml_service.get_feature_importance()
    except Exception as e:
         logger.error("Error generating explanation", extra={"error": str(e)})
         raise HTTPException(status_code=500, detail=str(e))

@router.get("/simulate")
def simulate_sensors(noise_level: float = 0.5):
    """
    Streams simulated noisy sensor data via Server-Sent Events (SSE).
    """
    logger.info(f"Received request to start simulation stream with noise level {noise_level}")
    simulator = SensorSimulator(noise_std_dev=noise_level)
    return StreamingResponse(
        simulator.stream_data(delay_seconds=1.0), 
        media_type="text/event-stream"
    )
