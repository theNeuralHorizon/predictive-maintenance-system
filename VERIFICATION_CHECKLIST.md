# System Verification Checklist

Use this guide to verify your **Hybrid Cloud Deployment**.

## 1. Local Backend (Linux/Podman)
**Goal**: Ensure the API is running locally.

- [ ] **Check Containers**:
  ```bash
  podman ps
  # Expected: pm-backend and pm-nginx (if used) listed
  ```
  *If empty*: Run `podman-compose -f infra/docker-compose.yml up -d`

- [ ] **Check Local API**:
  ```bash
  curl -I http://localhost:8000/docs
  # Expected: HTTP/1.1 200 OK
  ```

## 2. Cloudflare Tunnel
**Goal**: Ensure public access to local backend.

- [ ] **Check Tunnel Status**:
  Check your running terminal for `cloudflared`.
  *If not running*: `cloudflared tunnel --url http://localhost:8000`

- [ ] **Verify Public URL**:
  Copy the URL (e.g., `https://cold-river-123.trycloudflare.com`) and open it in a browser adding `/docs`.
  *Expected*: Swagger UI loads.

## 3. Frontend (Vercel)
**Goal**: Ensure React app talks to the Tunnel.

- [ ] **Check Vercel Deployment**:
  Go to your Vercel Dashboard. Ensure `VITE_API_URL` is set to your **current** Tunnel URL.
  *Note: If you restarted `cloudflared` without a named tunnel, the URL changed! You must update Vercel env var and redeploy.*

- [ ] **End-to-End Test**:
  1. Open your Vercel App URL.
  2. Input data (e.g., Air Temp: 300).
  3. Click **Predict**.
  4. *Expected*: Result ("Normal" or "Anomaly") appears.
  5. *Fail*: Check Console (F12) for "Network Error" (Cross-Origin or 404).

## 4. Automation (Systemd)
**Goal**: Survive reboot.

- [ ] **Check Services**:
  ```bash
  systemctl status pm-backend pm-tunnel
  # Expected: Active (running)
  ```
  *If missing*: Follow `DEPLOYMENT_GUIDE_HYBRID.md` to copy and enable services.
