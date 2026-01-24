# Predictive Maintenance System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Production-009688.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg)
![Docker](https://img.shields.io/badge/docker-compose-2496ED.svg)
![AWS](https://img.shields.io/badge/AWS-EC2-FF9900.svg)

> **Enterprise-grade anomaly detection and failure prediction system, containerized and deployed on AWS.**

---

## 🏗 Runtime Architecture

The system is currently deployed on a single **AWS EC2 (Ubuntu)** instance using **Docker Compose**. It operates as a consolidated monolith where Nginx acts as the unified reverse proxy for both the frontend and backend.

### Traffic Flow
```text
[ Browser ] 
     |
  (HTTP / Port 80)
     |
     v
+---------------- AWS EC2 Instance ----------------+
| [ Nginx Container ]                              |
|   |-- /         --> Serves /usr/share/nginx/html |
|   |                 (React Static Files)         |
|   |-- /api/*    --> Proxies to Backend:8000      |
|                                                  |
| [ Backend Container ]                            |
|   |-- FastAPI (Uvicorn)                          |
|   |-- ML Models (joblib)                         |
|                                                  |
| [ Kafka Container ]                              |
|   |-- Ingests sensor events                      |
+--------------------------------------------------+
```

### Critical Services (Running)

| Container | Image | Role | Status |
| :--- | :--- | :--- | :--- |
| `pm-nginx` | `nginx:alpine` | **Reverse Proxy & Web Server**. Routes traffic. Serves the React SPA (Vite build) and handles client-side routing (`try_files`). | ✅ Active |
| `pm-backend` | `python:3.11-slim` | **API & Inference**. Hosts the FastAPI application. Loads Random Forest & Isolation Forest models into memory at startup. | ✅ Active |
| `kafka` | `cp-kafka:7.4.0` | **Message Broker**. Decouples high-throughput sensor ingestion from processing. | ✅ Active |
| `zookeeper` | `cp-zookeeper:7.4.0` | **Orchestration**. Manages Kafka cluster state. | ✅ Active |

---

## � System State

### Frontend (React + Vite)
-   **Build**: Pre-built static assets (HTML, CSS, JS) generated via `npm run build`.
-   **Serving**: Files are mounted into the Nginx container at `/usr/share/nginx/html`.
-   **API Communication**: Uses relative paths (`/api/predict`) to communicate with the backend, eliminating CORS issues and hardcoded IP dependencies.
-   **Routing**: Single Page Application (SPA) routing is handled by Nginx fallback to `index.html`.

### Backend (FastAPI + ML)
-   **Server**: Running via `Uvicorn` worker processes.
-   **ML Pipeline**:
    -   **Loading**: Models (`scaler.joblib`, `failure_model.joblib`) are loaded once during container startup/initialization.
    -   **Inference**: Real-time synchronous prediction on the `/api/predict` endpoint.
    -   **Error Handling**: Catches and logs deserialization errors, surfacing them clearly in Docker logs.

### Infrastructure (Docker + AWS)
-   **Orchestration**: `docker-compose.yml` defines the entire stack.
-   **Networking**: Services communicate over a private Docker bridge network (`infra_default`). Only Nginx port `80` is exposed to the host/public.
-   **Persistence**: Kafka volumes are configured but treating data as ephemeral for this demo deployment.

### ⚠️ Inactive / Optional Components
The repository contains code for features that are **not currently active** in this specific deployment:
-   **Streaming Consumers**: Separate worker services for scalable data processing are defined but not primary for the sync API flow.
-   **CI/CD**: GitHub Actions workflows exist in `.github` but are not handling the current deployment (manual Docker Compose).
-   **HTTPS/SSL**: The server listens on Port 80 (HTTP). SSL termination is expected to be handled by an upstream Load Balancer (ELB) or requires Certbot configuration.

---

## � API Reference

**POST** `/api/predict`

Used to submit sensor readings for immediate failure analysis.

```json
/* Request */
{
  "udi": "M14860",
  "air_temperature": 298.1,
  "process_temperature": 308.6,
  "rotational_speed": 1551,
  "torque": 42.8,
  "tool_wear": 0
}

/* Response */
{
  "anomaly": false,
  "failure_probability": 0.02,
  "prediction": 0
}
```

---

## 🌟 What This Project Demonstrates

For technical interviewers and reviewers, this project highlights:

1.  **Production-Grade DevOps**: Moving beyond "localhost" by containerizing a full-stack application and solving real-world networking challenges (Reverse Proxy vs. CORS) on cloud infrastructure.
2.  **Full-Stack ML Engineering**: Integrating a trained Scikit-Learn model into a high-performance FastAPI backend and visualizing results in a modern React dashboard.
3.  **Resilient Architecture**: Designing a system where the frontend (Static) and backend (API) are loosely coupled but deployed together for simplicity and performance.
4.  **Debugging & Observability**: Implementing robust logging to catch silent ML failures (e.g., model version mismatches) and verify system health in a headless environment.

---
*Last Updated: 2026-01-24*
