# AWS EC2 Deployment Guide

Follow these steps to deploy the **Predictive Maintenance System** on a fresh AWS EC2 instance.

## 1. Launch EC2 Instance
- **OS**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
- **Instance Type**: t2.micro (Free Tier eligible)
- **Key Pair**: Create a new one (e.g., `predictive-maintenance-key.pem`) and download it.
- **Security Group (Firewall)**:
    - **SSH (22)**: Allow from `My IP` (for security).
    - **HTTP (80)**: Allow from `Anywhere` (`0.0.0.0/0`).
    - **Custom TCP (9092)**: (Optional) Allow if you want to push Kafka events from outside, otherwise keep internal.

## 2. Connect to Instance
Open your terminal (or Putty) and run:
```bash
chmod 400 predictive-maintenance-key.pem
ssh -i "predictive-maintenance-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

## 3. Server Setup (Run these dependencies)
Copy and paste this entire block to install Docker and Git:

```bash
# Update and install dependencies
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# Install Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Setup permissions (so you don't need 'sudo' for docker)
sudo usermod -aG docker $USER
newgrp docker
```

## 4. Deploy Application
```bash
# Clone Repository
git clone https://github.com/theNeuralHorizon/predictive-maintenance-system.git
cd predictive-maintenance-system

# Build and Run
# This will build the backend image and pull Kafka/Zookeeper/Nginx
docker compose -f infra/docker-compose.yml up --build -d
```

## 5. Verification
1.  **Status Check**: `docker compose -f infra/docker-compose.yml ps` (All services should be `Up`).
2.  **Public Access**: Open `http://<YOUR_EC2_PUBLIC_IP>` in your browser. You should see the Backend API response (or 404 Not Found if looking for root, try `http://<IP>/docs` for Swagger UI).
3.  **Logs**: `docker compose -f infra/docker-compose.yml logs -f`

## 6. Troubleshooting
-   **Permission Denied**: Run `newgrp docker` or reboot the instance.
-   **Port Conflict**: Ensure no other service is checking port 80 or 8000.
-   **Container Crashes**: Check logs (`docker logs pm-backend`). Ensure memory isn't full (t2.micro has 1GB RAM). If Kafka crashes, add swap space:
    ```bash
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    ```
