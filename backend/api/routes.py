from fastapi import APIRouter, HTTPException
from backend.schemas.request import MachineData
from backend.schemas.response import PredictionResponse
from backend.services.ml_service import ml_service

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
async def predict(data: MachineData):
    try:
        result = ml_service.predict(data)
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
