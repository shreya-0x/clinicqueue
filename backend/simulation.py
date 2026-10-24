import random
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional

def run_clinic_simulation(
    scenario_name: str = "custom",
    num_appointments: int = 30,
    walk_in_rate_pct: float = 15.0,
    duration_variance_pct: float = 20.0,
    num_doctors: int = 2,
    base_consultation_minutes: float = 15.0,
    break_duration_minutes: float = 30.0,
    late_arrival_rate_pct: float = 10.0,
    no_show_rate_pct: float = 8.0,
    doctor_delay_minutes: float = 0.0,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Deterministic Clinic-Day Digital Twin and Simulator.
    Simulates discrete arrival, check-in, queuing, and consultation events
    from 09:00 AM to 05:00 PM (480 minutes).
    """
    rng = random.Random(seed)

    # Simulation timeline parameters (in minutes from 09:00 AM = minute 0)
    TOTAL_MINUTES = 480 # 8 hours (09:00 - 17:00)
    BREAK_START = 210   # 12:30 PM (lunch break)
    BREAK_END = BREAK_START + break_duration_minutes

    # Generate scheduled appointments
    patients = []
    # Slots spaced roughly every base_consultation_minutes / num_doctors
    slot_interval = max(5.0, (base_consultation_minutes / max(1, num_doctors)))
    
    current_slot = 0.0
    patient_id = 1
    
    while len(patients) < num_appointments and current_slot < (TOTAL_MINUTES - 60):
        # Determine if no-show
        is_no_show = rng.random() < (no_show_rate_pct / 100.0)
        
        # Determine arrival time (punctual, early, or late)
        is_late = rng.random() < (late_arrival_rate_pct / 100.0)
        arrival_offset = rng.uniform(10.0, 30.0) if is_late else rng.uniform(-10.0, 5.0)
        actual_arrival = max(0.0, current_slot + arrival_offset)

        # Base duration with variance
        variance_factor = (duration_variance_pct / 100.0)
        duration_multiplier = rng.uniform(1.0 - variance_factor, 1.0 + (variance_factor * 1.5))
        consult_duration = max(5.0, round(base_consultation_minutes * duration_multiplier, 1))

        if not is_no_show:
            patients.append({
                "id": f"P-{patient_id:03d}",
                "type": "scheduled",
                "scheduled_slot": current_slot,
                "arrival_time": actual_arrival,
                "expected_duration": consult_duration,
                "is_late": is_late
            })
            patient_id += 1

        current_slot += slot_interval

    # Add walk-in patients dynamically throughout morning and afternoon
    total_walk_ins = int(round(len(patients) * (walk_in_rate_pct / 100.0)))
    for _ in range(total_walk_ins):
        walk_in_arrival = rng.uniform(15.0, TOTAL_MINUTES - 45.0)
        variance_factor = (duration_variance_pct / 100.0)
        consult_duration = max(6.0, round(base_consultation_minutes * 1.15 * rng.uniform(1.0 - variance_factor, 1.0 + variance_factor), 1))
        patients.append({
            "id": f"WI-{patient_id:03d}",
            "type": "walk_in",
            "scheduled_slot": walk_in_arrival,
            "arrival_time": walk_in_arrival,
            "expected_duration": consult_duration,
            "is_late": False
        })
        patient_id += 1

    # Sort patients by actual arrival time (or scheduled slot priority)
    patients.sort(key=lambda p: (p["arrival_time"], p["scheduled_slot"]))

    # Doctors state: each doctor tracks when they become free
    # Account for doctor initial delay (e.g. emergency morning round)
    doctor_free_time = [doctor_delay_minutes for _ in range(num_doctors)]
    doctor_busy_minutes = [0.0 for _ in range(num_doctors)]

    completed_patients = []
    unserved_patients = []
    hourly_queue_counts = [0] * 8 # 9am to 5pm (8 hours)

    # Discrete event queue
    waiting_queue = []
    current_time = 0.0

    # Advance time in 1-minute steps
    for minute in range(TOTAL_MINUTES):
        # 1. New arrivals check in
        while patients and patients[0]["arrival_time"] <= minute:
            waiting_queue.append(patients.pop(0))

        # Record hourly congestion snapshot at top of each hour
        if minute % 60 == 0:
            hour_idx = minute // 60
            if hour_idx < 8:
                hourly_queue_counts[hour_idx] = len(waiting_queue)

        # 2. Check each doctor
        for doc_idx in range(num_doctors):
            # Check if doctor is on break
            if BREAK_START <= minute < BREAK_END:
                continue

            # If doctor is currently free and patient is waiting
            if doctor_free_time[doc_idx] <= minute and waiting_queue:
                patient = waiting_queue.pop(0)
                
                # Check-in to consultation start = wait time
                wait_time = max(0.0, minute - patient["arrival_time"])
                start_time = minute
                finish_time = start_time + patient["expected_duration"]
                
                doctor_free_time[doc_idx] = finish_time
                doctor_busy_minutes[doc_idx] += patient["expected_duration"]

                patient["wait_time"] = round(wait_time, 1)
                patient["start_time"] = round(start_time, 1)
                patient["finish_time"] = round(finish_time, 1)
                patient["doctor_id"] = doc_idx + 1
                completed_patients.append(patient)

    # Any patients remaining in waiting_queue after 17:00 are unserved/backlogged
    unserved_patients = list(waiting_queue)

    # Aggregate statistics
    waits = [p["wait_time"] for p in completed_patients]
    if waits:
        avg_wait = round(sum(waits) / len(waits), 1)
        sorted_waits = sorted(waits)
        mid = len(sorted_waits) // 2
        median_wait = round(sorted_waits[mid] if len(sorted_waits) % 2 != 0 else (sorted_waits[mid - 1] + sorted_waits[mid]) / 2.0, 1)
        max_wait = round(max(waits), 1)
        p90_wait = round(sorted_waits[min(len(sorted_waits)-1, int(len(sorted_waits) * 0.9))], 1)
    else:
        avg_wait = 0.0
        median_wait = 0.0
        max_wait = 0.0
        p90_wait = 0.0

    total_possible_doc_mins = num_doctors * (TOTAL_MINUTES - break_duration_minutes)
    total_busy = sum(doctor_busy_minutes)
    utilization_pct = round(min(100.0, (total_busy / max(1.0, total_possible_doc_mins)) * 100.0), 1)

    # Hourly congestion labels
    hourly_congestion = [
        {"time": "09:00", "hour": 9, "waiting": hourly_queue_counts[0]},
        {"time": "10:00", "hour": 10, "waiting": hourly_queue_counts[1]},
        {"time": "11:00", "hour": 11, "waiting": hourly_queue_counts[2]},
        {"time": "12:00", "hour": 12, "waiting": hourly_queue_counts[3]},
        {"time": "13:00", "hour": 13, "waiting": hourly_queue_counts[4]},
        {"time": "14:00", "hour": 14, "waiting": hourly_queue_counts[5]},
        {"time": "15:00", "hour": 15, "waiting": hourly_queue_counts[6]},
        {"time": "16:00", "hour": 16, "waiting": hourly_queue_counts[7]},
    ]

    return {
        "scenario_name": scenario_name,
        "is_simulation": True,
        "parameters": {
            "num_appointments": num_appointments,
            "walk_in_rate_pct": walk_in_rate_pct,
            "duration_variance_pct": duration_variance_pct,
            "num_doctors": num_doctors,
            "base_consultation_minutes": base_consultation_minutes,
            "break_duration_minutes": break_duration_minutes,
            "late_arrival_rate_pct": late_arrival_rate_pct,
            "no_show_rate_pct": no_show_rate_pct,
            "doctor_delay_minutes": doctor_delay_minutes
        },
        "results": {
            "patients_served": len(completed_patients),
            "unserved_backlog": len(unserved_patients),
            "total_demand": len(completed_patients) + len(unserved_patients),
            "average_wait_minutes": avg_wait,
            "median_wait_minutes": median_wait,
            "max_wait_minutes": max_wait,
            "p90_wait_minutes": p90_wait,
            "doctor_utilization_pct": utilization_pct,
            "hourly_congestion": hourly_congestion,
            "sample_patients": completed_patients[:10]
        }
    }

def get_preset_scenarios() -> Dict[str, Dict[str, Any]]:
    """Returns the three defined preset scenarios."""
    return {
        "normal_day": {
            "name": "Normal Balanced Clinic Day",
            "description": "Standard operating baseline with scheduled appointments, standard 15% walk-ins, and 2 active doctors.",
            "params": {
                "num_appointments": 28,
                "walk_in_rate_pct": 15.0,
                "duration_variance_pct": 15.0,
                "num_doctors": 2,
                "base_consultation_minutes": 15.0,
                "break_duration_minutes": 30.0,
                "late_arrival_rate_pct": 8.0,
                "no_show_rate_pct": 6.0,
                "doctor_delay_minutes": 0.0
            }
        },
        "surge_congestion": {
            "name": "High-Demand Surge Congestion",
            "description": "Heavy outpatient walk-in surge (35%), complex cases with 40% duration variance, leading to afternoon bottleneck.",
            "params": {
                "num_appointments": 38,
                "walk_in_rate_pct": 35.0,
                "duration_variance_pct": 40.0,
                "num_doctors": 2,
                "base_consultation_minutes": 16.0,
                "break_duration_minutes": 30.0,
                "late_arrival_rate_pct": 20.0,
                "no_show_rate_pct": 4.0,
                "doctor_delay_minutes": 0.0
            }
        },
        "staffing_delay": {
            "name": "Reduced Staffing & Doctor Emergency Delay",
            "description": "Only 1 doctor available on duty, who arrives 35 minutes late due to an emergency ward round.",
            "params": {
                "num_appointments": 24,
                "walk_in_rate_pct": 10.0,
                "duration_variance_pct": 20.0,
                "num_doctors": 1,
                "base_consultation_minutes": 15.0,
                "break_duration_minutes": 20.0,
                "late_arrival_rate_pct": 12.0,
                "no_show_rate_pct": 5.0,
                "doctor_delay_minutes": 35.0
            }
        }
    }
