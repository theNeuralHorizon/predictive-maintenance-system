# Predictive Maintenance System

A production-grade predictive maintenance system using Python, FastAPI, and Scikit-Learn.

## Architecture

- **Backend**: FastAPI
- **ML Engine**: Scikit-Learn (Random Forest, Isolation Forest)
- **Data**: AI4I 2020 Predictive Maintenance Dataset

## Prerequisites

- Python 3.8+
- Virtual Environment

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   # OR
   pip install fastapi uvicorn pandas scikit-learn joblib requests pydantic numpy
   ```

## Training

Train the models using the module command:

```bash
python -m ml.train
```

Artifacts (models/scalers) will be saved in `ml/artifacts/`.

## Running the API

Start the server:

```bash
uvicorn backend.main:app --reload
```

[Previous content]

## Docker Support

Build and run the containerized application:

```bash
docker compose -f infra/docker-compose.yml build
docker compose -f infra/docker-compose.yml up
```

(Note: If using Podman, replace `docker` with `podman` and `docker compose` with `podman-compose` or `podman build/run` commands).

## API Usage


**Endpoint**: `POST /api/predict`

**Payload**:
```json
{
  "Air temperature [K]": 300.1,
  "Process temperature [K]": 310.5,
  "Rotational speed [rpm]": 1600,
  "Torque [Nm]": 40.5,
  "Tool wear [min]": 120
}
```
