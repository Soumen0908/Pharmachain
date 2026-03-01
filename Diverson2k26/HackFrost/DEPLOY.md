# PharmaChain — Deployment Guide

## Architecture

| Layer | Platform | URL Pattern |
|-------|----------|-------------|
| Frontend (React + Vite) | **Vercel** | `https://pharmachain-xxxx.vercel.app` |
| Backend API (Express) | **Render** | `https://pharmachain-api.onrender.com` |
| Blockchain (Hardhat) | **Render** (embedded) | Runs internally on same server |

---

## Step 1 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo: `https://github.com/Soumen0908/Pharmachain.git`
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `pharmachain-api` |
| **Root Directory** | `Diverson2k26/HackFrost` |
| **Runtime** | Node |
| **Build Command** | `npm install --include=dev && npx hardhat compile` |
| **Start Command** | `node render-start.cjs` |
| **Plan** | Free |

4. Add Environment Variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `RPC_URL` | `http://127.0.0.1:8545` |
| `CORS_ORIGIN` | *(set after Step 2 — your Vercel URL)* |

5. Click **Create Web Service** → wait for build + deploy (~3-5 min)
6. Copy the Render URL (e.g. `https://pharmachain-api.onrender.com`)

> **Note:** On Render free tier, the service spins down after 15 min of inactivity. 
> Cold starts take ~1-2 minutes (blockchain init + contract deploy + seed data).

---

## Step 2 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your GitHub repo: `Soumen0908/Pharmachain`
3. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `Diverson2k26/HackFrost` |
| **Framework Preset** | Vite |
| **Build Command** | `vite build` *(auto-detected)* |
| **Output Directory** | `dist` *(auto-detected)* |

4. Add Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://pharmachain-api.onrender.com/api` |
| `VITE_RPC_URL` | `https://pharmachain-api.onrender.com/rpc` |

> Replace `pharmachain-api.onrender.com` with your actual Render URL from Step 1.

5. Click **Deploy** → wait for build (~1 min)

---

## Step 3 — Update CORS on Render

1. Go to your Render service → **Environment**
2. Set `CORS_ORIGIN` to your Vercel URL (e.g. `https://pharmachain-xxxx.vercel.app`)
3. Save → service will auto-redeploy

---

## Environment Variables Summary

### Render (Backend)
| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port (auto-set by Render) | — |
| `NODE_ENV` | production mode | `production` |
| `RPC_URL` | Hardhat RPC (internal) | `http://127.0.0.1:8545` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://pharmachain-xxxx.vercel.app` |

### Vercel (Frontend)
| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL | `https://pharmachain-api.onrender.com/api` |
| `VITE_RPC_URL` | Blockchain RPC proxy URL | `https://pharmachain-api.onrender.com/rpc` |

---

## How It Works in Production

1. **Render cold start**: `render-start.cjs` boots a Hardhat blockchain node, deploys the PharmaChain smart contract, seeds 6 sample batches with full supply chain simulation, then starts Express.

2. **Frontend on Vercel**: Static React app served by Vercel CDN. All API calls go to Render backend via `VITE_API_URL`. Blockchain RPC (for MetaMask) proxied through `/rpc`.

3. **MetaMask**: Users connecting MetaMask get directed to the "PharmaChain Network" (chain ID 31337) using the backend's `/rpc` proxy endpoint.

---

## Limitations (Free Tier)

- Render free tier has **512 MB RAM** and **spins down after 15 min** of inactivity
- Cold starts re-initialize everything (blockchain + data) — takes ~1-2 min
- JSON file-based data (users, sessions) is **ephemeral** — resets on redeploy
- Seed data (6 batches) is automatically recreated on every cold start
