from pydantic import BaseModel

class PredictionResponse(BaseModel):
    anomaly: bool
    failure_probability: float
    prediction: int  # 0 or 1
