# Delay Lands - Land Acquisition Delay Risk Prediction & Governance Platform

An enterprise-grade, end-to-end Machine Learning web application designed for government land acquisition authorities (CALA / SLAO / NHAI / MoRTH) to detect acquisition delays early, quantify risk probabilities, provide explainable model-driven risk factors, suggest prioritized mitigation actions, and manage multi-officer access control with administrative approval workflows.

---

## Key Highlights

- **Predictive ML Engine**: Scikit-Learn `RandomForestClassifier` trained on historical land acquisition workflows, predicting probability of delay with balanced class handling.
- **Model Explainability**: Sensitivity & feature attribution analyzing specific case inputs to generate data-grounded **Risk Factors** and targeted **Suggested Actions**.
- **Role-Based Authentication & Authorization (RBAC)**:
  - Industry-standard `bcrypt` password hashing and `HS256` JWT sessions.
  - Officer self-registration placing accounts into `PENDING` status.
  - Administrator approval and account management workflow.
  - Role-protected endpoints and route-level guards.
- **GIS Spatial Risk View**: Interactive district-wise and state-level geospatial mapping of project risks across India.
- **Government Integrations**: Pre-configured connectors and sandbox simulators for **Bhoomi RRC**, **PM GatiShakti NMP**, **NHAI DLS**, and **Parivesh Forest Clearance**.
- **Audit Logging**: Comprehensive traceability of all logins, registrations, profile modifications, role changes, and system events.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Recharts, Leaflet / GIS Mapping |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn |
| **Security** | JWT (python-jose), Passlib (bcrypt), Role-Based Access Control (RBAC), Rate Limiting |
| **Machine Learning** | Scikit-Learn, Joblib, Pandas, NumPy, SHAP-inspired sensitivity analysis |
| **Database** | SQLite (default zero-config) / PostgreSQL compatible |
| **Deployment** | Docker, Render, Heroku / Procfile, Vercel / Netlify (SPA) |

---

## Project Structure

```
SIH206017/
├── backend/
│   ├── auth/                  # RBAC dependencies & token validation
│   ├── database/              # SQLite / PostgreSQL ORM models & session setup
│   ├── routes/                # API Endpoints (auth, admin, predict, history, analytics, etc.)
│   ├── schemas/               # Pydantic request & response validation schemas
│   ├── services/              # ML inference, explainability, and auth crypto services
│   └── main.py                # FastAPI server entrypoint & SPA static mounting
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components, TopHeader, Sidebar, Modals
│   │   ├── context/           # AuthContext (JWT persistence, RBAC state, Axios interceptor)
│   │   ├── pages/             # Login, Register, Profile, AdminUsers, Predict, History, Analytics...
│   │   └── services/          # API client for backend communication
│   ├── package.json
│   └── vite.config.js
│
├── ml/
│   ├── data/                  # Dataset of historical land acquisition records
│   ├── models/                # Trained Random Forest pipeline (.joblib) & metadata
│   └── train_model.py         # Model training & evaluation script
│
├── .env.example               # Environment variables template
├── .gitignore                 # Excludes secrets, node_modules, and cache files
├── Dockerfile                 # Multi-stage production container build
├── Procfile                   # Cloud PaaS deployment command
├── requirements.txt           # Python backend dependencies
└── README.md
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`

### 2. Backend Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd SIH206017

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Retrain / build the ML pipeline
python ml/train_model.py

# Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be accessible at: `http://127.0.0.1:8000` (Swagger Docs: `http://127.0.0.1:8000/docs`).

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Frontend application will open at: `http://localhost:5173`.

---

## Default Test Accounts

For evaluation and testing, the platform automatically initializes default test credentials upon first launch:

| Role | Email | Password | Employee ID |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@delaylands.gov.in` | `Admin@DelayLands2026` | `ADMIN-001` |
| **Government Officer** | `officer@delaylands.gov.in` | `Officer@DelayLands2026` | `OFF-4091` |

*(On the Login screen, click the **Quick-Fill** buttons for instant 1-click credential population).*

---

## Approval Workflow for New Registrations

1. New officers register through the **Create Account** page (`/register`).
2. Accounts are created with `role = "OFFICER"` and `status = "PENDING"`.
3. If the officer tries to sign in before approval, the system rejects the login with `403 Forbidden` (*"Account awaiting administrator approval"*).
4. The **Administrator** logs into the **User Management Console** (`/admin/users`) and clicks **Activate**.
5. Once activated (`status = "ACTIVE"`), the officer can log in and access all prediction, analytics, and GIS features.

---

## Deployment Guide

### Option 1: Docker (Single Unified Container)

The repository includes a multi-stage `Dockerfile` that builds the React frontend and serves both API and static assets from FastAPI:

```bash
# Build Docker image
docker build -t delay-lands:latest .

# Run container
docker run -p 8000:8000 --env-file .env delay-lands:latest
```

Open `http://localhost:8000` in your browser.

### Option 2: Cloud PaaS (Render / Railway)

1. Connect your GitHub repository to Render or Railway.
2. Set Environment Variables:
   - `JWT_SECRET_KEY`: A secure random 32-character string.
   - `ADMIN_EMAIL`: Admin email address.
   - `ADMIN_PASSWORD`: Strong administrator password.
3. Build Command: `pip install -r requirements.txt && cd frontend && npm install && npm run build`
4. Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

---

## GitHub Push Checklist

Before pushing to GitHub:

1. Ensure `.env` is NOT committed (verified in `.gitignore`).
2. Run automated test suite:
   ```bash
   python scratch/test_e2e_platform.py
   ```
3. Verify production frontend build:
   ```bash
   cd frontend && npm run build
   ```
