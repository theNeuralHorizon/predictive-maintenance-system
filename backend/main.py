from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import asyncio
from backend.api import routes
from backend.routers import auth
from backend.auth.database import init_db
from backend.auth.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    # task = asyncio.create_task(consume_loop()) -> Removed Kafka
    yield
    # Shutdown
    # task.cancel()
    # try:
    #     await task
    # except asyncio.CancelledError:
    #     pass

app = FastAPI(
    title="Predictive Maintenance API",
    description="API for detecting machine anomalies and predicting failures.",
    version="1.0.0",
    lifespan=lifespan
)

# Session Middleware required for Authlib
# https_only=False is critical for localhost development to allow cookies over HTTP
app.add_middleware(SessionMiddleware, secret_key=settings.JWT_SECRET_KEY, https_only=False, same_site="lax")

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

