import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from backend.database import get_db, serialize_doc
from backend.prediction import calculate_adaptive_wait_time

ALLOWED_TRANSITIONS = {
    "booked": ["checked_in", "cancelled", "no_show", "rescheduled"],
    "checked_in": ["waiting", "in_consultation", "cancelled", "no_show"],
    "waiting": ["in_consultation", "cancelled", "no_show", "rescheduled"],
    "in_consultation": ["completed", "cancelled"],
    "completed": [],
    "cancelled": [],
    "no_show": [],
    "rescheduled": ["checked_in", "cancelled"]
}

PRIORITY_FLAG_SCORES = {
    "standard": 0,
    "pediatric": 8,
    "elderly": 10,
    "mobility": 15,
    "urgent_triage": 25
}

def record_audit_log(
    user_id: Optional[str],
    organization_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: str,
    details: Dict[str, Any]
):
    """Logs security and operational actions into audit_logs collection."""
    db = get_db()
    try:
        db["audit_logs"].insert_one({
            "user_id": str(user_id) if user_id else "system",
            "organization_id": str(organization_id) if organization_id else "global",
            "action": action,
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"[Audit] Failed to record log: {e}")

def create_notification(
    user_id: str,
    organization_id: str,
    title: str,
    message: str,
    notification_type: str = "queue_update",
    metadata: Optional[Dict[str, Any]] = None
):
    """Creates in-app notification."""
    db = get_db()
    try:
        db["notifications"].insert_one({
            "user_id": str(user_id),
            "organization_id": str(organization_id),
            "title": title,
            "message": message,
            "type": notification_type,
            "metadata": metadata or {},
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"[Notification] Failed to create: {e}")

def check_in_patient(
    appointment_id: str,
    actor_id: str,
    priority_flags: Optional[List[str]] = None
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Checks in a patient for an appointment.
    Prevents duplicate check-ins, validates eligibility, creates queue_entry.
    """
    db = get_db()
    appt = db["appointments"].find_one({"_id": str(appointment_id)})
    if not appt:
        return False, "Appointment not found.", None

    current_status = appt.get("status", "booked")
    if current_status in ["checked_in", "waiting", "in_consultation"]:
        return False, f"Patient is already checked in (current status: {current_status}).", None
    if current_status == "completed":
        return False, "Cannot check in a completed consultation.", None
    if current_status == "cancelled":
        return False, "Cannot check in a cancelled appointment.", None

    now = datetime.now(timezone.utc).isoformat()
    flags = priority_flags or appt.get("priority_flags", [])
    prio_score = sum(PRIORITY_FLAG_SCORES.get(f, 0) for f in flags)

    # Update appointment status
    db["appointments"].update_one(
        {"_id": str(appointment_id)},
        {"$set": {
            "status": "checked_in",
            "checked_in_at": now,
            "priority_flags": flags,
            "priority_score": prio_score
        }}
    )

    # Upsert queue entry
    existing_queue = db["queue_entries"].find_one({"appointment_id": str(appointment_id)})
    if existing_queue:
        db["queue_entries"].update_one(
            {"_id": existing_queue["_id"]},
            {"$set": {
                "status": "checked_in",
                "check_in_time": now,
                "priority_flags": flags,
                "priority_score": prio_score
            }}
        )
        queue_id = existing_queue["_id"]
    else:
        res = db["queue_entries"].insert_one({
            "appointment_id": str(appointment_id),
            "patient_id": str(appt.get("patient_id")),
            "patient_name": appt.get("patient_name"),
            "doctor_id": str(appt.get("doctor_id")),
            "doctor_name": appt.get("doctor_name"),
            "organization_id": str(appt.get("organization_id")),
            "department_name": appt.get("department_name"),
            "appointment_type": appt.get("appointment_type", "standard"),
            "status": "checked_in",
            "check_in_time": now,
            "priority_flags": flags,
            "priority_score": prio_score,
            "created_at": now
        })
        queue_id = res.inserted_id

    # Record queue event
    db["queue_events"].insert_one({
        "appointment_id": str(appointment_id),
        "doctor_id": str(appt.get("doctor_id")),
        "event_type": "checked_in",
        "actor_id": str(actor_id),
        "timestamp": now,
        "details": {"priority_flags": flags, "priority_score": prio_score}
    })

    # Record audit log
    record_audit_log(
        user_id=actor_id,
        organization_id=appt.get("organization_id"),
        action="check_in",
        entity_type="appointment",
        entity_id=str(appointment_id),
        details={"priority_flags": flags}
    )

    # Notification to patient
    create_notification(
        user_id=str(appt.get("patient_id")),
        organization_id=str(appt.get("organization_id")),
        title="Check-In Confirmed",
        message=f"You are checked in for Dr. {appt.get('doctor_name')}. Your position in the live queue has been assigned.",
        notification_type="check_in"
    )

    # Calculate initial prediction
    prediction = calculate_adaptive_wait_time(
        appointment_id=str(appointment_id),
        doctor_id=str(appt.get("doctor_id")),
        org_id=str(appt.get("organization_id"))
    )

    return True, "Patient checked in successfully.", {
        "queue_id": str(queue_id),
        "appointment_id": str(appointment_id),
        "prediction": prediction
    }

def start_consultation(
    appointment_id: str,
    doctor_id: str,
    actor_id: str
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Doctor starts consultation.
    Validates state, transitions to in_consultation, records actual start timestamp,
    updates prediction evaluation records with actual wait time.
    """
    db = get_db()
    appt = db["appointments"].find_one({"_id": str(appointment_id)})
    if not appt:
        return False, "Appointment not found.", None

    if str(appt.get("doctor_id")) != str(doctor_id):
        return False, "This appointment is assigned to a different doctor.", None

    curr_status = appt.get("status")
    if curr_status not in ["checked_in", "waiting"]:
        return False, f"Cannot start consultation for appointment in '{curr_status}' state.", None

    # Check if doctor already has an in-progress consultation
    existing_in_progress = db["consultations"].find_one({
        "doctor_id": str(doctor_id),
        "status": "in_progress"
    })
    if existing_in_progress:
        return False, "You already have an active consultation in progress. Please complete it first.", None

    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()

    # Calculate actual waiting time if check-in time exists
    check_in_str = appt.get("checked_in_at")
    actual_wait_mins = None
    if check_in_str:
        try:
            check_in_dt = datetime.fromisoformat(check_in_str.replace("Z", "+00:00"))
            actual_wait_mins = round(max(0.0, (now_dt - check_in_dt).total_seconds() / 60.0), 1)
        except Exception:
            actual_wait_mins = 15.0

    # Update appointment
    db["appointments"].update_one(
        {"_id": str(appointment_id)},
        {"$set": {
            "status": "in_consultation",
            "consultation_started_at": now_iso,
            "actual_wait_minutes": actual_wait_mins
        }}
    )

    # Update queue entry
    db["queue_entries"].update_one(
        {"appointment_id": str(appointment_id)},
        {"$set": {
            "status": "in_consultation",
            "started_at": now_iso
        }}
    )

    # Create consultation record
    consult_res = db["consultations"].insert_one({
        "appointment_id": str(appointment_id),
        "patient_id": str(appt.get("patient_id")),
        "patient_name": appt.get("patient_name"),
        "doctor_id": str(doctor_id),
        "doctor_name": appt.get("doctor_name"),
        "department_name": appt.get("department_name"),
        "organization_id": str(appt.get("organization_id")),
        "started_at": now_iso,
        "completed_at": None,
        "status": "in_progress",
        "notes": "",
        "created_at": now_iso
    })

    # Update prediction snapshots with actual outcome for evaluation
    if actual_wait_mins is not None:
        snapshots = list(db["prediction_snapshots"].find({
            "appointment_id": str(appointment_id),
            "actual_wait_minutes": None
        }))
        for snap in snapshots:
            pred_wait = float(snap.get("predicted_wait_minutes", 15))
            err = round(abs(pred_wait - actual_wait_mins), 1)
            db["prediction_snapshots"].update_one(
                {"_id": snap["_id"]},
                {"$set": {
                    "actual_wait_minutes": actual_wait_mins,
                    "actual_start_time": now_iso,
                    "absolute_error": err
                }}
            )

    # Record event and audit
    db["queue_events"].insert_one({
        "appointment_id": str(appointment_id),
        "doctor_id": str(doctor_id),
        "event_type": "consultation_started",
        "actor_id": str(actor_id),
        "timestamp": now_iso,
        "details": {"actual_wait_minutes": actual_wait_mins}
    })

    record_audit_log(
        user_id=actor_id,
        organization_id=appt.get("organization_id"),
        action="start_consultation",
        entity_type="consultation",
        entity_id=str(consult_res.inserted_id),
        details={"appointment_id": str(appointment_id), "actual_wait_minutes": actual_wait_mins}
    )

    # Notify patient
    create_notification(
        user_id=str(appt.get("patient_id")),
        organization_id=str(appt.get("organization_id")),
        title="Consultation Starting",
        message=f"Dr. {appt.get('doctor_name')} is ready for you in Consultation Room.",
        notification_type="consultation_start"
    )

    return True, "Consultation started.", {
        "consultation_id": str(consult_res.inserted_id),
        "appointment_id": str(appointment_id),
        "actual_wait_minutes": actual_wait_mins
    }

def complete_consultation(
    consultation_id: str,
    doctor_id: str,
    actor_id: str,
    notes: str = "",
    duration_minutes: Optional[float] = None
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Doctor completes consultation.
    Records duration, non-sensitive notes, releases queue slot.
    """
    db = get_db()
    consult = db["consultations"].find_one({"_id": str(consultation_id)})
    if not consult:
        return False, "Consultation record not found.", None

    if str(consult.get("doctor_id")) != str(doctor_id):
        return False, "You are not authorized to complete another doctor's consultation.", None

    if consult.get("status") == "completed":
        return False, "Consultation is already completed.", None

    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()

    calc_duration = duration_minutes
    if calc_duration is None:
        started_at_str = consult.get("started_at")
        if started_at_str:
            try:
                start_dt = datetime.fromisoformat(started_at_str.replace("Z", "+00:00"))
                calc_duration = round(max(1.0, (now_dt - start_dt).total_seconds() / 60.0), 1)
            except Exception:
                calc_duration = 15.0
        else:
            calc_duration = 15.0

    # Update consultation
    db["consultations"].update_one(
        {"_id": str(consultation_id)},
        {"$set": {
            "status": "completed",
            "completed_at": now_iso,
            "duration_minutes": calc_duration,
            "notes": notes
        }}
    )

    appt_id = consult.get("appointment_id")
    if appt_id:
        db["appointments"].update_one(
            {"_id": str(appt_id)},
            {"$set": {
                "status": "completed",
                "consultation_completed_at": now_iso,
                "consultation_duration_minutes": calc_duration
            }}
        )
        db["queue_entries"].update_one(
            {"appointment_id": str(appt_id)},
            {"$set": {
                "status": "completed",
                "completed_at": now_iso
            }}
        )

    # Record event and audit
    db["queue_events"].insert_one({
        "appointment_id": str(appt_id),
        "doctor_id": str(doctor_id),
        "event_type": "consultation_completed",
        "actor_id": str(actor_id),
        "timestamp": now_iso,
        "details": {"duration_minutes": calc_duration}
    })

    record_audit_log(
        user_id=actor_id,
        organization_id=consult.get("organization_id"),
        action="complete_consultation",
        entity_type="consultation",
        entity_id=str(consultation_id),
        details={"duration_minutes": calc_duration}
    )

    # Notify patient
    create_notification(
        user_id=str(consult.get("patient_id")),
        organization_id=str(consult.get("organization_id")),
        title="Consultation Completed",
        message=f"Your visit with Dr. {consult.get('doctor_name')} has concluded. Thank you for using ClinicQueue.",
        notification_type="consultation_end"
    )

    return True, "Consultation completed successfully.", {
        "consultation_id": str(consultation_id),
        "duration_minutes": calc_duration
    }
