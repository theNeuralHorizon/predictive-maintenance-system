from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from backend.api import routes
from backend.services.kafka_consumer import consume_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start Kafka consumer background task
    task = asyncio.create_task(consume_loop())
    yield
    # Shutdown: Cancel task (consumer handles its own cleanup via finally block)
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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api", tags=["Prediction"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Predictive Maintenance System is running"}

from fastapi.responses import PlainTextResponse
from backend.utils.metrics import metrics_collector

@app.get("/metrics", response_class=PlainTextResponse)
def metrics():
    return metrics_collector.generate_latest()
