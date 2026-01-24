# Predictive Maintenance System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Production-009688.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg)
![Docker](https://img.shields.io/badge/docker-compose-2496ED.svg)
![AWS](https://img.shields.io/badge/AWS-EC2-FF9900.svg)

> **Enterprise-grade anomaly detection and failure prediction system, containerized and deployed on AWS.**

---

## 📋 Executive Summary
This full-stack machine learning application processes high-frequency sensor data (Temperature, RPM, Torque) to detect anomalies and predict equipment failure in real-time. By leveraging **unsupervised learning (Isolation Forest)** for novelty detection and **supervised learning (Random Forest)** for failure classification, it provides actionable insights to reduce unplanned downtime.

The system is designed for **production environments**, featuring a decoupled architecture served from a unified entry point using Nginx as a reverse proxy.

---

## 💼 Business Value
Unplanned equipment downtime costs global manufacturers an estimated **$50 billion annually**. This solution addresses this critical inefficiency by:
- **Reducing Unplanned Downtime**: Predicting failures *before* they occur allows for scheduled maintenance windows.
- **Optimizing Asset Life**: Identifying abnormal operating conditions (drift) extends machinery lifespan.
- **Operational Efficiency**: Real-time dashboards provide instant visibility into fleet health, replacing reactive fire-fighting with proactive monitoring.

---

## 🏗 System Architecture

The system is deployed on a single **AWS EC2** instance using **Docker Compose**. It follows a microservices-based pattern where **Nginx** acts as the central reverse proxy and web server, routing traffic to the appropriate container.

```text
[ Internet / User's Browser ]
          |
       (HTTP / 80)
          |
          v
+-------------------------------------------------------+
|  AWS EC2 Instance                                     |
|                                                       |
|  [ Nginx Container (Reverse Proxy) ]                  |
|     |                     |                           |
|     | (/)                 | (/api/*)                  |
|     v                     v                           |
|  [ Static Files ]      [ FastAPI Backend ]            |
|  (React Build)            |                           |
|                           +---> [ ML Models ]         |
|                                 (sklearn / joblib)    |
|                                                       |
+-------------------------------------------------------+
```

### Key Architectural Decisions
*   **Unified Entry Point**: Nginx serves both the React frontend (static assets) and proxies API requests, strictly adhering to **Single Origin Policy** and eliminating CORS complexity in production.
*   **Containerized Isolation**: Each service (Nginx, Backend, Zookeeper, Kafka) runs in its own Docker container, ensuring environment consistency and easy scaling.
*   **Data Locality**: Frontend assets and ML inference logic reside on the same host, minimizing latency.

---

## 🚀 Live Deployment

The system is live and accessible at:

**[http://<YOUR_EC2_PUBLIC_IP>](http://<YOUR_EC2_PUBLIC_IP>)**

*(Replace with your actual IP or Domain)*

---

## 🔌 API Usage

The backend exposes a RESTful API for real-time inference.

### Prediction Endpoint
**POST** `/api/predict`

**Request Body:**
```json
{
  "udi": "M14860",
  "air_temperature": 298.1,
  "process_temperature": 308.6,
  "rotational_speed": 1551,
  "torque": 42.8,
  "tool_wear": 0
}
```

**Response:**
```json
{
  "anomaly": false,
  "failure_probability": 0.02,
  "prediction": 0
}
```

---

## 🐳 Docker Services

The `docker-compose.yml` orchestrates the following production services:

| Service | Container Name | Port (Internal) | Description |
| :--- | :--- | :--- | :--- |
| **Nginx** | `pm-nginx` | 80 | **[Public Entry]** Serves React SPA & Reverse Proxies API. |
| **Backend** | `pm-backend` | 8000 | FastAPI application hosting ML models & business logic. |
| **Kafka** | `kafka` | 9092 | Event streaming for sensor data ingestion. |
| **Zookeeper** | `zookeeper` | 2181 | Coordination service for Kafka. |

---

## 📂 Project Structure

```text
.
├── backend/                # FastAPI Application
│   ├── api/                # API Routes & Endpoints
│   ├── services/           # ML Inference & Business Logic
│   └── main.py             # Application Entry Point
├── frontend/               # React Application (Vite)
│   ├── src/                # Components & Hooks
│   ├── dist/               # Production Build Artifacts (Served by Nginx)
│   └── vite.config.js      # Build Configuration
├── infra/                  # Infrastructure as Code
│   ├── docker-compose.yml  # Container Orchestration
│   ├── nginx.conf          # Reverse Proxy Configuration
│   └── Dockerfile.backend  # Backend Image Definition
├── ml/                     # Machine Learning Core
│   ├── artifacts/          # Serialized Models (v1/)
│   └── feature_engineering # Data Transformation Pipelines
└── data/                   # Raw & Processed Datasets
```

---

## 🛠 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Recharts |
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **Machine Learning** | Scikit-Learn (RandomForest, IsolationForest), Pandas, Joblib |
| **Infrastructure** | Docker, Docker Compose, Nginx, AWS EC2 |
| **Streaming** | Apache Kafka, Zookeeper |

---

## 🌟 Resume / Interview Highlights

This project demonstrates proficiency in **Full-Stack ML Engineering** and **DevOps**:

*   **End-to-End deployment**: Architected and deployed a complete predictive maintenance system from raw data to a live, containerized web application on AWS.
*   **Production-Ready Networking**: Configured Nginx as a reverse proxy to unify frontend and backend, handling static content delivery and API routing efficiently constantly.
*   **ML Ops & Error Handling**: Implemented robust error handling for ML model loading and inference, ensuring system reliability and observability in production logs.
*   **Container Orchestration**: Utilized Docker Compose to manage multi-container dependencies (Kafka, Zookeeper, API, Web Server) with persistent volumes and health checks.
*   **Real-World Constraints**: Solved deployment challenges (no external build tools, strictly local assets) by effectively managing build artifacts and volume mounts.
