import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from backend.config import Config
from backend.database import get_db, serialize_doc

# Nominal department baseline durations (in minutes)
DEFAULT_DEPT_SLOT_MINUTES = {
    "Cardiology": 20,
    "Neurology": 20,
    "Orthopedics": 15,
    "Pediatrics": 15,
    "General Medicine": 15,
    "Dermatology": 12,
    "ENT": 12,
    "Ophthalmology": 15,
    "Gynecology": 18,
    "Oncology": 25,
    "Psychiatry": 30,
    "Default": 15
}

# Type multipliers
APPOINTMENT_TYPE_WEIGHTS = {
    "new_patient": 1.25,     # Initial consultations take ~25% longer
    "follow_up": 0.85,       # Follow-ups take ~15% less
    "quick_review": 0.60,    # Fast test result review
    "standard": 1.0,
    "walk_in": 1.10          # Walk-ins need intake checks
}

def get_doctor_historical_duration(doctor_id: str, dept_name: Optional[str] = None) -> Tuple[float, int, str]:
    """
    Computes median consultation duration for a doctor from completed consultations.
    Falls back to department median, then system default.
    Returns: (duration_minutes, sample_size, source_level)
    """
    db = get_db()
    # Query completed consultations for this doctor
    consultations = list(db["consultations"].find({
        "doctor_id": str(doctor_id),
        "status": "completed",
        "duration_minutes": {"$gt": 0}
    }))

    if len(consultations) >= 5:
        durations = sorted([c["duration_minutes"] for c in consultations if c.get("duration_minutes")])
        mid = len(durations) // 2
        median_val = durations[mid] if len(durations) % 2 != 0 else (durations[mid - 1] + durations[mid]) / 2.0
        return round(median_val, 1), len(durations), "doctor_history"

    # Fallback to department median if available
    if dept_name:
        dept_consults = list(db["consultations"].find({
            "department_name": dept_name,
            "status": "completed",
            "duration_minutes": {"$gt": 0}
        }))
        if len(dept_consults) >= 5:
            durations = sorted([c["duration_minutes"] for c in dept_consults if c.get("duration_minutes")])
            mid = len(durations) // 2
            median_val = durations[mid] if len(durations) % 2 != 0 else (durations[mid - 1] + durations[mid]) / 2.0
            return round(median_val, 1), len(durations), "department_history"

    baseline = DEFAULT_DEPT_SLOT_MINUTES.get(dept_name, DEFAULT_DEPT_SLOT_MINUTES["Default"])
    return float(baseline), len(consultations), "system_baseline"

def calculate_adaptive_wait_time(
    appointment_id: str,
    doctor_id: str,
    org_id: str,
    current_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Core adaptive prediction algorithm.
    Calculates estimated wait in minutes, estimated consultation start time,
    range of uncertainty, and explanatory bullet points.
    """
    db = get_db()
    now = current_time or datetime.now(timezone.utc)
    
    # Fetch doctor and department info
    doctor = db["doctors"].find_one({"_id": str(doctor_id)}) or {}
    dept_name = doctor.get("department_name", "General Medicine")
    doc_delay_mins = float(doctor.get("reported_delay_minutes", 0))
    is_on_break = bool(doctor.get("is_on_break", False))
    break_remaining_mins = float(doctor.get("break_remaining_minutes", 0)) if is_on_break else 0.0

    target_appt = db["appointments"].find_one({"_id": str(appointment_id)})
    if not target_appt:
        return {
            "predicted_wait_minutes": 15,
            "predicted_start_time": (now + timedelta(minutes=15)).isoformat(),
            "uncertainty_window_minutes": 5,
            "explanations": ["Default appointment baseline applied."],
            "model_version": "adaptive-v1.0"
        }

    # Historical doctor stats
    doc_base_duration, sample_count, stat_source = get_doctor_historical_duration(doctor_id, dept_name)
    explanations: List[str] = []

    # 1. Active consultation remaining time
    active_consultation = db["consultations"].find_one({
        "doctor_id": str(doctor_id),
        "status": "in_progress"
    })

    remaining_active_mins = 0.0
    if active_consultation:
        started_at_str = active_consultation.get("started_at")
        if started_at_str:
            try:
                started_at = datetime.fromisoformat(started_at_str.replace("Z", "+00:00"))
                elapsed_mins = max(0.0, (now - started_at).total_seconds() / 60.0)
                # Remaining is expected duration minus elapsed, clamped between 2 mins and doc_base_duration
                remaining_active_mins = max(2.0, doc_base_duration - elapsed_mins)
                explanations.append(f"1 consultation currently in progress (~{int(remaining_active_mins)}m remaining).")
            except Exception:
                remaining_active_mins = doc_base_duration * 0.5
                explanations.append(f"1 consultation currently in progress (~{int(remaining_active_mins)}m remaining).")
        else:
            remaining_active_mins = doc_base_duration * 0.5
            explanations.append("1 consultation in progress.")

    # 2. Get active waiting queue ahead of this appointment
    # Eligibility: checked_in or waiting, assigned to this doctor, not completed/cancelled/no-show/in-progress
    active_queue = list(db["queue_entries"].find({
        "doctor_id": str(doctor_id),
        "status": {"$in": ["checked_in", "waiting"]}
    }).sort([("priority_score", -1), ("check_in_time", 1)]))

    # Find position of target appointment in active queue
    patients_ahead = []
    target_found = False
    for entry in active_queue:
        if str(entry.get("appointment_id")) == str(appointment_id):
            target_found = True
            break
        # Do not count self or patients in consultation
        patients_ahead.append(entry)

    queue_ahead_count = len(patients_ahead)
    if queue_ahead_count > 0:
        explanations.append(f"{queue_ahead_count} eligible {'patient is' if queue_ahead_count == 1 else 'patients are'} ahead of you in queue.")
    elif not active_consultation:
        explanations.append("You are first in queue; consultation will begin as soon as the doctor calls you.")

    # 3. Sum up expected durations for patients ahead
    sum_patients_ahead_mins = 0.0
    for entry in patients_ahead:
        appt_type = entry.get("appointment_type", "standard")
        weight = APPOINTMENT_TYPE_WEIGHTS.get(appt_type, 1.0)
        # Priority adjustment
        priority_flags = entry.get("priority_flags", [])
        prio_adj = 0.95 if "elderly" in priority_flags or "mobility" in priority_flags else 1.0
        sum_patients_ahead_mins += (doc_base_duration * weight * prio_adj)

    # 4. Breaks and Doctor Delays
    delay_and_break_mins = 0.0
    if is_on_break:
        effective_break = max(5.0, break_remaining_mins)
        delay_and_break_mins += effective_break
        explanations.append(f"Doctor is currently on a break (~{int(effective_break)}m remaining).")

    if doc_delay_mins > 0:
        delay_and_break_mins += doc_delay_mins
        explanations.append(f"Doctor reported an operational delay of +{int(doc_delay_mins)}m.")

    # 5. Doctor performance context explanation
    dept_benchmark = DEFAULT_DEPT_SLOT_MINUTES.get(dept_name, 15)
    if stat_source == "doctor_history":
        diff = round(doc_base_duration - dept_benchmark, 1)
        if abs(diff) >= 2.0:
            direction = "longer" if diff > 0 else "faster"
            explanations.append(f"Dr. {doctor.get('name', 'assigned')} paces consultations ~{abs(int(diff))}m {direction} than the {dept_name} average.")
    elif stat_source == "department_history":
        explanations.append(f"Estimate calibrated from recent {dept_name} historical throughput.")
    else:
        explanations.append("Initial estimate using standard hospital specialty guidelines.")

    # Total predicted wait
    total_wait_mins = remaining_active_mins + sum_patients_ahead_mins + delay_and_break_mins
    
    # If already checked in and first, minimum wait is remaining active consultation or 1 min
    if queue_ahead_count == 0 and not active_consultation and not is_on_break:
        total_wait_mins = 2.0

    predicted_wait_rounded = max(1, int(round(total_wait_mins)))
    
    # Uncertainty window (+/- 20% or minimum 3-5 mins)
    uncertainty = max(3, int(round(predicted_wait_rounded * 0.20)))

    predicted_start = now + timedelta(minutes=predicted_wait_rounded)

    prediction_result = {
        "appointment_id": str(appointment_id),
        "doctor_id": str(doctor_id),
        "organization_id": str(org_id),
        "predicted_wait_minutes": predicted_wait_rounded,
        "predicted_start_time": predicted_start.isoformat(),
        "uncertainty_window_minutes": uncertainty,
        "patients_ahead_count": queue_ahead_count,
        "active_consultation_in_progress": bool(active_consultation),
        "doctor_median_duration": doc_base_duration,
        "model_version": "adaptive-v1.0",
        "timestamp": now.isoformat(),
        "explanations": explanations
    }

    # Store snapshot in database for auditable evaluation
    try:
        db["prediction_snapshots"].insert_one({
            "appointment_id": str(appointment_id),
            "doctor_id": str(doctor_id),
            "organization_id": str(org_id),
            "predicted_wait_minutes": predicted_wait_rounded,
            "predicted_start_time": predicted_start.isoformat(),
            "baseline_wait_minutes": max(1, queue_ahead_count * dept_benchmark),
            "patients_ahead_count": queue_ahead_count,
            "has_active_consultation": bool(active_consultation),
            "model_version": "adaptive-v1.0",
            "created_at": now.isoformat(),
            "actual_wait_minutes": None,
            "actual_start_time": None,
            "absolute_error": None
        })
    except Exception as e:
        print(f"[Prediction] Error storing snapshot: {e}")

    return prediction_result

def calculate_simple_baseline(queue_position: int, dept_name: Optional[str] = None) -> int:
    """Standard naive baseline: queue position * slot duration."""
    nominal = DEFAULT_DEPT_SLOT_MINUTES.get(dept_name, 15)
    return max(0, queue_position * nominal)

def evaluate_prediction_accuracy(organization_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluates MAE, Median Absolute Error, sample count, and baseline comparisons
    using prediction snapshots that have actual recorded consultation start outcomes.
    """
    db = get_db()
    query = {
        "actual_wait_minutes": {"$ne": None},
        "predicted_wait_minutes": {"$ne": None}
    }
    if organization_id:
        query["organization_id"] = str(organization_id)

    snapshots = list(db["prediction_snapshots"].find(query))

    if not snapshots:
        return {
            "status": "insufficient_data",
            "sample_size": 0,
            "message": "No completed consultations with recorded prediction snapshots found for evaluation.",
            "adaptive_model": {"mae": 0.0, "median_ae": 0.0, "p90_ae": 0.0},
            "baseline_model": {"mae": 0.0, "median_ae": 0.0, "p90_ae": 0.0},
            "improvement_pct": 0.0,
            "by_department": [],
            "by_doctor": []
        }

    adaptive_errors = []
    baseline_errors = []
    dept_errors: Dict[str, List[float]] = {}
    doc_errors: Dict[str, List[float]] = {}

    for s in snapshots:
        act = float(s["actual_wait_minutes"])
        pred = float(s["predicted_wait_minutes"])
        base = float(s.get("baseline_wait_minutes", 15))
        
        err_adaptive = abs(pred - act)
        err_baseline = abs(base - act)
        
        adaptive_errors.append(err_adaptive)
        baseline_errors.append(err_baseline)

        # Lookup doctor / department info for breakdown
        doc_id = s.get("doctor_id")
        if doc_id:
            doc_errors.setdefault(str(doc_id), []).append(err_adaptive)
            # Find dept
            doc = db["doctors"].find_one({"_id": str(doc_id)})
            if doc:
                dept = doc.get("department_name", "General")
                dept_errors.setdefault(dept, []).append(err_adaptive)

    # Calculate metrics
    adaptive_mae = sum(adaptive_errors) / len(adaptive_errors)
    baseline_mae = sum(baseline_errors) / len(baseline_errors)

    sorted_ad = sorted(adaptive_errors)
    sorted_base = sorted(baseline_errors)
    mid = len(sorted_ad) // 2
    adaptive_median = sorted_ad[mid] if len(sorted_ad) % 2 != 0 else (sorted_ad[mid - 1] + sorted_ad[mid]) / 2.0
    baseline_median = sorted_base[mid] if len(sorted_base) % 2 != 0 else (sorted_base[mid - 1] + sorted_base[mid]) / 2.0

    p90_idx = int(math.ceil(0.9 * len(sorted_ad))) - 1
    adaptive_p90 = sorted_ad[max(0, p90_idx)]

    improvement = round(((baseline_mae - adaptive_mae) / baseline_mae) * 100.0, 1) if baseline_mae > 0 else 0.0

    # Department breakdown
    by_department = []
    for dept, errs in dept_errors.items():
        if len(errs) >= 2:
            by_department.append({
                "department": dept,
                "samples": len(errs),
                "mae": round(sum(errs) / len(errs), 1),
                "median_ae": round(sorted(errs)[len(errs) // 2], 1)
            })

    # Doctor breakdown (top 5 by sample count)
    by_doctor = []
    for doc_id, errs in doc_errors.items():
        if len(errs) >= 3:
            doc = db["doctors"].find_one({"_id": str(doc_id)}) or {}
            by_doctor.append({
                "doctor_id": doc_id,
                "doctor_name": doc.get("name", f"Doctor {doc_id[:6]}"),
                "department": doc.get("department_name", ""),
                "samples": len(errs),
                "mae": round(sum(errs) / len(errs), 1)
            })

    return {
        "status": "evaluated",
        "sample_size": len(snapshots),
        "adaptive_model": {
            "name": "ClinicQueue Adaptive Engine v1.0",
            "mae": round(adaptive_mae, 1),
            "median_ae": round(adaptive_median, 1),
            "p90_ae": round(adaptive_p90, 1)
        },
        "baseline_model": {
            "name": "Traditional Fixed Slot Baseline (Queue Pos * 15m)",
            "mae": round(baseline_mae, 1),
            "median_ae": round(baseline_median, 1)
        },
        "improvement_pct": improvement,
        "is_outperforming_baseline": adaptive_mae < baseline_mae,
        "by_department": sorted(by_department, key=lambda x: x["samples"], reverse=True),
        "by_doctor": sorted(by_doctor, key=lambda x: x["samples"], reverse=True)
    }
