# ClinicQueue — Predictable Outpatient Queue Manager
### National-Level Hackathon Edition | Innovators Conclave 2026

[![CI](https://github.com/shreya-0x/clinicqueue/actions/workflows/ci.yml/badge.svg)](https://github.com/shreya-0x/clinicqueue/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
[![React: 18.3](https://img.shields.io/badge/react-18.3-61dafb.svg)](https://react.dev/)

---

## 1. Executive Summary & Vision

Outpatient waiting rooms across India and worldwide remain unpredictable, congested, and stressful. Traditional healthcare IT systems either treat scheduling as rigid static slots or simply multiply queue position by a fixed interval (e.g. `Position × 15 min`), failing to account for:
1. Real-time active consultation progress
2. Doctor-specific historical consultation pacing and variability
3. Scheduled doctor breaks and unforeseen emergency delay reports
4. Complexity weighting across appointment types (new comprehensive vs fast follow-up)
5. Punctuality, no-shows, and walk-in demand surges

**ClinicQueue** transforms outpatient waiting into a transparent, measurable, and actively orchestrated operational flow. It combines **Adaptive Wait-Time Predictions with explainable rationales**, a **Clinic-Day Digital Twin (Simulator)** for operational decision support, and **real-time role-based queue orchestration**.

---

## 2. Core Architectural Innovations

### A. Adaptive Wait-Time Prediction Engine
Unlike naive static calculators, the prediction engine dynamically calculates:
$$\text{Wait} = \text{Remaining Active Consultation} + \sum_{i \in \text{Ahead}} (\text{Median}_{\text{doc}} \times W_{\text{type}, i} \times P_{\text{adj}, i}) + \text{Break}_{\text{active}} + \text{Delay}_{\text{reported}}$$
- **Zero Double-Counting**: Patients currently in consultation are tracked as active in-room load, not waiting queue entries. Completed, cancelled, or no-show entries are immediately excluded from active calculations.
- **Explainable AI (XAI)**: Every prediction generates plain-language rationales reflecting actual inputs:
  - *"1 consultation currently in progress (~6m remaining)."*
  - *"1 eligible patient is ahead of you in queue."*
  - *"Dr. Sharma paces consultations ~3m longer than department benchmark."*
  - *"Reported doctor emergency delay: +15m."*
- **Uncertainty Bounds**: Generates confidence bounds (e.g., $14\text{m} \pm 3\text{m}$) rather than misleading single-minute guarantees.

### B. Clinic-Day Digital Twin (Discrete Event Simulator)
A dedicated operations simulator that advances a virtual clinic day through arrival and consultation events:
- **Preset Scenarios**:
  1. *Normal Operating Day* (balanced baseline flow)
  2. *High-Demand Surge* (35% walk-ins, +40% case variance)
  3. *Reduced Staffing & Doctor Emergency Delay* (1 doctor on duty with 35m delay)
- **Interactive Controls**: Real-time sliders for appointment volume, walk-in rate, doctor availability, break duration, and unexpected delays.
- **Decision Support**: Instant before-and-after comparisons of average wait, 90th percentile wait, doctor utilization percentage, and hourly backlog curves.

### C. Empirical Prediction Evaluation
Auditable Mean Absolute Error (MAE) and Median Absolute Error tracking using real outcomes recorded at consultation start:
- Automatically benchmarks the **ClinicQueue Adaptive Engine** against the standard industry **Fixed-Slot Baseline** across historical completed visits.
- Departmental and clinician-specific accuracy breakdowns.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Recharts, Lucide React, Atkinson Hyperlegible Typography.
- **Backend**: Python 3.12, Flask REST API, Flask-CORS, Pydantic, Argon2id/Bcrypt password hashing.
- **Database Layer**: MongoDB Atlas compatible persistence with PyMongo, PLUS a zero-dependency **Local Embedded Persistent Storage Engine** that functions offline with identical PyMongo APIs.
- **Testing**: Automated Pytest suite (15 comprehensive test suites passing 100%).
- **Digital Health Extensions**: Outpatient Digital Prescriptions (Rx) with print/PDF, and Cashless Health Insurance Coverage Profiles with interactive TPA management.
- **Deployment**: Automatic GitHub Pages deployment via GitHub Actions (`.github/workflows/deploy-pages.yml`), Vercel configuration (`vercel.json`), and Render API configuration (`render.yaml`).

---

## 4. User Personas & Demo Accounts

Every role can be accessed immediately using the **Demo Quick-Switcher** in the top navigation bar or with these pre-seeded credentials:

| Role | Email | Password | Persona & Context |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@clinicqueue.demo` | `Demo123!` | Rohan Mehta (Checked in at #2 for Dr. Sharma) |
| **Receptionist** | `reception@clinicqueue.demo` | `Demo123!` | Ananya Sen (MetroCare Apex Front Desk) |
| **Doctor** | `doctor.sharma@clinicqueue.demo` | `Demo123!` | Dr. Rajesh Sharma (Cardiology Specialist) |
| **Hospital Admin** | `admin@metrocare.demo` | `Demo123!` | Col. Dr. Arvind Saxena (Medical Superintendent) |
| **Platform Admin** | `platform.admin@clinicqueue.demo` | `Demo123!` | National Network Controller (8 Hospitals) |

---

## 5. Recommended 5-Minute Evaluation Walkthrough

The platform includes a prominent **Demo Centre** (`/demo-centre`) allowing independent exploration:

1. **Step 1 • Patient Live Queue**: Navigate to `/patient`. Observe Rohan Mehta's live queue tracker (#2 in line for Dr. Rajesh Sharma, estimated wait ~14m with plain-language explanations).
2. **Step 2 • Reception Desk**: Switch to Receptionist (`/reception`). Check today's active schedule, test registering a walk-in or adding an *Elderly (+10)* or *Mobility (+15)* priority flag.
3. **Step 3 • Doctor Active Room**: Switch to Doctor (`/doctor`). Notice the active consultation with Patient P-0002. Click **"Complete Consultation"** (enter duration and notes).
4. **Step 4 • Call In Patient**: Click **"Start Consultation"** on Rohan Mehta to call him into the room.
5. **Step 5 • Real-Time Recalculation**: Switch back to Patient (`/patient`). Notice the status has transitioned to *"In Consultation"* and wait time updated to 0m.
6. **Step 6 • Operations Analytics**: Switch to Hospital Admin (`/admin`). Review real KPI cards derived from historical consultations, department distributions, and hourly congestion.
7. **Step 7 • Clinic Digital Twin**: Under Admin, open the **Digital Twin Simulator** tab. Choose *"High-Demand Surge"* and click **Execute Simulation** to view the virtual clinic backlog curve.
8. **Step 8 • Accuracy Verification**: Open the **Model Evaluation** tab to compare empirical MAE between the Adaptive Engine and the Baseline.

---

## 6. Preloaded Synthetic Dataset

The seed generator (`backend/seed.py`) deterministically populates:
- **8 Fictional Hospitals**: MetroCare Apex (Delhi), Apollo Heritage (Bengaluru), Fortis Horizon (Mumbai), Manipal City Centre (Hyderabad), CarePoint SuperSpecialty (Chennai), Sterling Global (Kolkata), Greenfield Community (Pune), Apex Family (Ahmedabad).
- **38 Fictional Doctors**: Spread across 16 specialties (Cardiology, Orthopedics, Pediatrics, Neurology, Dermatology, General Medicine, ENT, etc.).
- **229 Fictional Patients**: Complete with MRNs, contact info, blood groups, and demographic profiles.
- **>320 Appointments & Queue Records**: Historical completed visits over 14 days with actual consultation durations and prediction snapshots, plus today's active live queue.

---

## 7. Local Setup & Execution

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Quick Start (Windows)
```powershell
# 1. Clone repository
git clone https://github.com/shreya-0x/clinicqueue.git
cd clinicqueue

# 2. Set up Python backend
python -m venv venv
.\venv\Scripts\pip install -r backend/requirements.txt
$env:PYTHONPATH = "."
.\venv\Scripts\python -m backend.seed # Preloads 8 hospitals, 38 doctors, 229 patients
.\venv\Scripts\python -m backend.app  # Starts Flask REST API on http://localhost:5000

# 3. In a new terminal, start Vite frontend
cd frontend
npm install --legacy-peer-deps
npm run dev                          # Starts Vite on http://localhost:5173
```

### Quick Start (Linux / macOS)
```bash
git clone https://github.com/shreya-0x/clinicqueue.git
cd clinicqueue

# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
export PYTHONPATH=.
python3 -m backend.seed
python3 -m backend.app &

# Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

## 8. Automated Testing

Run the full backend test suite covering authentication, role isolation, queue state machine, double-booking prevention, adaptive predictions, and simulation reproducibility:

```powershell
$env:PYTHONPATH = "."
.\venv\Scripts\python -m pytest tests/test_backend.py -v
```
**Results**: `15 passed in ~6.11s (100% pass rate)`.

To verify frontend production build:
```powershell
cd frontend
npm run build:node
```
**Results**: Production build succeeds in ~52s (`dist/index.html`, `dist/assets/index.js`, `dist/assets/index.css` generated with 0 errors).

---

## 9. Deployment Configuration

- **Frontend**: Configured for Vercel with SPA routing rewrite (`frontend/vercel.json`).
- **Backend API**: Configured for Render or container deployment via `render.yaml` and `Procfile`.
- **Database**: Works out of the box with embedded persistent storage or connects directly to MongoDB Atlas via `MONGODB_URI` in `.env`.

---

## 10. Hackathon Acknowledgement
Developed for **Innovators Conclave 2026 Hackathon**.
*Autonomous single-run production build adhering to strict clinical operations, patient privacy, and explainable queue management standards.*
