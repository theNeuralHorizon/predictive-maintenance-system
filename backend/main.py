from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from backend.api import routes
from backend.routers import auth
from backend.services.kafka_consumer import consume_loop
from backend.auth.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and Start Kafka consumer
    init_db()
    task = asyncio.create_task(consume_loop())
    yield
    # Shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Predictive Maintenance API",
    description="API for detecting machine anomalies and predicting failures.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api", tags=["Prediction"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Predictive Maintenance System is running"}

from fastapi.responses import PlainTextResponse
from backend.utils.metrics import metrics_collector

@app.get("/metrics", response_class=PlainTextResponse)
def metrics():
    return metrics_collector.generate_latest()

