# Predictive Maintenance System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Production-009688.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg)

## Project Overview

The Predictive Maintenance System is an enterprise-grade web application designed to simulate Industry 4.0 standards. It provides real-time failure prediction and anomaly detection for industrial machinery. The system utilizes a decoupled microservices architecture, separating the machine learning inference engine (Backend) from the visualization dashboard (Frontend).

Key capabilities include:
1.  **Binary Classification:** Predicting machine failure based on sensor telemetry.
2.  **Anomaly Detection:** Unsupervised learning to detect data drift and outliers.
3.  **Secure Access:** OAuth2 implementation via GitHub for stateless authentication.

## Live Demonstration

* **Frontend (Dashboard):** [https://predictive-maintenance-system-two.vercel.app](https://predictive-maintenance-system-two.vercel.app)
* **Backend (API & Docs):** [https://predictive-maintenance-system-t4n7.onrender.com/docs](https://predictive-maintenance-system-t4n7.onrender.com/docs)

## Technology Stack & Design Decisions

This section details the specific technologies chosen and the rationale behind their selection.

### Backend: Python & FastAPI
* **FastAPI:** Chosen over Flask or Django for its native asynchronous support (`async/await`) and automatic OpenAPI (Swagger) documentation generation. It utilizes Pydantic for data validation, ensuring strict typing for ML model inputs.
* **Scikit-Learn:** Selected for the Machine Learning pipeline due to its efficiency with tabular data. It manages the serialization (`joblib`) and inference of the Random Forest and Isolation Forest models.
* **Authlib:** Handles the OAuth 2.0 handshake complexity, allowing for secure integration with GitHub without managing local user credentials.
* **Uvicorn:** An ASGI web server implementation used to run the FastAPI application, providing high performance and concurrency.

### Frontend: React & Vite
* **React 18:** Utilized for building a component-based UI that updates efficiently in response to real-time API data states.
* **Vite:** Selected as the build tool over Webpack for its significantly faster hot-module replacement (HMR) and optimized production builds.
* **TailwindCSS:** A utility-first CSS framework used to rapidly build a responsive design without the overhead of context-switching between CSS and JSX files.
* **Axios:** Used for HTTP requests to manage interceptors, specifically for attaching JWT tokens to Authorization headers automatically.

### Infrastructure & DevOps
* **Docker:** Ensures environment consistency across development and production by containerizing the application dependencies.
* **Render (Backend Hosting):** Chosen for its native support of Python web services and ability to handle HTTP traffic behind a managed load balancer.
* **Vercel (Frontend Hosting):** Optimized for frontend assets, providing a global CDN and automatic SSL handling.

## System Architecture

The application follows a client-server architecture where the frontend and backend are hosted independently (Cross-Origin).

1.  **Authentication Flow:** The user initiates a login on the React client. They are redirected to GitHub. Upon success, GitHub calls back the Render backend. The backend mints a JWT and returns it to the client via an HTTP-only cookie or response body.
2.  **Inference Flow:** The React client sends JSON payloads containing sensor data (RPM, Torque, Temperature) to the `/predict` endpoint. The backend deserializes the ML models, runs inference, and returns the probability of failure.

## Machine Learning Pipeline

The system employs two distinct models trained on the **AI4I 2020 Predictive Maintenance Dataset**.

### 1. Classification Model (Random Forest)
* **Goal:** Predict machine failure (Binary: 0 or 1).
* **Input Features:**
    * Air Temperature [K]
    * Process Temperature [K]
    * Rotational Speed [rpm]
    * Torque [Nm]
    * Tool Wear [min]
* **Rationale:** Random Forest was chosen for its resistance to overfitting and ability to handle non-linear relationships in sensor data.

### 2. Anomaly Detection (Isolation Forest)
* **Goal:** Detect outliers in the sensor stream that may not yet constitute a "failure" but indicate abnormal behavior.
* **Rationale:** An unsupervised algorithm capable of isolating observations by randomly selecting a feature and then randomly selecting a split value.

## Directory Structure

```text
.
├── backend
│   ├── main.py              # Application entry point & CORS config
│   ├── auth.py              # GitHub OAuth logic & JWT handling
│   ├── models/              # Serialized .pkl ML models
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container instructions
├── frontend
│   ├── src/
│   │   ├── components/      # React UI components
│   │   ├── services/        # API interaction logic (Axios)
│   │   └── App.jsx          # Main routing & layout
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Build configuration
├── docker-compose.yml       # Orchestration for local dev
└── README.md                # Documentation 
```


## Configuration & Environment Variables

The application relies on a strict set of environment variables to manage security contexts, database connections, and cross-origin resource sharing (CORS). These variables isolate sensitive credentials from the codebase, adhering to the Twelve-Factor App methodology.

### Backend Variables
These must be defined in the `.env` file within the `backend/` directory or in the deployment environment (e.g., Render Dashboard).

| Variable | Description | Technical Rationale |
| :--- | :--- | :--- |
| `FRONTEND_URL` | The exact URL of the client application (e.g., `https://your-app.vercel.app` or `http://localhost:5173`). | Used to configure the `Allow-Origin` header in CORS settings, strictly limiting which domains can invoke the API to prevent unauthorized cross-site scripting attacks. |
| `BACKEND_URL` | The public URL of the deployed API (e.g., `https://your-api.onrender.com`). | Required for the OAuth2 callback construction. The authentication provider (GitHub) needs an absolute URL to redirect the user after a successful login. |
| `GITHUB_CLIENT_ID` | The public identifier for the GitHub OAuth application. | Identifies the specific application requesting access to the user's GitHub account during the OAuth handshake. |
| `GITHUB_CLIENT_SECRET` | The private secret for the GitHub OAuth application. | Used by the backend to exchange the temporary authorization code for a persistent access token. |
| `JWT_SECRET_KEY` | A high-entropy alphanumeric string. | Used by the HMAC-SHA256 algorithm to sign JSON Web Tokens (JWT). If this key is leaked, attackers can forge tokens and impersonate users. |

### Frontend Variables
These are built into the React application at compile time (via Vite).

| Variable | Description | Technical Rationale |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | The root URL of the backend API (e.g., `https://your-api.onrender.com`). | Allows the Axios instance to be pre-configured with a base URL, enabling seamless switching between local (`localhost`) and production environments without changing code. |

---

## Installation & Local Development

This project supports two development workflows: a containerized approach using Docker for environment consistency, and a manual approach for faster iteration.

### Prerequisites
* **Python 3.11+**: Required for the latest scikit-learn and FastAPI features.
* **Node.js 18+**: Required for Vite and React 18 concurrency features.
* **Docker Desktop**: (Optional) For containerized execution.

### Option 1: Docker Compose (Recommended)
Docker Compose orchestrates both the frontend and backend services, creating a private internal network where they can communicate. This mimics the production environment and prevents "it works on my machine" issues caused by system dependency mismatches.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/predictive-maintenance-system.git](https://github.com/your-username/predictive-maintenance-system.git)
    cd predictive-maintenance-system
    ```

2.  **Configure Environment:**
    Create a `.env` file in the root directory containing the variables listed in the Configuration section.

3.  **Build and Run:**
    ```bash
    docker-compose up --build
    ```
    * This command builds the Python image (installing dependencies from `requirements.txt`) and the Node image (installing dependencies from `package.json`).
    * The services will bind to `localhost:8000` (Backend) and `localhost:5173` (Frontend).

### Option 2: Manual Setup

#### Backend (FastAPI)
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  **Create Virtual Environment:**
    We use `venv` to create an isolated Python environment, preventing conflicts with global system packages.
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```
3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Start Server:**
    We use `uvicorn` as the ASGI (Asynchronous Server Gateway Interface) server to handle concurrent requests efficiently.
    ```bash
    python -m uvicorn main:app --reload
    ```

#### Frontend (React)
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Start Dev Server:**
    Vite serves the application using native ES modules for millisecond-speed hot module replacement.
    ```bash
    npm run dev
    ```

---

## API Reference

The backend exposes RESTful endpoints documented via OpenAPI 3.0 standards.

### Prediction Endpoint
**POST** `/api/predict`

This endpoint accepts raw sensor telemetry and passes it through the pre-loaded Scikit-Learn pipeline.

* **Request Headers:**
    * `Content-Type: application/json`
    * `Authorization: Bearer <token>` (Required if auth is enabled)

* **Request Body Schema:**
    The input matches the feature set used during model training (AI4I 2020 dataset).
    ```json
    {
      "Air temperature [K]": 298.1,
      "Process temperature [K]": 308.6,
      "Rotational speed [rpm]": 1551,
      "Torque [Nm]": 42.8,
      "Tool wear [min]": 5
    }
    ```

* **Response Schema:**
    Returns the binary classification result and the anomaly detection score.
    ```json
    {
      "prediction": "No Failure",   // or "Failure"
      "confidence": 0.98,           // Probability score from RandomForest
      "is_anomaly": false,          // Boolean from IsolationForest
      "anomaly_score": -0.45        // Raw decision function score
    }
    ```

---

## Security Implementation

The system implements a zero-trust architecture approach suitable for modern microservices.

### 1. OAuth2 Authentication Flow
Instead of storing passwords (which introduces salt/hash management risks), the system delegates authentication to GitHub via OAuth2.
* **Mechanism:** When a user logs in, the backend exchanges the GitHub code for a user profile.
* **Session Management:** The backend issues a signed JWT (JSON Web Token) containing the user's identity. This makes the API **stateless**; the server does not need to query a database to validate a session, improving scalability.

### 2. Proxy Headers Middleware
Since the backend is hosted on Render, it sits behind a Load Balancer / Reverse Proxy (Nginx/AWS ALB).
* **Problem:** The application runs on HTTP internally, but the user connects via HTTPS. Standard redirects would strip the SSL protocol, causing "Mixed Content" errors.
* **Solution:** `ProxyHeadersMiddleware` is configured to trust the `X-Forwarded-Proto` headers sent by the load balancer. This ensures that OAuth redirects correctly point back to `https://` URLs.

### 3. CORS (Cross-Origin Resource Sharing)
Browser security prevents a frontend on Domain A (Vercel) from calling an API on Domain B (Render) by default.
* **Implementation:** The FastAPI `CORSMiddleware` is explicitly configured to allow requests *only* from `FRONTEND_URL`.
* **Credential Support:** `allow_credentials=True` is enabled to allow the browser to send HTTP cookies or Authorization headers across origins, which is required for the JWT authentication flow.

## Deployment Strategy

The system utilizes a continuous deployment (CD) workflow. Commits to the `main` branch trigger automatic builds on Vercel and Render.

### Backend (Render)
The backend is deployed as a Web Service on Render.
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 10000`
* **Rationale:** Render was selected for its native Python support and ability to automatically detect `requirements.txt`. The host is set to `0.0.0.0` to expose the application to the external network within the container.

### Frontend (Vercel)
The frontend is deployed as a static site.
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Rationale:** Vercel automatically detects the Vite configuration. The `dist` folder contains the optimized, minified production assets (JS/CSS) generated by Rollup (Vite's underlying bundler).

---

## Testing & Quality Assurance

To ensure system reliability, the project includes unit and integration tests.

### Backend Tests
Tests are written using `pytest`. They focus on:
1.  **Endpoint Availability:** Ensuring `/health` and `/predict` return 200 OK.
2.  **Model Integrity:** Verifying that the `.pkl` model files can be loaded and perform inference without errors.
3.  **Input Validation:** confirming that the Pydantic schemas correctly reject invalid data types (e.g., strings instead of floats for temperature).

**Running Tests:**
```bash
cd backend
pytest
```


## Acknowledgments

This project was built standing on the shoulders of giants. We explicitly acknowledge the following resources and communities:

* **Dataset Source**: [AI4I 2020 Predictive Maintenance Dataset](https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset) provided by the UCI Machine Learning Repository. This synthetic dataset reflects real-world predictive maintenance scenarios encountered in industry.
* **Open Source Libraries**:
    * **FastAPI & Pydantic**: For providing a modern, high-performance web framework for building APIs with Python.
    * **Scikit-Learn**: For the robust machine learning algorithms and pre-processing pipelines.
    * **React & Vite**: For the frontend ecosystem enabling rapid component-based UI development.
* **Infrastructure**:
    * **Render**: For providing accessible cloud hosting for Python web services.
    * **Vercel**: For their global edge network and ease of deploying frontend applications.
