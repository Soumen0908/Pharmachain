# 💊 PharmaChain — Anti-Counterfeit Drug Verification Platform

> Blockchain-powered pharmaceutical supply chain verification with AI-driven analysis, real-time tracking, and consumer-first security.

PharmaChain uses **Ethereum smart contracts**, **Google Gemini AI**, and a **scratch-code authentication system** to verify every medicine from factory floor to consumer hands — making counterfeit drugs detectable in seconds.

---

## 🏗 Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  React SPA  │◄──►│  Express API     │◄──►│  Hardhat Node    │
│  (Vite PWA) │    │  (Port 3001)     │    │  (Port 8545)     │
│  Port 5173  │    │                  │    │  PharmaChain.sol │
└──────┬──────┘    │  JSON File DB    │    └──────────────────┘
       │           │  Gmail SMTP      │              │
       │           │  Gemini AI Proxy │    ┌─────────▼────────┐
       │           │  SSE Live Feed   │    │    Supabase      │
       │           └──────────────────┘    │  (Cloud Persist) │
       │                                   └──────────────────┘
       ▼
  MetaMask (Web3)
```

---

## 🛠 Tech Stack

| Layer          | Technology                                                        |
| -------------- | ----------------------------------------------------------------- |
| **Frontend**   | React 18, React Router v6, Vite 5, Lucide Icons, QRCode.react    |
| **Backend**    | Node.js, Express 5, Nodemailer (Gmail SMTP)                      |
| **Blockchain** | Solidity ^0.8.24, Hardhat, Ethers.js v6, Local Hardhat Node      |
| **Database**   | JSON file DB (server), localStorage (client), Supabase (cloud)   |
| **AI**         | Google Gemini 2.0 Flash (medicine details & comparison)           |
| **PWA**        | Service Worker (network-first + cache fallback), Web Manifest     |
| **Real-time**  | Server-Sent Events (SSE) for live batch updates                  |
| **Auth**       | Session-based JWT, OTP via Gmail SMTP, 2FA login flow            |

---

## ✨ Key Features

### 🔗 Blockchain Verification
Every medicine batch is registered on Ethereum (Hardhat local network) with an immutable hash-based identity. The smart contract enforces role-based access and tracks the complete chain of custody.

### 🎫 Physical-Digital Authentication (Scratch Codes)
Each medicine comes with a scratch code that maps to an on-chain `keccak256` hash. **First scan** transfers ownership to the consumer and marks it as sold. **Second scan** automatically flags the batch as a potential counterfeit.

### 📦 Full Supply Chain Tracking
```
Manufacturer → Distributor → Retailer → Inspector Approval → Consumer
```
Every transfer is recorded on-chain with timestamps and location data. Batches must be acknowledged at each step.

### 🤖 AI-Powered Trust Score
A 5-component weighted scoring engine analyzes every batch:
- **Supply Chain Completeness** (30%) — Are all transfer steps present?
- **Scan Behavior** (25%) — Normal scan frequency vs. suspicious patterns
- **Route Consistency** (20%) — Does the geographic path make sense?
- **Timing Anomalies** (15%) — Unusual delays or speed in transfers
- **Inspector Validation** (10%) — Has an inspector approved the batch?

### 🧠 Gemini AI Integration
- **Medicine Lookup** — Comprehensive AI-generated details: composition, uses, side effects, dosage, contraindications, mechanism of action
- **Medicine Comparison** — Compare 2+ medicines side-by-side with AI analysis

### 🗺 Interactive Counterfeit Heatmap
SVG-based India map with city-level risk visualization, animated pulse markers, and hover tooltips showing counterfeit hotspots.

### 🌡 Cold Chain Monitoring
Simulated IoT temperature logging for temperature-sensitive products (e.g., vaccines at 2–8°C) with excursion detection and alerts.

### 🏆 Consumer Rewards System
| Action              | Points |
| ------------------- | ------ |
| Verify a medicine   | 10     |
| First-scan bonus    | 25     |
| Report suspicious   | 50     |
| Streak bonuses      | Varies |

**Tiers:** Bronze → Silver → Gold → Platinum

### 📡 Real-Time Updates
Server-Sent Events (SSE) push live notifications for batch registration, transfers, inspections, and recalls to connected clients.

### 🔍 Inspector Gate
Inspectors must approve batches before consumers can activate them. Inspectors can **flag** or **recall** batches, with cascading recalls propagating to all child batches.

### 📱 QR Code System
Cryptographic QR generation with SHA-256 hash + random salt. QR scanning via `html5-qrcode` camera integration.

### 🔒 Two-Factor Authentication
Real OTP emails via Gmail SMTP. Login requires email/password + OTP verification for secure access.

### 💊 50+ Medicine Database
Local Indian-market medicine database with generic names, brand aliases, compositions, categories, and substitutes.

### ✂️ Batch Splitting
Parent batches can be split into child batches while maintaining full lineage tracking on-chain.

---

## 📂 Project Structure

```
HackFrost/
├── contracts/
│   └── PharmaChain.sol          # Solidity smart contract (538 lines)
├── scripts/
│   ├── deploy-direct.cjs        # Deploy + seed script (bypasses Hardhat runner)
│   ├── deploy.cjs               # Hardhat deploy script
│   └── seed.cjs                 # Seed sample data
├── server/
│   ├── index.js                 # Express entry point (port 3001)
│   ├── db.js                    # JSON file-based database
│   ├── data/                    # JSON data files
│   │   ├── batch_metadata.json  # Registered batch records
│   │   ├── users.json           # User accounts
│   │   ├── sessions.json        # Active sessions
│   │   ├── otps.json            # Pending OTPs
│   │   ├── reports.json         # Counterfeit reports
│   │   ├── supply_chain_steps.json
│   │   └── transfer_qr_tokens.json
│   ├── routes/
│   │   ├── auth.js              # Signup, login, OTP, 2FA
│   │   ├── blockchain.js        # Batch CRUD, verify, transfer, inspect
│   │   ├── gemini.js            # AI medicine details & comparison
│   │   ├── live.js              # SSE real-time event stream
│   │   ├── medicines.js         # Local medicine database search
│   │   ├── profile.js           # User profile management
│   │   └── reports.js           # Counterfeit reporting
│   ├── services/
│   │   ├── blockchain.js        # Ethers.js contract connection
│   │   └── supabase.js          # Supabase cloud persistence
│   └── utils/
│       └── qrGenerator.js       # QR hash + scratch code generation
├── src/
│   ├── App.jsx                  # Router & page layout
│   ├── main.jsx                 # React entry point
│   ├── components/
│   │   ├── InteractiveMap.jsx   # SVG India counterfeit heatmap
│   │   ├── LiveFeed.jsx         # Real-time SSE event feed
│   │   ├── MedicineLookup.jsx   # AI medicine search component
│   │   ├── Navbar.jsx           # Navigation bar
│   │   ├── RadarChart.jsx       # Trust score radar visualization
│   │   ├── ReportFake.jsx       # Counterfeit report form
│   │   ├── ScratchCard.jsx      # Scratch code reveal component
│   │   ├── VerificationCertificate.jsx  # Downloadable verification proof
│   │   └── ...
│   ├── context/
│   │   ├── AuthContext.jsx      # Authentication state & API
│   │   ├── ThemeContext.jsx      # Dark/light theme
│   │   └── Web3Context.jsx      # MetaMask & contract integration
│   ├── pages/
│   │   ├── Landing.jsx          # Hero + feature showcase
│   │   ├── Verify.jsx           # Medicine verification (QR + manual)
│   │   ├── Manufacturer.jsx     # Batch registration dashboard
│   │   ├── Inspector.jsx        # Inspect, approve, flag, recall
│   │   ├── Analytics.jsx        # Enterprise analytics dashboard
│   │   ├── Dashboard.jsx        # On-chain overview
│   │   ├── BatchTracker.jsx     # Supply chain step tracker
│   │   ├── Rewards.jsx          # Consumer reward points
│   │   ├── MedicineSearch.jsx   # AI-powered medicine search
│   │   ├── CustomerDashboard.jsx # Customer portal
│   │   └── ...
│   ├── services/
│   │   ├── api.js               # Backend API client
│   │   ├── riskEngine.js        # AI trust score calculator
│   │   ├── rewardEngine.js      # Reward points engine
│   │   └── offChainStore.js     # localStorage persistence
│   └── utils/
│       └── contractConfig.json  # Deployed contract address + ABI
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   └── images/                  # Icons & assets
├── artifacts/                   # Compiled Solidity artifacts
├── hardhat.config.cjs           # Hardhat configuration
├── vite.config.js               # Vite build configuration
├── package.json                 # Dependencies & scripts
└── .env                         # Environment variables
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ 
- **npm** or **yarn**
- **MetaMask** browser extension (optional, for on-chain features)

### Installation

```bash
cd HackFrost
npm install
```

### Running the Project

You need **3 terminals** running simultaneously:

#### Terminal 1 — Local Blockchain
```bash
npx hardhat node --config hardhat.config.cjs
```
This starts a local Ethereum node on `http://127.0.0.1:8545` with pre-funded test accounts.

#### Terminal 2 — Deploy & Seed Smart Contract
```bash
node scripts/deploy-direct.cjs
```
This deploys the PharmaChain contract, grants roles to test accounts, creates 6 sample medicine batches, and simulates a full supply chain for each.

#### Terminal 3 — Backend Server
```bash
node server/index.js
```
Starts the Express API on `http://localhost:3001`.

#### Terminal 4 — Frontend
```bash
npm run dev
```
Starts the Vite dev server on `http://localhost:5173`.

### Quick Start (All-in-one)
```bash
# Terminal 1: Blockchain
npx hardhat node --config hardhat.config.cjs

# Terminal 2: Deploy + Backend + Frontend
node scripts/deploy-direct.cjs
node server/index.js &
npm run dev
```

---

## 🧪 Sample Test Data

After running `deploy-direct.cjs`, these batches are available:

| # | Medicine             | Batch Number    | Scratch Code |  Expiry    |
|---|----------------------|-----------------|--------------|------------|
| 1 | Paracetamol 500mg    | PCM-2026-001    | XKRF82NP     | 2027-06-15 |
| 2 | Amoxicillin 250mg    | AMX-2026-002    | M3QW9TYA     | 2027-03-20 |
| 3 | Metformin 500mg      | MET-2026-003    | J7LP4XCR     | 2027-09-01 |
| 4 | COVID Vaccine Dose   | COV-2026-004    | VX92KFBN     | 2026-08-30 |
| 5 | Ibuprofen 400mg      | IBU-2026-005    | QZ5D8MVH     | 2027-12-31 |
| 6 | Azithromycin 500mg   | AZI-2026-006    | PL8N2RAT     | 2028-01-15 |

### Test Accounts (Hardhat)

| Role          | Address                                    |
| ------------- | ------------------------------------------ |
| Owner         | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Manufacturer  | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| Distributor   | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| Retailer      | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| Inspector     | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |

---

## 🔌 API Reference

### Health
| Method | Endpoint        | Description       |
| ------ | --------------- | ----------------- |
| GET    | `/api/health`   | Server health check |

### Authentication (`/api/auth/`)
| Method | Endpoint          | Description                            |
| ------ | ----------------- | -------------------------------------- |
| POST   | `/send-otp`       | Send 6-digit OTP via Gmail             |
| POST   | `/verify-otp`     | Verify OTP code                        |
| POST   | `/signup`         | Register new account (requires OTP)    |
| POST   | `/login`          | Login (returns `requireOTP` for 2FA)   |
| POST   | `/login-verify`   | Complete 2FA login with OTP            |
| GET    | `/me`             | Get current user session               |
| POST   | `/logout`         | End session                            |

### Blockchain (`/api/blockchain/`)
| Method | Endpoint                   | Auth | Description                       |
| ------ | -------------------------- | ---- | --------------------------------- |
| POST   | `/batch/register`          | Yes  | Register new batch on-chain       |
| GET    | `/batch/my-batches`        | Yes  | Get manufacturer's batches        |
| GET    | `/verify/:identifier`      | No   | Verify batch (public)             |
| POST   | `/verify-scratch`          | No   | Activate via scratch code         |
| POST   | `/transfer/*`              | Yes  | Supply chain transfers            |
| GET    | `/stats`                   | No   | Blockchain statistics             |
| GET    | `/all-batches`             | No   | List all batches                  |

### Medicines (`/api/medicines/`)
| Method | Endpoint           | Description                            |
| ------ | ------------------ | -------------------------------------- |
| GET    | `/search?q=`       | Search 50+ medicine local database     |
| GET    | `/details/:name`   | Get medicine composition & substitutes |

### Gemini AI (`/api/gemini/`)
| Method | Endpoint              | Description                        |
| ------ | --------------------- | ---------------------------------- |
| POST   | `/medicine-details`   | AI-generated medicine information   |
| POST   | `/medicine-compare`   | AI-powered medicine comparison      |

### Reports (`/api/reports/`)
| Method | Endpoint           | Description                    |
| ------ | ------------------ | ------------------------------ |
| POST   | `/`                | Report counterfeit medicine     |
| GET    | `/`                | Get all reports (admin)         |
| GET    | `/batch/:batchId`  | Check reports for a batch      |

### Live Feed (`/api/live/`)
| Method | Endpoint           | Description                    |
| ------ | ------------------ | ------------------------------ |
| GET    | `/batch-stream`    | SSE real-time event stream     |
| GET    | `/recent-events`   | Last 50 events                 |

---

## 🔐 Smart Contract — PharmaChain.sol

### Roles
```
None (0) → Manufacturer (1) → Distributor (2) → Retailer (3) → Inspector (4) → Auditor (5)
```

### Batch Lifecycle
```
Manufactured → In Transit (Dist) → At Distributor → In Transit (Ret) → At Retailer → Inspector Approved → Sold → Recalled / Flagged
```

### Key Functions

| Function                   | Role          | Description                                          |
| -------------------------- | ------------- | ---------------------------------------------------- |
| `grantRole`                | Owner         | Assign role to an address                            |
| `createBatch`              | Manufacturer  | Register new batch with metadata + scratch hash      |
| `transferToDistributor`    | Manufacturer  | Begin distribution transfer                          |
| `acknowledgeByDistributor` | Distributor   | Confirm receipt at distribution center               |
| `transferToRetailer`       | Distributor   | Transfer to retail                                   |
| `acknowledgeByRetailer`    | Retailer      | Confirm receipt at retail location                   |
| `inspectAndApprove`        | Inspector     | Approve batch for consumer sale                      |
| `activateProduct`          | Anyone        | First-scan ownership (scratch code required)         |
| `recallBatch`              | Inspector     | Recall with cascading to child batches               |
| `flagBatch`                | Inspector     | Flag suspicious batch                                |
| `splitBatch`               | Holder        | Split into child batches with lineage                |

---

## 🌐 Environment Variables

Create a `.env` file in the `HackFrost/` root:

```env
# API
VITE_API_URL=http://localhost:3001/api

# Google Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# Gmail SMTP (for OTP emails)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Supabase (optional cloud persistence)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

---

## 📜 Available Scripts

| Command                                          | Description                                |
| ------------------------------------------------ | ------------------------------------------ |
| `npm run dev`                                    | Start Vite frontend dev server             |
| `npm run build`                                  | Production build                           |
| `npm run preview`                                | Preview production build                   |
| `npm run server`                                 | Start Express backend server               |
| `npm run compile`                                | Compile Solidity contracts                 |
| `npm run node`                                   | Start Hardhat local blockchain             |
| `npm run deploy`                                 | Deploy contract via Hardhat                |
| `npm run seed`                                   | Seed sample batch data                     |
| `node scripts/deploy-direct.cjs`                 | Deploy + seed (recommended for Windows)    |

---

## 🧭 Pages Overview

| Page                  | Description                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| **Intro**             | Animated splash screen with particle effects                                     |
| **Landing**           | Hero section, live medicine lookup, feature cards, interactive map               |
| **Verify**            | Core verification page — enter batch ID or scan QR, view trust score & history   |
| **Manufacturer**      | Register new batches, view registered batches, manage supply chain               |
| **Inspector**         | Inspect batches, approve/flag/recall, QR-based actions                           |
| **Analytics**         | Enterprise dashboard — counterfeit heatmap, cold chain monitoring, risk alerts   |
| **BatchTracker**      | Visual supply chain step tracker for any batch                                   |
| **MedicineSearch**    | AI-powered medicine lookup with Gemini                                           |
| **Rewards**           | Consumer reward points, tier progress, scratch card bonuses                      |
| **CustomerDashboard** | Customer portal with saved medicines, scan history, expiry alerts                |
| **Profile**           | User profile management, government ID verification                             |
| **Dashboard**         | On-chain overview with connected wallet                                          |
| **Admin**             | Administrative controls and user management                                      |

---

## 🤝 Third-Party Services

| Service                   | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| **Google Gemini 2.0 Flash** | AI medicine details and comparison             |
| **Supabase**              | Cloud persistence for batch & transaction data |
| **Gmail SMTP**            | Real OTP email delivery for 2FA                |
| **MetaMask**              | Web3 wallet for on-chain interactions          |
| **Hardhat**               | Local Ethereum node + Solidity compiler        |

---

## 📄 License

This project was built for **HackFrost / Diverson 2k26** hackathon.

---

<p align="center">
  Built with ❤️ using React, Solidity, and Gemini AI
</p>
