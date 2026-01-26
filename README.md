# Predictive Maintenance System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Production-009688.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000.svg)
![Render](https://img.shields.io/badge/Deployed-Render-46E3B7.svg)

> **Enterprise-grade anomaly detection and failure prediction system, featuring a decoupled microservices architecture with GitHub OAuth security.**

---

## 🚀 Live Demo

-   **Frontend (Dashboard)**: [https://predictive-maintenance-system-two.vercel.app](https://predictive-maintenance-system-two.vercel.app)
-   **Backend (API)**: [https://predictive-maintenance-system-t4n7.onrender.com](https://predictive-maintenance-system-t4n7.onrender.com)

---

## 🏗 Architecture

The system operates as a decoupled web application:
-   **Frontend**: React + Vite + TailwindCSS (Hosted on **Vercel**).
-   **Backend**: FastAPI + Scikit-Learn + Authlib (Hosted on **Render**).
-   **Auth**: OAuth2 via **GitHub**.
-   **ML Pipeline**: Real-time inference using Random Forest and Isolation Forest models.

### Traffic Flow
```text
[ User / Phone ]
      |
      v
[ Vercel CDN ] --> Serves React App (Static)
      |
      v
[ Browser ] <-- "Sign in with GitHub"
      |
      v
[ GitHub ] --> Auth Callback --> [ Render Backend ]
                                      |
                                  [ Database / JWT ]
      |
      v
[ Render Backend ] <-- API Requests (`/predict`)
      |
      +-- ML Models (Memory)
```

---

## ⚙️ Configuration & Environment

To run this system, the following Environment Variables are required.

### 1. Backend (Render / Local)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `FRONTEND_URL` | URL of the frontend (for redirects) | `https://your-app.vercel.app` |
| `BACKEND_URL` | (Optional) Force backend URL | `https://your-api.onrender.com` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | `Iv1...` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | `a1b2...` |
| `JWT_SECRET_KEY` | Secret for signing tokens | `supersecret` |

### 2. Frontend (Vercel / Local)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL of the Backend API | `https://your-api.onrender.com/api` |

---

## 🛠 Local Development via Docker

You can run the entire stack locally using Docker Compose, or run services individually.

### Prerequisites
-   Docker & Docker Compose
-   GitHub OAuth App (callback: `http://localhost:8000/api/auth/callback/github`)

### Quick Start
1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/your-username/predictive-maintenance-system.git
    cd predictive-maintenance-system
    ```

2.  **Setup Env**:
    Create `.env` in the root:
    ```ini
    GITHUB_CLIENT_ID=...
    GITHUB_CLIENT_SECRET=...
    JWT_SECRET_KEY=dev_secret
    FRONTEND_URL=http://localhost:5173
    ```

3.  **Run Backend**:
    ```bash
    python -m uvicorn backend.main:app --reload
    ```

4.  **Run Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---

## 🧠 ML Model Details

-   **Input**: Air Temperature, Process Temperature, RPM, Torque, Tool Wear.
-   **Anomaly Detection**: `IsolationForest` identifies outliers/drift.
-   **Failure Prediction**: `RandomForestClassifier` predicts machine failure (binary).
-   **Training Data**: AI4I 2020 Predictive Maintenance Dataset.

---

## 🔒 Security

-   **Authentication**: No passwords stored. Pure OAuth2 flow.
-   **Sessions**: HTTP-only Cookies (Local) / Bearer Tokens (API).
-   **Protection**: `ProxyHeadersMiddleware` ensures valid HTTPS handshakes behind Load Balancers (like Render/Vercel).
-   **CORS**: Strictly typed to allow only the Vercel Frontend.

---
*Maintained by SteelPulse Team.*
