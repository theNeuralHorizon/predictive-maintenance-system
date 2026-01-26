# Predictive Maintenance System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Production-009688.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg)

## Executive Summary

The Predictive Maintenance System is an enterprise-grade anomaly detection and failure prediction platform. It leverages machine learning to analyze real-time sensor telemetry, identifying potential equipment failures before they occur. The system is architected as a decoupled full-stack application, ensuring scalability, security through OAuth2 authentication, and seamless deployment across modern cloud infrastructure.

## System Architecture

The application adopts a decoupled microservices pattern, separating the user interface from the logic and inference layers. This design allows for independent scaling and maintenance of each component.

### Components

1.  **Frontend (Presentation Layer)**
    *   **Framework**: React 18 with Vite.
    *   **Styling**: TailwindCSS for responsive, component-driven design.
    *   **Hosting**: Deployed on Vercel's global edge network.
    *   **Responsibility**: manages user session state, visualizes sensor data, and communicates with the backend via RESTful APIs.

2.  **Backend (Logic & Inference Layer)**
    *   **Framework**: FastAPI (Python).
    *   **Hosting**: Deployed on Render as a web service.
    *   **Machine Learning**: Scikit-Learn (Random Forest & Isolation Forest).
    *   **Responsibility**: Handles OAuth2 handshakes, verifies JWT tokens, validates input schemas (Pydantic), and executes model inference.

3.  **Authentication & Security**
    *   **Protocol**: OAuth2 Authorization Code flow.
    *   **Provider**: GitHub.
    *   **Mechanism**: Stateless JWT (JSON Web Tokens) for API authorization. HttpOnly cookies are used during the handshake process to prevent CSRF attacks.

## Live Deployment

The system is currently live and accessible at the following endpoints:

*   **Frontend Dashboard**: https://predictive-maintenance-system-two.vercel.app
*   **Backend API**: https://predictive-maintenance-system-t4n7.onrender.com

---

## Configuration

The application requires specific environment variables to function in both development and production environments.

### Backend Configuration
These variables must be set in the Render environment or your local `.env` file.

| Variable | Description |
| :--- | :--- |
| `FRONTEND_URL` | The URL of the frontend application. Used for OAuth redirects. |
| `BACKEND_URL` | (Optional) Explicit URL of the backend. Useful for overriding proxy detection. |
| `GITHUB_CLIENT_ID` | The Client ID provided by your GitHub OAuth App. |
| `GITHUB_CLIENT_SECRET` | The Client Secret provided by your GitHub OAuth App. |
| `JWT_SECRET_KEY` | A strong, random string used to sign and verify JSON Web Tokens. |

### Frontend Configuration
These variables must be set in the Vercel project settings or local `.env` file.

| Variable | Description |
| :--- | :--- |
| `VITE_API_BASE_URL` | The absolute URL of the backend API (e.g., `https://.../api`). |

---

## Installation and Local Development

For local development, it is recommended to run the services using the provided Docker configuration or Python virtual environments.

### Prerequisites
*   Python 3.11+
*   Node.js 18+
*   Docker & Docker Compose (Optional)

### Running with Docker (Recommended)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/predictive-maintenance-system.git
    cd predictive-maintenance-system
    ```

2.  **Configure Environment**
    Create a `.env` file in the root directory containing the variables listed in the configuration section above.

3.  **Start Services**
    ```bash
    docker-compose up --build
    ```
    The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:8000`.

### Manual Installation

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Machine Learning Pipeline

The system utilizes a pre-trained pipeline for predictive analysis:

*   **Data Preprocessing**: Input telemetry (Air Temperature, Process Temperature, Torque, RPM, Tool Wear) is standardized using a `StandardScaler`.
*   **Feature Engineering**: Rolling averages and deltas are calculated to capture temporal patterns in the sensor data.
*   **Model 1: Anomaly Detection**: An `IsolationForest` model identifies outliers in the data stream that deviate from normal operating conditions.
*   **Model 2: Failure Classification**: A `RandomForestClassifier` predicts the probability of machine failure based on the processed features.

## License

This project is licensed under the MIT License.
