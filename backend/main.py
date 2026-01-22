from fastapi import FastAPI
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

app.include_router(routes.router, prefix="/api", tags=["Prediction"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Predictive Maintenance System is running"}
