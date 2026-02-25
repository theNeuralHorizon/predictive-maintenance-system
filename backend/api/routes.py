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
from fastapi.responses import StreamingResponse
from backend.utils.sensor_simulator import SensorSimulator

logger = setup_logger(__name__)
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize RNN Model
rnn_model = PredictiveRNN(input_size=5)
rnn_model.eval()

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
def predict_sequence(data: SequencePredictionRequest, user: Annotated[dict, Depends(get_current_user)]):
    """
    Predict anomaly based on a sequential window of telemtry data using the RNN Engine.
    """
    logger.info("Received sequence prediction request", extra={"user": user['sub'], "seq_length": len(data.sequence)})
    try:
        # Convert List[MachineData] to 2D list of features
        raw_data = []
        for d in data.sequence:
            raw_data.append([
                d.air_temperature,
                d.process_temperature,
                d.rotational_speed,
                d.torque,
                d.tool_wear
            ])
        
        # We need a sequence length of 10 if possible
        seq_length = min(10, len(raw_data))
        sequences = create_sequences(raw_data, seq_length=seq_length)
        
        if len(sequences) == 0:
            raise ValueError("Insufficient data to create sequence")

        # Predict on the latest sequence window
        last_seq = sequences[-1]
        
        # Convert to tensor: shape (1, seq_length, num_features)
        tensor_data = torch.tensor(last_seq, dtype=torch.float32).unsqueeze(0)
        
        with torch.no_grad():
            output = rnn_model(tensor_data)
            prob = output.item()
        
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
