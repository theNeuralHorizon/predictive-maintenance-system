# Zero-Cost Hybrid Cloud Deployment Guide

This guide explains how to deploy the **Predictive Maintenance System** for free using a hybrid architecture:
- **Backend**: Runs on your local machine (Docker), exposed securely via **Cloudflare Tunnel**.
- **Frontend**: Hosted on **Vercel**, connecting to your secure backend tunnel.

---

## Part 1: Expose Backend (Cloudflare Tunnel)

We will use `cloudflared` to create a secure tunnel. No port forwarding required.

### 1. Install Cloudflare Tunnel (Linux)
```bash
# Download and install cloudflared
curl -L --output cloudflared.rpm https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
sudo rpm -ivh cloudflared.rpm
```

### 2. Manual Start (Testing)
```bash
# Start a quick tunnel (Temporary URL)
# This will output a URL like https://<random-name>.trycloudflare.com
cloudflared tunnel --url http://localhost:8000
```
**Copy the `.trycloudflare.com` URL.** You will need this for the frontend Config.

### 3. Auto-Start on Boot (Systemd)
To ensure your backend and tunnel survive reboots, use the provided service files.

1.  **Copy Service Files**:
    ```bash
    # Update paths in the .service files if your repo is not in ~/codespace/predictive-maintenance-system
    sudo cp infra/pm-backend.service /etc/systemd/system/
    sudo cp infra/pm-tunnel.service /etc/systemd/system/
    ```

2.  **Enable and Start**:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable --now pm-backend
    sudo systemctl enable --now pm-tunnel
    ```

3.  **Check Status**:
    ```bash
    systemctl status pm-tunnel
    # Logs will show the persistent URL
    journalctl -u pm-tunnel -f
    ```

---

## Part 2: Deploy Frontend (Vercel)

### 1. Push Code to GitHub
Ensure your latest changes (refactored `Dashboard.jsx`) are pushed.

### 2. Deploy on Vercel
1.  Go to [Vercel.com](https://vercel.com) and **Add New Project**.
2.  Import your `predictive-maintenance-system` repository.
3.  **Build Settings**:
    -   **Framework Preset**: Vite
    -   **Root Directory**: `frontend` (Click 'Edit' > Select `frontend`).
4.  **Environment Variables** (Crucial Step):
    -   **Name**: `VITE_API_URL`
    -   **Value**: `https://<your-tunnel-url>.trycloudflare.com` (From Part 1).
5.  Click **Deploy**.

## Part 3: Verification

1.  Open your **Vercel App URL**.
2.  Enter sensor data and click **Predict**.
3.  The request flows: `Browser -> Vercel App -> Cloudflare Tunnel -> Your Laptop -> Docker Container`.

### CI/CD Pipeline
-   **Frontend**: Simply push to GitHub. Vercel automatically rebuilds and deploys the new frontend code.
-   **Backend**: 
    -   **Code Update**: Pull changes on your laptop.
    -   **Restart**: `sudo systemctl restart pm-backend`.
