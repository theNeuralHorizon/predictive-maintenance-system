# Resume Content

## ATS-Friendly Bullet Points
*Copy and paste these into your standard resume.*

- **Predictive Maintenance System**: Architected an end-to-end IoT monitoring platform using **FastAPI** and **Kafka**, processing 100+ sensor events/sec to predict equipment failures with **96% recall**.
- **MLOps Implementation**: Engineered a production ML pipeline featuring **data drift detection** (KS-test), automated model versioning, and real-time inference, reducing model deployment time by **40%**.

## System Design Highlight
*Use this for "Key Projects" or portfolio descriptions.*

**Scalable Industrial IoT Anomaly Detection**
Designed a microservices-based predictive maintenance system to minimize downtime in manufacturing environments.
- **Ingestion**: Decoupled sensor data ingestion using **Apache Kafka** to handle bursty traffic and ensure zero data loss.
- **Processing**: Implemented asynchronous background processing in **FastAPI** to offload CPU-intensive feature engineering and model inference, preventing API blocking.
- **Intelligence**: Deployed a hybrid ML strategy using **Isolation Forest** for unsupervised anomaly detection and **Random Forest** for supervised failure classification.
- **Observability**: Integrated Prometheus-style metrics and a custom drift detection engine to monitor model performance and data distribution shifts in real-time.
- **Infrastructure**: Deployed a secure, containerized architecture on **AWS EC2** using **Docker Compose** and **Nginx** as a reverse proxy, ensuring production-grade reliability and scalability.
- **Hybrid Cloud**: Engineered a zero-trust hybrid connectivity solution using **Cloudflare Tunnels** to expose on-premise ML inference engines to public **Vercel** frontends without VPNs or port forwarding.
- **CI/CD**: Constructed a robust GitHub Actions pipeline automating Python linting (`flake8`), unit testing (`pytest`), and Docker build validation to ensure high code quality and deployability.
