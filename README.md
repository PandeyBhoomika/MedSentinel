<div align="center">
<img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
<img src="https://img.shields.io/badge/Groq_LPU-LLaMA_3.3_70B-FF6B35?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Polars-1.27-CD792C?style=for-the-badge"/>
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/Three.js-0.184-000000?style=for-the-badge&logo=three.js&logoColor=white"/>
</div>

# 🏥 MedSentinel AI

**AI-Powered Clinical Intelligence & Medical Anomaly Detection Platform**  
A full-stack, HIPAA-aware system that ingests any clinical dataset, detects life-threatening anomalies using Isolation Forest ML, pseudonymises PHI in a secure vault, explains every risk in plain clinical language via Groq LLM, and lets you query the data with natural language — all in one unified pipeline.

[Quick Start](#-quick-start) •
[Features](#-features) •
[Architecture](#%EF%B8%8F-system-architecture) •
[Pipeline](#-data-pipeline-flow) •
[Structure](#-project-structure) •
[API Reference](#-api-reference) •
[Tech Stack](#-tech-stack) •
[Security](#-security--compliance) •
[Environment](#-environment-variables)

---

## ✨ Features

| Category | Feature | Description |
|----------|---------|-------------|
| 🔬 **Anomaly Detection** | Isolation Forest ML | Statistical outlier detection across any numeric clinical columns with automatic 0–100 Threat Score assignment |
| 🏥 **Clinical AI** | Groq LLM Reasoning | LLaMA 3.3 70B acts as a virtual Chief Medical Officer — generating biological explanations for every flagged record |
| 💬 **Natural Language Query** | Dual NL Engine | Ask questions in plain English — the agent generates either SQL (PostgreSQL) or Pandas code (uploaded CSVs) and self-executes |
| 🔐 **Privacy Vault** | PHI Detection & SHA-256 | Local-edge regex scanning for SSNs and MRNs with salted SHA-256 pseudonymisation before any data reaches the database |
| ⚠️ **Risk Classification** | Threat Scoring | Normalized 0–100 Threat Score per record; records ≥ 50 are auto-flagged for clinical review with AI explanation |
| 📊 **Visual Analytics** | Interactive Dashboards | Real-time Recharts charts, Three.js 3D visualizations, and AG Grid enterprise data tables with sort, filter, and column management |
| 📄 **Report Generation** | Client-Side PDF Export | One-click anomaly reports via jsPDF + html2canvas — includes Threat Score summaries, per-patient AI explanations, and review status |
| 🔒 **Secure APIs** | Multi-Layer Validation | Pydantic schema enforcement, SQL keyword blocklist, sandboxed Pandas `exec()`, and CORS origin whitelist |
| 📋 **Audit Trail** | HIPAA-Ready Logging | Immutable JSONL audit log of every action with UTC timestamps — ready for regulatory review |
| 🎬 **Cinematic UI** | Premium Experience | GSAP scroll-driven animations, Three.js particle backgrounds, Framer Motion transitions, and Lenis smooth scrolling |

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Python** | 3.11+ | Backend runtime |
| **Node.js** | 18+ | Frontend runtime |
| **PostgreSQL** | 14+ | Primary database |
| **Groq API Key** | — | LLM inference ([Get one free →](https://console.groq.com)) |

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/MedSentinel.git
cd MedSentinel
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# ━━━ REQUIRED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROQ_API_KEY=gsk_your_key_here
DB_URL=postgresql://postgres:your_password@localhost:5432/medsentinel

# ━━━ OPTIONAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Custom salt for PHI pseudonymisation (defaults to built-in)
# DS_PII_SALT=your_custom_salt

# CORS whitelist (defaults to localhost:3000)
# CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Initialize the Database

```bash
# Create all tables (patients, vitals, labs)
python init_db.py

# Optional: seed with 50 synthetic patients + 3 injected anomalies
python seed_db.py
```

### 5. Start the Backend

```bash
uvicorn main:app --reload
```

The API server starts at **http://localhost:8000**:

| URL | Description |
|-----|-------------|
| `http://localhost:8000/` | Health check — `{"message": "Welcome to the MedSentinel Clinical API v2"}` |
| `http://localhost:8000/docs` | Interactive Swagger API documentation |
| `http://localhost:8000/redoc` | ReDoc API documentation |
| `http://localhost:8000/api/health` | Groq AI + database connectivity status |

### 6. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install
```

Create a `.env.local` file inside the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 7. Start the Frontend

```bash
npm run dev
```

The application opens at **http://localhost:3000**.

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    subgraph Browser["BROWSER — Next.js 16 + React 19"]
        direction LR
        HOME["🏠 Landing\nThree.js"]
        DASH["📊 Dashboard\nAG Grid"]
        UPLOAD["📤 Upload\nDataset"]
        REPORT["📄 Report\nPDF Export"]
        CHAT["💬 Clinical\nChat"]
    end

    Axios["Axios API Service"]
    Browser --> Axios

    subgraph Backend["FastAPI Backend (Python 3.11+)"]
        Gateway["API Gateway · CORS · Pydantic Validation"]

        subgraph Engines["AI & Processing Engines"]
            direction LR
            PHI["🔐 HIPAA Vault\nSHA-256 + Regex"]
            DET["🔬 Clinical Detection\nIsolation Forest"]
            MLE["🏥 Medical Logic\nGroq Reasoning"]
            NLQ["🔤 NL→SQL Engine\nLLaMA 3.3 70B"]
            DQE["🗃️ Dataset Query\nNL→Pandas Sandbox"]
        end

        Gateway --> PHI
        Gateway --> DET
        DET --> MLE
        Gateway --> NLQ
        Gateway --> DQE

        GroqClient["Groq Client · LLaMA 3.1 8B + 3.3 70B"]
        MLE --> GroqClient
        NLQ --> GroqClient
        DQE --> GroqClient
    end

    Axios -- "REST API" --> Gateway

    subgraph Storage["Storage Layer"]
        DB[("🗄️ PostgreSQL 16\npatients · vitals · labs")]
        AUDIT["📋 JSONL Audit Log\nCompliance Trail"]
    end

    Backend --> DB
    Backend --> AUDIT

    GroqCloud["☁️ Groq Cloud LPU\nLLaMA Inference"]
    GroqClient -- "AI Inference" --> GroqCloud
```

### Architecture Overview

MedSentinel uses a **decoupled client-server architecture** with a multi-engine backend:

```
Frontend (Next.js 16)  ──→  FastAPI Backend  ──→  AI Engines
                                    │                   │
                                    ↓                   ↓
                               PostgreSQL          Groq Cloud LPU
                               Audit JSONL         LLaMA 3.3 70B
```

---

## 🔄 Data Pipeline Flow

The platform processes clinical data through a **7-stage sequential pipeline**:

```mermaid
flowchart LR
    S1["1. UPLOAD\nCSV via Frontend"] --> S2["2. PHI VAULT\nSHA-256 Hash"]
    S2 --> S3["3. ANOMALY DETECTION\nIsolation Forest ML"]
    S3 --> S4["4. THREAT SCORING\n0–100 Normalized"]
    S4 --> S5["5. AI EXPLANATION\nGroq LLaMA Reasoning"]
    S5 --> S6["6. QUERY & EXPLORE\nNL → SQL / Pandas"]
    S6 --> S7["7. EXPORT\nPDF Report + CSV"]
```

| Stage | Engine | What Happens |
|-------|--------|-------------|
| **1. Upload** | `main.py` + Pydantic | CSV parsed by PapaParse → columns + rows[] payload → Pydantic schema validation |
| **2. PHI Vault** | `hipaa_vault.py` | Regex scan for SSN patterns → SHA-256 salted hashing of MRNs → findings report returned |
| **3. Detection** | `clinical_detection.py` | Auto-detect numeric columns → Isolation Forest `fit_predict()` → is_anomaly bool per record |
| **4. Threat Scoring** | `clinical_detection.py` | `decision_function()` scores → `np.interp()` normalization → 0–100 Threat Score |
| **5. AI Explanation** | `medical_logic.py` + `groq_client.py` | Top 10 flagged records → LLaMA 3.1 8B as CMO → JSON `{"explanation": "..."}` stored in `ai_reason` |
| **6. Query** | `nl_query.py` / `dataset_query.py` | NL question → LLaMA 3.3 70B generates SQL or Pandas code → sandboxed execution → JSON records |
| **7. Export** | Frontend jsPDF | AG Grid data + AI reasons → html2canvas → downloadable PDF report |

---

## 📁 Project Structure

```
MedSentinel-main/
├── backend/
│   ├── main.py                    # FastAPI app, all route definitions & CORS config
│   ├── database.py                # SQLAlchemy engine & session factory
│   ├── models.py                  # ORM models: Patient, VitalSign, LabResult
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── groq_client.py             # Centralized Groq LLM client (8B fast + 70B reasoning)
│   ├── utils.py                   # Logger setup, audit log writer, path management
│   ├── create_db_script.py        # DB table creation script
│   ├── init_db.py                 # DB initializer (Base.metadata.create_all)
│   ├── seed_db.py                 # Synthetic patient seeder with 3 injected anomalies
│   ├── test_groq.py               # Groq API connectivity test
│   ├── requirements.txt           # Python dependencies
│   ├── engines/
│   │   ├── __init__.py            # Re-exports all engine modules
│   │   ├── clinical_detection.py  # Isolation Forest · Threat Score normalization
│   │   ├── medical_logic.py       # Groq LLM clinical reasoning · ai_reason column
│   │   ├── nl_query.py            # NL → SQL translation · injection guard
│   │   ├── dataset_query.py       # NL → Pandas codegen · SAFE_GLOBALS sandbox
│   │   └── hipaa_vault.py         # SHA-256 PHI hashing · SSN/MRN regex scanner
│   └── data/
│       └── audit_logs.jsonl       # Immutable HIPAA audit trail (auto-created)
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Landing / home page with Three.js + GSAP
│   │   ├── layout.tsx             # Root layout · Navbar · react-hot-toast Toaster
│   │   ├── globals.css            # Global Tailwind styles
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Analytics dashboard · AG Grid · Recharts · Three.js
│   │   ├── upload/
│   │   │   └── page.tsx           # Dataset upload · PapaParse · detection pipeline
│   │   └── report/
│   │       └── page.tsx           # PDF report generation · jsPDF · html2canvas
│   ├── components/
│   │   ├── ClinicalChat.tsx       # AI-powered clinical chatbot interface
│   │   ├── ThreatChart.tsx        # Threat score Recharts visualization
│   │   ├── Navbar.tsx             # Sticky nav · mobile hamburger · lucide-react icons
│   │   └── ProcessingOverlay.tsx  # Loading state overlay with progress feedback
│   ├── lib/
│   │   └── api.ts                 # Axios API client with typed fetchers
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces: VitalSign, DetectionResponse, QueryResponse
│   ├── next.config.ts             # Next.js configuration
│   ├── tailwind.config.ts         # Tailwind design tokens (medical teal/navy palette)
│   ├── tsconfig.json              # TypeScript configuration
│   └── package.json              # Node.js dependencies
│
└── .gitignore
```

---

## 📡 API Reference

All endpoints served at `http://localhost:8000`. Interactive Swagger docs at `/docs`.

### Core Clinical Pipeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Welcome message and API version |
| `GET` | `/api/health` | System health — PostgreSQL + Groq AI connectivity status |
| `POST` | `/api/detect` | Run Isolation Forest on the PostgreSQL vitals table end-to-end |
| `POST` | `/api/upload-dataset` | Upload any CSV, run ML pipeline, return scored + AI-explained records |
| `POST` | `/api/query` | Natural language → SQL on PostgreSQL `patients`, `vitals`, `labs` tables |
| `POST` | `/api/query-dataset` | Natural language → Pandas on a user-uploaded dataset (no SQL, no DB) |

### Sample Requests

<details>
<summary><strong>POST /api/upload-dataset</strong></summary>

**Request:**
```json
{
  "columns": ["patient_id", "heart_rate", "o2_saturation", "temperature"],
  "rows": [
    ["P001", 165, 82, 101.2],
    ["P002", 72, 98, 36.7]
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "total_records": 2,
  "anomalies_flagged": 1,
  "cleaned_data": [
    {
      "patient_id": "P001",
      "heart_rate": 165,
      "o2_saturation": 82,
      "is_anomaly": true,
      "threat_score": 91.4,
      "review_status": "flagged_for_review",
      "ai_reason": "Severe tachycardia (165 bpm) with critical hypoxemia (SpO₂ 82%) and fever indicates possible septic shock requiring immediate intervention."
    }
  ]
}
```
</details>

<details>
<summary><strong>POST /api/query-dataset</strong></summary>

**Request:**
```json
{
  "question": "Show patients with heart rate above 120 and O2 saturation below 90",
  "columns": ["patient_id", "heart_rate", "o2_saturation"],
  "rows": [["P001", 165, 82], ["P002", 72, 98]]
}
```

**Response:**
```json
{
  "data": [{ "patient_id": "P001", "heart_rate": 165, "o2_saturation": 82 }],
  "row_count": 1,
  "code_executed": "result = df[(df['heart_rate'] > 120) & (df['o2_saturation'] < 90)]",
  "sql_executed": "[Pandas]\nresult = df[(df['heart_rate'] > 120) & (df['o2_saturation'] < 90)]"
}
```
</details>

<details>
<summary><strong>GET /api/health</strong></summary>

```json
{
  "status": "online",
  "database": "connected",
  "groq_ai": "connected"
}
```
</details>

---

## 🔧 Tech Stack

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| **FastAPI** | 0.115.12 | Async REST API framework with auto-generated Swagger docs |
| **Uvicorn** | 0.34.2 | ASGI production server |
| **SQLAlchemy** | 2.0.35 | ORM & database session management |
| **Alembic** | 1.13.3 | Database schema migration engine |
| **Pydantic** | 2.9.2 | Request/response validation and serialization |
| **scikit-learn** | 1.6.1 | Isolation Forest anomaly detection algorithm |
| **Pandas** | 2.2.3 | DataFrame manipulation and clinical data processing |
| **NumPy** | 2.2.5 | Numerical threat score normalization |
| **Polars** | 1.27.0 | High-performance DataFrame engine |
| **DuckDB** | 1.2.2 | In-process analytical SQL for dataset queries |
| **Groq SDK** | 0.11.0 | LLM inference client (LLaMA 3.1 8B + 3.3 70B on Groq LPU) |
| **SlowAPI** | 0.1.9 | Rate limiting middleware |
| **psycopg2-binary** | 2.9.10 | PostgreSQL Python driver |
| **python-dotenv** | 1.1.0 | Environment variable management |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| **Next.js** | 16.2.6 | React framework with App Router and SSR |
| **React** | 19.2.4 | UI component library |
| **TypeScript** | 5.x | Static typing across the entire frontend |
| **Tailwind CSS** | 4.x | Utility-first CSS with medical teal/navy design tokens |
| **Three.js** | 0.184 | 3D particle and background visualizations |
| **@react-three/fiber** | 9.6 | React renderer for Three.js scenes |
| **GSAP** | 3.x | Scroll-driven cinematic animations |
| **Lenis** | 1.x | Butter-smooth scroll engine |
| **Framer Motion** | 12.x | Page transitions and micro-animations |
| **Recharts** | 3.x | SVG charting for threat score distributions |
| **AG Grid** | 35.x | Enterprise-grade clinical data tables |
| **jsPDF + html2canvas-pro** | 4.x | Client-side PDF report generation |
| **PapaParse** | 5.x | CSV parsing and streaming |
| **Axios** | 1.x | Typed HTTP client |
| **react-hot-toast** | 2.x | Non-blocking notification toasts |
| **lucide-react** | 1.x | Clean icon set used across Navbar and UI |

---

## 🔐 Security & Compliance

MedSentinel implements a **defense-in-depth** security architecture:

| Layer | Implementation | HIPAA Relevance |
|-------|---------------|-----------------|
| **PHI Detection** | Local-edge regex scan — PII detected before reaching the LLM | §164.312 Access Control |
| **Pseudonymisation** | Salted SHA-256 on MRNs/SSNs — irreversible, preserves data relationships | §164.514 De-identification |
| **SQL Injection Guard** | Keyword blocklist (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`) + SQLAlchemy `text()` | §164.312 Integrity |
| **Pandas Sandbox** | `SAFE_GLOBALS` exec allowlist — no `import`, `os`, `subprocess`, `socket`, `eval` | §164.312 Integrity |
| **Schema Validation** | Pydantic v2 enforces type contracts on every API request body | §164.312 Access Control |
| **CORS Enforcement** | Origin whitelist via FastAPI middleware | §164.312 Transmission Security |
| **Audit Logging** | Immutable JSONL with UTC timestamps — every action recorded | §164.312(b) Audit Controls |
| **Secret Management** | All credentials via dotenv — never hardcoded | §164.312 Access Control |

> **PHI-Safe LLM Calls:** Before any data is sent to Groq, internal tracking columns (`is_anomaly`, `threat_score`, `patient_id`) are stripped from the payload to minimize PHI exposure in transit.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_URL` | ✅ Yes | — | PostgreSQL connection string |
| `GROQ_API_KEY` | ✅ Yes | — | Groq Cloud API key ([get one free](https://console.groq.com)) |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed CORS origins |
| `DS_PII_SALT` | No | Built-in default | Cryptographic salt for PHI SHA-256 hashing |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://127.0.0.1:8000` | FastAPI backend base URL |

---

## 🧪 Usage Guide

1. **Open** the app at `http://localhost:3000`
2. **Upload** any CSV with clinical data — or use the PostgreSQL-backed detection pipeline via the Dashboard
3. **PHI Vault** — MRNs and SSNs are automatically detected and hashed with SHA-256 before storage
4. **Review** detected anomalies with Threat Scores (0–100), review status flags, and AI-generated clinical explanations
5. **Query** your data using natural language — *"Show patients with SpO₂ below 90% and heart rate above 120"*
6. **Visualize** anomaly distributions and Threat Score charts in the Dashboard
7. **Export** a full PDF report with one click — includes per-patient AI explanations and clinical summaries

---

## 🗺️ Future Enhancements

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **Role-Based Access Control (RBAC)** | Admin, Clinician, Analyst, and Auditor roles with scoped API permissions |
| 🔴 High | **Multi-Hospital Deployment** | Tenant-isolated database schemas and API namespacing per facility |
| 🟡 Medium | **Fine-Tuned Medical LLM** | Domain-specific model trained on ICD-10, SNOMED-CT, and de-identified clinical notes |
| 🟡 Medium | **Real-Time Monitoring** | WebSocket streams for live patient vital sign alerting with threshold configuration |
| 🟡 Medium | **Predictive Analytics** | 30-day hospital readmission risk scoring and sepsis early warning models |
| 🟢 Planned | **FHIR R4 Integration** | HL7 FHIR-compliant data ingestion pipeline for EHR interoperability |
| 🟢 Planned | **Cloud Deployment** | AWS ECS / GCP Cloud Run with Terraform IaC and GitHub Actions CI/CD |
| 🟢 Planned | **DICOM Support** | Medical imaging anomaly detection with X-ray and CT scan pipeline integration |
| 🟢 Planned | **Enhanced Audit Trail** | Blockchain-anchored immutable logs for forensic-grade compliance evidence |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using **FastAPI**, **Next.js**, **Groq LPU**, and **Three.js**
