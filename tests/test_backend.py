import pytest
import json
from datetime import datetime, timezone
from backend.app import create_app
from backend.database import get_db
from backend.auth import hash_password, verify_password, generate_token, decode_token
from backend.prediction import calculate_adaptive_wait_time, evaluate_prediction_accuracy, calculate_simple_baseline
from backend.simulation import run_clinic_simulation, get_preset_scenarios
from backend.queue_manager import check_in_patient, start_consultation, complete_consultation

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "storage" in data
    assert data["storage"]["engine"] in ["mongodb", "local_store"]

def test_password_hashing():
    pwd = "HackathonPassword2026!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_token_generation_and_decoding():
    token = generate_token(user_id="user-123", role="doctor", organization_id="org-test")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["role"] == "doctor"
    assert payload["org_id"] == "org-test"

    # Corrupt token verification
    tampered_token = token[:-4] + "xyz1"
    assert decode_token(tampered_token) is None

def test_demo_auth_login(client):
    res = client.post("/api/auth/login", json={
        "email": "doctor.sharma@clinicqueue.demo",
        "password": "Demo123!"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "token" in data
    assert data["user"]["role"] == "doctor"
    assert data["user"]["email"] == "doctor.sharma@clinicqueue.demo"

def test_invalid_login(client):
    res = client.post("/api/auth/login", json={
        "email": "doctor.sharma@clinicqueue.demo",
        "password": "IncorrectPassword"
    })
    assert res.status_code == 401

def test_demo_role_switch(client):
    res = client.post("/api/auth/demo-switch", json={"role": "hospital_admin"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["role"] == "hospital_admin"
    assert data["user"]["email"] == "admin@metrocare.demo"

def test_patient_registration_and_isolation(client):
    unique_email = f"test.patient.{datetime.now().timestamp()}@example.com"
    res = client.post("/api/auth/register", json={
        "name": "Anand Kumar",
        "email": unique_email,
        "password": "SecurePassword123!",
        "phone": "+91 98111 22233"
    })
    assert res.status_code == 201
    data = res.get_json()
    token = data["token"]
    assert data["user"]["name"] == "Anand Kumar"

    # Patient should only see their own appointments
    appt_res = client.get("/api/appointments", headers={"Authorization": f"Bearer {token}"})
    assert appt_res.status_code == 200
    appts = appt_res.get_json()["appointments"]
    assert len(appts) == 0 # New patient has no appointments initially

def test_double_booking_prevention(client):
    # Login as patient
    login_res = client.post("/api/auth/demo-switch", json={"role": "patient"})
    token = login_res.get_json()["token"]

    booking_payload = {
        "doctor_id": "doc-mc-01",
        "appointment_date": "2026-11-15",
        "scheduled_time": "11:00",
        "appointment_type": "standard"
    }

    # First booking
    res1 = client.post("/api/appointments", json=booking_payload, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code in [201, 409] # 201 if first time, 409 if already booked

    # Second booking at same slot must return 409 Conflict
    res2 = client.post("/api/appointments", json=booking_payload, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 409
    assert "already has an appointment booked" in res2.get_json()["message"]

def test_queue_state_machine_flow(client):
    db = get_db()
    # Find an appointment to test
    doc = db["doctors"].find_one({"_id": "doc-mc-02"})
    patient = db["patients"].find_one({"_id": "pat-0005"})

    # Create fresh test appointment
    appt_id = f"test-flow-{datetime.now().timestamp()}"
    db["appointments"].insert_one({
        "_id": appt_id,
        "booking_reference": f"CQ-TEST-{appt_id[:6]}",
        "patient_id": str(patient["_id"]),
        "patient_name": patient["name"],
        "doctor_id": str(doc["_id"]),
        "doctor_name": doc["name"],
        "department_name": doc["department_name"],
        "organization_id": doc["organization_id"],
        "appointment_date": "2026-10-24",
        "scheduled_time": "14:30",
        "status": "booked"
    })

    # Step 1: Check in patient
    ok, msg, payload = check_in_patient(appt_id, actor_id="test-receptionist")
    assert ok is True
    assert "checked in successfully" in msg

    # Step 2: Prevent duplicate check in
    ok_dup, msg_dup, _ = check_in_patient(appt_id, actor_id="test-receptionist")
    assert ok_dup is False
    assert "already checked in" in msg_dup

    # Step 3: Start consultation
    ok_start, msg_start, consult_payload = start_consultation(appt_id, doctor_id=str(doc["_id"]), actor_id="test-doctor")
    assert ok_start is True
    consult_id = consult_payload["consultation_id"]

    # Step 4: Complete consultation
    ok_comp, msg_comp, _ = complete_consultation(consult_id, doctor_id=str(doc["_id"]), actor_id="test-doctor", notes="Test completed successfully.")
    assert ok_comp is True
    assert "completed successfully" in msg_comp

    # Verify final status
    final_appt = db["appointments"].find_one({"_id": appt_id})
    assert final_appt["status"] == "completed"
    assert final_appt["consultation_duration_minutes"] is not None

def test_adaptive_prediction_engine():
    db = get_db()
    # Test prediction on active live demo appointment
    pred = calculate_adaptive_wait_time(
        appointment_id="appt-today-demo-01",
        doctor_id="doc-mc-01",
        org_id="org-metrocare-01"
    )

    assert "predicted_wait_minutes" in pred
    assert pred["predicted_wait_minutes"] > 0
    assert "uncertainty_window_minutes" in pred
    assert "explanations" in pred
    assert len(pred["explanations"]) > 0
    # Explanations must be meaningful and grounded
    assert any("progress" in e or "eligible" in e or "queue" in e or "paces" in e for e in pred["explanations"])

def test_prediction_evaluation_metrics(client):
    res = client.get("/api/predictions/evaluation")
    assert res.status_code == 200
    data = res.get_json()["evaluation"]
    assert data["status"] == "evaluated"
    assert data["sample_size"] > 0
    assert "adaptive_model" in data
    assert "baseline_model" in data
    assert data["adaptive_model"]["mae"] > 0
    assert data["baseline_model"]["mae"] > 0
    # Demonstrates adaptive model outperforming fixed baseline
    assert data["adaptive_model"]["mae"] <= data["baseline_model"]["mae"]

def test_clinic_simulation_engine():
    # Test preset scenarios
    presets = get_preset_scenarios()
    assert "normal_day" in presets
    assert "surge_congestion" in presets
    assert "staffing_delay" in presets

    # Run deterministic simulation
    res_normal = run_clinic_simulation(
        scenario_name="normal_day",
        num_appointments=25,
        walk_in_rate_pct=15.0,
        num_doctors=2,
        seed=123
    )

    assert res_normal["is_simulation"] is True
    assert res_normal["results"]["patients_served"] > 0
    assert res_normal["results"]["average_wait_minutes"] >= 0
    assert len(res_normal["results"]["hourly_congestion"]) == 8

    # Verify high demand increases average wait time
    res_surge = run_clinic_simulation(
        scenario_name="surge_congestion",
        num_appointments=40,
        walk_in_rate_pct=40.0,
        num_doctors=1, # Reduced doctors
        seed=123
    )
    assert res_surge["results"]["average_wait_minutes"] > res_normal["results"]["average_wait_minutes"]

def test_analytics_dashboard_endpoint(client):
    res = client.get("/api/analytics/dashboard")
    assert res.status_code == 200
    data = res.get_json()
    assert "kpis" in data
    assert data["kpis"]["total_appointments"] > 200
    assert data["kpis"]["average_wait_minutes"] > 0
    assert len(data["by_department"]) > 0
    assert len(data["by_day"]) == 6
    assert len(data["hourly_congestion"]) == 8

def test_prescriptions_endpoint(client):
    login_res = client.post("/api/auth/demo-switch", json={"role": "patient"})
    assert login_res.status_code == 200
    token = login_res.get_json()["token"]

    res = client.get("/api/prescriptions", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert "prescriptions" in data
    assert len(data["prescriptions"]) >= 1
    rx = data["prescriptions"][0]
    assert "rx_number" in rx
    assert "medications" in rx
    assert len(rx["medications"]) > 0

def test_insurance_endpoint(client):
    login_res = client.post("/api/auth/demo-switch", json={"role": "patient"})
    assert login_res.status_code == 200
    token = login_res.get_json()["token"]

    res = client.get("/api/insurance", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert "insurance" in data
    assert data["insurance"]["provider_name"] != ""

    # Test update
    update_res = client.patch(
        "/api/insurance",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "provider_name": "Star Health Comprehensive Plus",
            "policy_number": "SHI-POL-2026-9999",
            "coverage_limit": "₹ 7,50,000",
            "copay_percentage": "10%"
        }
    )
    assert update_res.status_code == 200
    update_data = update_res.get_json()
    assert "insurance" in update_data
    assert update_data["insurance"]["policy_number"] == "SHI-POL-2026-9999"
