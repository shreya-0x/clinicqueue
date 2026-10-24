# ClinicQueue — Predictable Outpatient Queue Manager
## Professional Outpatient Queue Management & Predictive Analytics Platform

[![CI](https://github.com/shreya-0x/clinicqueue/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/shreya-0x/clinicqueue/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
[![React: 18.3](https://img.shields.io/badge/react-18.3-8B5CF6.svg)](https://react.dev/)

---

## 1. Executive Summary & Vision

Outpatient waiting rooms across clinics and hospital networks remain unpredictable, congested, and stressful. Traditional scheduling systems either rely on rigid static time slots or naive position multipliers (e.g. `Position × 15 min`), failing to account for:
1. Real-time active consultation duration and elapsed pacing
2. Clinician-specific historical pacing benchmarks and consultation variability
3. Scheduled doctor breaks and unexpected emergency delay reports
4. Complexity weighting across appointment types (comprehensive new patient vs rapid follow-up)
5. Punctuality, no-shows, and unscheduled walk-in surges

**ClinicQueue** transforms outpatient waiting into a transparent, measurable, and actively managed process. It combines **Adaptive Wait-Time Predictions with plain-language explanations**, a **Clinic-Day Digital Twin (Simulator)** for operational decision support, and **real-time role-based queue orchestration**.

---

## 2. Core Architectural Innovations

### A. Adaptive Wait-Time Prediction Engine
Unlike naive static calculators, the prediction engine dynamically computes:
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
  3. *Reduced Staffing* (1 doctor on duty with 35m delay)
  4. *Consultation Delays* (emergency delay buffers)
- **Interactive Controls**: Real-time sliders for appointment volume, walk-in rate, doctor availability, break duration, and unexpected delays.
- **Strict Data Isolation**: Running hypothetical simulations does not alter live clinic appointments, patient records, or active queues.

### C. Patient Appointment and Consultation Tracker
A comprehensive patient visit timeline featuring a 5-stage progression stepper:
$$\text{Booked} \longrightarrow \text{Checked In} \longrightarrow \text{Waiting in Queue} \longrightarrow \text{In Consultation} \longrightarrow \text{Completed}$$
- Real-time queue position and calibrated estimated wait time
- Summary cards (Upcoming, Check-In Ready, In Progress, Completed, Cancelled)
- Search and status filters (Upcoming, Today, Past Visits, Cancelled)
- Digital prescriptions (Rx) with print/PDF layout and cashless health card profile

---

## 3. Exactly Three User-Facing Roles

ClinicQueue provides three dedicated role portals with server-enforced permissions:

| Role Portal | Context & Key Workflows |
| :--- | :--- |
| **Patient Portal** (`/patient`) | Appointment booking, arrival check-in, visual 5-stage visit tracker, live queue position, adaptive wait estimate, digital prescriptions, and cashless health card profile. |
| **Receptionist Portal** (`/reception`) | Daily clinic schedule, walk-in registration, reference-based express check-in, priority flags (elderly, mobility), doctor availability controls, clinic-wide analytics, and Digital Twin simulation. |
| **Doctor Portal** (`/doctor`) | Assigned queue, live consultation room with elapsed timer, consultation completion with duration and operational notes, break management, and delay reporting. |

---

## 4. Midnight & Violet Design System

The platform implements a premium healthcare SaaS aesthetic:
- **Dark Theme (Default on First Visit)**: `#111118` canvas, `#15151F` navigation, `#1B1B28` cards, `#343347` borders, and `#8B5CF6` primary violet accents.
- **Light Theme**: `#F7F7FB` canvas, `#FFFFFF` cards, `#DDD9E9` borders, and `#6D28D9` deep violet accents.
- **Persistent Theme Toggle**: Moon/Sun switcher in top bar, persisted in `localStorage`.
- **Typography**: Google's **Atkinson Hyperlegible** font designed for clinical readability.
- **Micro-interactions**: Purposeful transitions respecting `prefers-reduced-motion`.

---

## 5. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6 (HashRouter for static host resilience), Recharts, Lucide React, Atkinson Hyperlegible Typography.
- **Backend**: Python 3.12, Flask REST API, Flask-CORS, Pydantic, Argon2id/Bcrypt password hashing.
- **Database Layer**: MongoDB Atlas compatible persistence with PyMongo, PLUS a zero-dependency **Local Embedded Persistent Storage Engine** that functions offline with identical PyMongo APIs.
- **Testing**: Automated Pytest suite (15 comprehensive test suites passing 100%).
- **Deployment**: Automatic GitHub Pages deployment via GitHub Actions (`.github/workflows/deploy-pages.yml`), Vercel configuration (`vercel.json`), and Render API configuration (`render.yaml`).

---

## 6. Preloaded Synthetic Dataset

The seed generator (`backend/seed.py`) deterministically populates:
- **8 Outpatient Facilities**: MetroCare Apex (Delhi), Apollo Heritage (Bengaluru), Fortis Horizon (Mumbai), Manipal City Centre (Hyderabad), CarePoint SuperSpecialty (Chennai), Sterling Global (Kolkata), Greenfield Community (Pune), Apex Family (Ahmedabad).
- **38 Outpatient Doctors**: Spread across 16 specialties (Cardiology, Orthopedics, Pediatrics, Neurology, Dermatology, General Medicine, ENT, etc.).
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

---

## 8. Automated Testing

Run the full backend test suite:
```powershell
$env:PYTHONPATH = "."
.\venv\Scripts\python -m pytest tests/test_backend.py -v
```
**Results**: `15 passed in ~5.2s (100% pass rate)`.

To verify frontend production build:
```powershell
cd frontend
npm run build:node
```
**Results**: Production build succeeds in ~16s (`dist/index.html`, `dist/assets/index.js`, `dist/assets/index.css` generated with 0 errors).
