<div align="center">

# 🏛️ Delay Lands
### Predictive Analytics & Machine Learning Platform for Land Acquisition Delay Governance

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-00c7b7?style=for-the-badge&logo=render&logoColor=white)](https://delay-lands.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/nikhilappari/Delay_Lands_SIH26017)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/ML%20Engine-Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)

<p align="center">
  <b>An enterprise-grade, end-to-end intelligent decision-support system designed for Special Land Acquisition Officers (SLAO), Competent Authorities for Land Acquisition (CALA), NHAI, MoRTH, and Ministry Administrators to predict, explain, mitigate, and govern infrastructure project delays across India.</b>
</p>

---

### 🌐 [Click Here to Access the Live Web Application](https://delay-lands.onrender.com)
> **Live API Documentation (Swagger UI)**: [https://delay-lands.onrender.com/docs](https://delay-lands.onrender.com/docs)  
> **Backend Health Endpoint**: [https://delay-lands.onrender.com/api/health](https://delay-lands.onrender.com/api/health)

</div>

---

## 🔑 Quick Demo Login Credentials

You can test the live deployment immediately using these pre-configured prototype accounts, or use the **1-Click Quick-Fill** buttons on the login card:

| Role | Official Email | Password | Service ID | Access Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@delaylands.gov.in` | `Admin@DelayLands2026` | `ADMIN-001` | Full administrative control, user approval/activation, role elevation, system audit logs |
| **Government Officer (SLAO)** | `officer@delaylands.gov.in` | `Officer@DelayLands2026` | `OFF-4091` | Prediction engine, detailed risk analysis, GIS mapping, analytics, report export |

---

## 📌 Problem Context & Objectives

Land acquisition in linear and large-scale infrastructure projects (National Highways, Dedicated Freight Corridors, Metro Rails, Hydropower Dams) is notoriously prone to statutory bottlenecks, compensation disputes, environmental clearances, and legal litigations. Delays lead to massive capital overruns and stalled national economic corridors.

**Delay Lands** resolves this by providing:
1. **Early Risk Quantification**: Accurate ML delay probability scoring before statutory deadlines lapse.
2. **Explainable AI (XAI)**: Data-grounded identification of the exact case-specific drivers contributing to high risk.
3. **Actionable Mitigation Directives**: Rule-and-model-driven operational checklists tailored to the project stage.
4. **Institutional Security & RBAC**: Strict officer registration approval workflow ensuring authorized government access only.
5. **Spatial Intelligence**: District-level GIS mapping interoperable with PM GatiShakti and QGIS.

---

## 🚀 Core Platform Features

### 1. 🤖 Predictive Machine Learning Engine
- **Algorithm**: Balanced `RandomForestClassifier` (200 estimators) with categorical `OneHotEncoder` preprocessing pipelines.
- **Multivariate Inputs**: Evaluates Land Area (Acres), Number of Title Holders, Active Civil/High Court Disputes, Section 3C/5A Objections, Compensation Disbursement Rates, Cadastral Record Complexity, and Days in Current Statutory Stage.
- **Outputs**: Delay Probability Percentage ($0\% - 100\%$), Severity Rating (`LOW`, `MEDIUM`, `HIGH`), and Delay Projection (`DELAYED` vs `ON SCHEDULE`).

### 2. 🔍 Data-Driven Risk Factors & Suggested Actions
- Rather than generic outputs, the system dynamically analyzes project-specific attributes against baseline distributions:
  - **High Impact Drivers**: Flags specific bottlenecks like un-notified awards under Section 3G, court injunctions, low compensation disbursement ($<40\%$), or high owner density.
  - **Actionable Playbooks**: Generates prioritized operational guidance (e.g. *Convene Special Lok Adalat*, *Expedite 3E Possession Notice*, *Engage Drone Cadastral Resurvey*).

### 3. 🗺️ GIS Digital Map & GeoJSON Spatial Intelligence
- Interactive geospatial map displaying project markers color-coded by risk level across Indian states and districts.
- **Export GeoJSON**: One-click download of the complete geospatial layer (`.geojson`) compatible with **PM GatiShakti NMP**, **QGIS**, **ArcGIS**, and **Google Earth Pro**.

### 4. 🔒 Role-Based Authentication & Authorization (RBAC)
- **Government Officer Onboarding**: Officers self-register; accounts are placed into `PENDING` status.
- **Administrator Review & Activation**: Officers cannot access the platform until an Administrator reviews and activates their profile (`ACTIVE`).
- **Security Engineering**: Industry-standard `bcrypt` password hashing, `HS256` JWT sessions (24-hour standard / 7-day Remember Me), and anti-brute-force rate limiting.

### 5. 📊 Executive Analytics & Monitoring
- Aggregated sectoral risk metrics (Highways, Railways, Energy, Industrial Corridors).
- Statutory stage transition bottleneck trackers.
- Complete exportable Prediction History with search, multi-parameter filters, and CSV downloads.

### 6. 🏛️ Government Sandbox Integrations
- Simulation and readiness connectors for **Bhoomi RRC** (Revenue Records), **PM GatiShakti NMP** (Spatial Planning), **NHAI DLS** (Dispute Tracking), and **Parivesh** (Forest/Environmental Clearances).

---

## 🏗️ Technical Architecture

```
                               ┌─────────────────────────────────────────┐
                               │           Web / Mobile Browser          │
                               │  React 18 + Vite + Tailwind UI Portal   │
                               └────────────────────┬────────────────────┘
                                                    │ HTTPS / JWT Bearer Token
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │           FastAPI Backend App           │
                               │  ├── Authentication & RBAC Middleware   │
                               │  ├── REST API Router Endpoints          │
                               │  ├── Brute-Force Rate Limiter           │
                               │  └── Static SPA Asset Server            │
                               └──────┬──────────────────┬───────────────┘
                                      │                  │
                         ┌────────────┴───────┐   ┌──────┴───────────────┐
                         │   Machine Learning │   │     Database & Logs  │
                         │   Pipeline Service │   │  ├── User Accounts   │
                         │  ├── Random Forest │   │  ├── Predictions     │
                         │  ├── Sensitivity   │   │  ├── Risk Alerts     │
                         │  └── Explainability│   │  └── Audit Trail     │
                         └────────────────────┘   └──────────────────────┘
```

---

## 💻 Tech Stack Summary

| Domain | Technologies & Libraries |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide React, Recharts, Leaflet GIS |
| **Backend REST API** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy ORM |
| **Security & Auth** | JWT (`python-jose`), `bcrypt`, `email-validator`, Rate Limiter |
| **Data Science & ML** | Scikit-Learn, Joblib, Pandas, NumPy, SHAP-inspired sensitivity analysis |
| **Database** | SQLite (Zero-config embedded) / PostgreSQL compatible |
| **DevOps & Cloud** | Docker (Multi-stage build), Render, Procfile, GitHub Actions ready |

---

## 📂 Project Directory Structure

```
SIH206017/
├── backend/
│   ├── auth/                  # RBAC dependencies & token validation
│   ├── database/              # SQLAlchemy database models & session management
│   ├── routes/                # FastAPI API routers (auth, admin, predict, history, etc.)
│   ├── schemas/               # Pydantic validation schemas (requests & responses)
│   ├── services/              # ML inference, explainability attribution, and auth security
│   └── main.py                # FastAPI server entrypoint & SPA static asset server
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI widgets, TopHeader, Sidebar, Modals, Badges
│   │   ├── context/           # AuthContext (JWT persistence, RBAC state, Axios interceptors)
│   │   ├── pages/             # Login, Register, Profile, AdminUsers, Predict, History, GisMap...
│   │   └── services/          # API client for backend communication
│   ├── package.json           # Frontend dependencies & build scripts
│   └── vite.config.js         # Vite configuration
│
├── ml/
│   ├── data/                  # Historical training dataset (1,000 acquisition records)
│   ├── models/                # Serialized Random Forest pipeline artifact (.joblib) & metadata
│   └── train_model.py         # Pipeline training and evaluation script
│
├── .env.example               # Environment variables configuration template
├── .gitignore                 # Exclusion rules for secrets, DBs, and node_modules
├── Dockerfile                 # Multi-stage production container build
├── Procfile                   # Cloud PaaS deployment configuration
├── requirements.txt           # Python dependencies
└── README.md                  # Comprehensive system documentation
```

---

## 🛠️ Local Installation & Development

### 1. Prerequisites
- **Python 3.10+** (Recommended: Python 3.11)
- **Node.js 18+** & `npm`
- **Git**

### 2. Clone Repository
```bash
git clone https://github.com/nikhilappari/Delay_Lands_SIH26017.git
cd Delay_Lands_SIH26017
```

### 3. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# (Optional) Retrain ML Model
python ml/train_model.py

# Start Backend API Server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API Docs will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

### 4. Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```
*Frontend Application will open at: [http://localhost:5173](http://localhost:5173)*

---

## 🚢 Production Deployment Guide

### Option 1: Render / Cloud PaaS (Recommended)
1. Link your GitHub repository `nikhilappari/Delay_Lands_SIH26017` on [Render](https://render.com).
2. Set Runtime to **Docker** (or Python 3).
3. Set Environment Variables:
   - `JWT_SECRET_KEY` = `your_strong_32_character_secret_key`
   - `ADMIN_EMAIL` = `admin@delaylands.gov.in`
   - `ADMIN_PASSWORD` = `Admin@DelayLands2026`
   - `ADMIN_EMPLOYEE_ID` = `ADMIN-001`
4. Deploy! The unified service serves the React SPA and FastAPI backend from a single URL.

### Option 2: Docker Container Build
```bash
# Build the unified container
docker build -t delay-lands:latest .

# Run container on port 8000
docker run -d -p 8000:8000 --env-file .env delay-lands:latest
```
Access at `http://localhost:8000`.

---

## 🛡️ Security & Compliance Highlights

- **Zero Plaintext Secrets**: Passwords securely hashed with salted `bcrypt`.
- **RBAC Endpoint Protection**: Administrative routes (`/api/admin/*`) strictly verify `role == 'ADMIN'`.
- **Brute-Force Rate Limiting**: Automatic account lockout after 5 consecutive failed login attempts.
- **Audit Logging**: Every authentication event, profile change, role elevation, and system action is logged with actor metadata.
- **Separation of Concerns**: Government API simulator credentials remain backend-only and isolated from client exposure.

---

## 📄 License & Attribution

Developed for the **Smart India Hackathon (SIH)** — Land Acquisition Delay Risk Prediction & Governance Solution.  
All statutory workflow mappings adhere to the **Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (LARR Act)** and the **National Highways Act, 1956**.
