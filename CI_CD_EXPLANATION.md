# CI/CD Pipeline Design

## Pipeline Overview
The pipeline is designed using **GitHub Actions** to enforce code quality and build integrity on every push to the `main` branch. This approach ensures that no broken code or invalid Docker configurations reach the repository, maintaining a "deploy-ready" state.

## Workflow Steps (`.github/workflows/ci.yml`)

1.  **Trigger**:
    *   `on: push`: Runs automatically when code is pushed to `main`.
    *   `on: pull_request`: Runs on PRs targeting `main` to validate changes before merge.

2.  **Environment Setup**:
    *   Uses `ubuntu-latest` runner for a standard Linux environment.
    *   Sets up Python 3.11 matching the backend requirements.

3.  **Dependency Installation**:
    *   Installs `flake8` (linting) and `pytest` (testing).
    *   Installs project dependencies from `requirements.txt`.

4.  **Code Quality (Linting)**:
    *   Runs `flake8`.
    *   **Goal**: Catch syntax errors, undefined variables, and style violations early.
    *   *Exit-zero strategy for complexity*: We currently warn on high complexity but error on syntax issues.

5.  **Automated Testing**:
    *   Runs `pytest tests/`.
    *   **Goal**: Verify logic correctness. Specifically sets `PYTHONPATH=.` to ensure the module resolution works inside the CI environment.

6.  **Build Validation**:
    *   `docker build ...`
    *   **Goal**: Verify that the `Dockerfile.backend` is valid and the image builds successfully. This catches dependency conflicts or missing files that would break production deployment.

## Future Cloud Deployment Strategy
This pipeline handles the **Continuous Integration (CI)** part. To extend for **Continuous Deployment (CD)** to AWS EC2 or similar:

1.  **Artifact Push**: Add a step to push the built Docker image to a registry (Docker Hub or AWS ECR).
2.  **Deploy Job**: Add a `deploy` job using `appleboy/ssh-action` to:
    *   SSH into the EC2 instance.
    *   Run `docker pull <new-image>`.
    *   Run `docker compose up -d` to restart services with the new image.
    *   This job would depend on the `build` job succeeding (`needs: build`).

## Resume Description
**Automated CI/CD Pipeline Engineer**
Designed and implemented a GitHub Actions pipeline for a Python/FastAPI microservice.
*   **Quality Assurance**: Enforced code quality via automated `flake8` linting and `pytest` execution, blocking invalid commits.
*   **Build Integrity**: Integrated Docker build checks to validate container configuration on every push, eliminating deployment-time failures.
*   **Architecture**: Structured the pipeline for future extensibility, enabling zero-downtime deployments via SSH-based container orchestration.
