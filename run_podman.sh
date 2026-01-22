#!/bin/bash
set -e

# Build the image
echo "Building image..."
podman build -t predictive-maintenance-backend -f infra/Dockerfile.backend .

# Run the container
echo "Starting container on port 8000..."
podman run --rm -p 8000:8000 --name pm-backend predictive-maintenance-backend
