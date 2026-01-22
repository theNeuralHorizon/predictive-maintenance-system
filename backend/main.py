from fastapi import FastAPI
from backend.api import routes

app = FastAPI(
    title="Predictive Maintenance API",
    description="API for detecting machine anomalies and predicting failures.",
    version="1.0.0"
)

app.include_router(routes.router, prefix="/api", tags=["Prediction"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Predictive Maintenance System is running"}
