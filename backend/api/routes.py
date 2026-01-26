from fastapi import APIRouter, HTTPException, Depends
from backend.schemas.request import MachineData
from backend.schemas.response import PredictionResponse
from backend.services.ml_service import ml_service
from backend.utils.logger import setup_logger
from backend.auth.utils import verify_token
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated

logger = setup_logger(__name__)
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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
