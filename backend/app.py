import os
import uuid
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify, g, make_response
from flask_cors import CORS
from backend.config import Config
from backend.database import get_db, init_db, serialize_doc, get_storage_info
from backend.auth import (
    hash_password, verify_password, generate_token, decode_token,
    require_auth, require_role, get_current_user_from_request, enforce_org_scope
)
from backend.prediction import (
    calculate_adaptive_wait_time, evaluate_prediction_accuracy, calculate_simple_baseline
)
from backend.simulation import run_clinic_simulation, get_preset_scenarios
from backend.queue_manager import (
    check_in_patient, start_consultation, complete_consultation,
    record_audit_log, create_notification
)
from backend.seed import seed_database

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize database
    init_db()

    # Seed if database is empty
    db = get_db()
    if db["organizations"].count_documents() == 0:
        print("[App] Empty database detected. Running seed...")
        seed_database()

    # -------------------------------------------------------------
    # HEALTH & STORAGE ENDPOINTS
    # -------------------------------------------------------------
    @app.route("/api/health", methods=["GET"])
    def health():
        storage_info = get_storage_info()
        return jsonify({
            "status": "healthy",
            "service": "ClinicQueue API",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "storage": storage_info
        })

    # -------------------------------------------------------------
    # AUTHENTICATION & PROFILE
    # -------------------------------------------------------------
    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"error": "Bad Request", "message": "Email and password are required."}), 400

        user = db["users"].find_one({"email": email})
        if not user or not verify_password(password, user.get("password_hash", "")):
            return jsonify({"error": "Unauthorized", "message": "Invalid email or password."}), 401

        if not user.get("is_active", True):
            return jsonify({"error": "Forbidden", "message": "Account is suspended."}), 403

        token = generate_token(
            user_id=str(user["_id"]),
            role=user.get("role", "patient"),
            organization_id=user.get("organization_id")
        )

        user_clean = serialize_doc(user)
        user_clean.pop("password_hash", None)

        record_audit_log(
            user_id=str(user["_id"]),
            organization_id=user.get("organization_id"),
            action="login",
            entity_type="user",
            entity_id=str(user["_id"]),
            details={"email": email, "role": user.get("role")}
        )

        resp = make_response(jsonify({
            "message": "Login successful.",
            "token": token,
            "user": user_clean
        }))
        resp.set_cookie("clinicqueue_token", token, httponly=True, samesite="Lax")
        return resp

    @app.route("/api/auth/register", methods=["POST"])
    def register_patient():
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        phone = (data.get("phone") or "").strip()

        if not name or not email or not password:
            return jsonify({"error": "Bad Request", "message": "Name, email, and password are required."}), 400

        if len(password) < 6:
            return jsonify({"error": "Bad Request", "message": "Password must be at least 6 characters long."}), 400

        existing = db["users"].find_one({"email": email})
        if existing:
            return jsonify({"error": "Conflict", "message": "An account with this email already exists."}), 409

        # Default to flagship organization if none specified
        org_id = data.get("organization_id") or "org-metrocare-01"

        # Create patient record
        patient_id = f"pat-{uuid.uuid4().hex[:8]}"
        db["patients"].insert_one({
            "_id": patient_id,
            "mrn": f"CQ-MRN-{uuid.uuid4().hex[:6].upper()}",
            "name": name,
            "email": email,
            "phone": phone or "+91 98000 00000",
            "age": data.get("age", 30),
            "gender": data.get("gender", "Unspecified"),
            "blood_group": data.get("blood_group", "O+"),
            "city": data.get("city", "New Delhi"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        # Create user record
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        hashed_pwd = hash_password(password)
        db["users"].insert_one({
            "_id": user_id,
            "email": email,
            "password_hash": hashed_pwd,
            "role": "patient",
            "name": name,
            "phone": phone,
            "patient_id": patient_id,
            "organization_id": org_id,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        token = generate_token(user_id=user_id, role="patient", organization_id=org_id)
        user_clean = {
            "_id": user_id,
            "email": email,
            "role": "patient",
            "name": name,
            "patient_id": patient_id,
            "organization_id": org_id
        }

        record_audit_log(
            user_id=user_id,
            organization_id=org_id,
            action="register_patient",
            entity_type="user",
            entity_id=user_id,
            details={"email": email}
        )

        resp = make_response(jsonify({
            "message": "Registration successful.",
            "token": token,
            "user": user_clean
        }), 201)
        resp.set_cookie("clinicqueue_token", token, httponly=True, samesite="Lax")
        return resp

    @app.route("/api/auth/me", methods=["GET"])
    def get_me():
        user = get_current_user_from_request()
        if not user:
            return jsonify({"error": "Unauthorized", "message": "Not authenticated."}), 401

        user_clean = serialize_doc(user)
        user_clean.pop("password_hash", None)

        # Attach associated doctor / patient details
        if user.get("role") == "doctor" and user.get("doctor_id"):
            doc_rec = db["doctors"].find_one({"_id": user["doctor_id"]})
            if doc_rec:
                user_clean["doctor_profile"] = serialize_doc(doc_rec)
        elif user.get("role") == "patient" and user.get("patient_id"):
            pat_rec = db["patients"].find_one({"_id": user["patient_id"]})
            if pat_rec:
                user_clean["patient_profile"] = serialize_doc(pat_rec)

        # Attach organization name
        if user.get("organization_id"):
            org = db["organizations"].find_one({"_id": user["organization_id"]})
            if org:
                user_clean["organization_name"] = org.get("name")

        return jsonify({"user": user_clean})

    @app.route("/api/auth/demo-switch", methods=["POST"])
    def demo_switch():
        """Role switcher for seamless portal exploration and automated testing."""
        data = request.get_json() or {}
        target_role = data.get("role", "patient")

        role_emails = {
            "patient": "patient@clinicqueue.demo",
            "receptionist": "reception@clinicqueue.demo",
            "doctor": "doctor.sharma@clinicqueue.demo",
            "hospital_admin": "admin@metrocare.demo",
            "platform_admin": "platform.admin@clinicqueue.demo"
        }

        email = role_emails.get(target_role)
        if not email:
            return jsonify({"error": "Bad Request", "message": f"Invalid demo role '{target_role}'."}), 400

        user = db["users"].find_one({"email": email})
        if not user:
            # Re-seed if user was removed
            seed_database()
            user = db["users"].find_one({"email": email})

        token = generate_token(
            user_id=str(user["_id"]),
            role=user.get("role"),
            organization_id=user.get("organization_id")
        )

        user_clean = serialize_doc(user)
        user_clean.pop("password_hash", None)

        resp = make_response(jsonify({
            "message": f"Switched to demo role: {target_role}",
            "token": token,
            "user": user_clean
        }))
        resp.set_cookie("clinicqueue_token", token, httponly=True, samesite="Lax")
        return resp

    @app.route("/api/auth/logout", methods=["POST"])
    def logout():
        resp = make_response(jsonify({"message": "Logged out successfully."}))
        resp.set_cookie("clinicqueue_token", "", expires=0)
        return resp

    # -------------------------------------------------------------
    # ORGANIZATIONS & DEPARTMENTS
    # -------------------------------------------------------------
    @app.route("/api/organizations", methods=["GET"])
    def get_organizations():
        city = request.args.get("city")
        query = {}
        if city:
            query["city"] = city
        orgs = list(db["organizations"].find(query))
        return jsonify({"organizations": serialize_doc(orgs)})

    @app.route("/api/organizations/<org_id>", methods=["GET"])
    def get_organization(org_id):
        org = db["organizations"].find_one({"_id": str(org_id)})
        if not org:
            return jsonify({"error": "Not Found", "message": "Organization not found."}), 404

        # Include summary stats
        doc_count = db["doctors"].count_documents({"organization_id": str(org_id)})
        dept_count = db["departments"].count_documents({"organization_id": str(org_id)})
        active_appts = db["appointments"].count_documents({
            "organization_id": str(org_id),
            "status": {"$in": ["booked", "checked_in", "waiting", "in_consultation"]}
        })

        res = serialize_doc(org)
        res["stats"] = {
            "doctor_count": doc_count,
            "department_count": dept_count,
            "active_appointments": active_appts
        }
        return jsonify({"organization": res})

    @app.route("/api/organizations", methods=["POST"])
    @require_role("platform_admin")
    def create_organization():
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        code = (data.get("code") or "").strip().upper()
        city = (data.get("city") or "").strip()

        if not name or not code or not city:
            return jsonify({"error": "Bad Request", "message": "Name, code, and city are required."}), 400

        org_id = f"org-{code.lower()}-{uuid.uuid4().hex[:4]}"
        new_org = {
            "_id": org_id,
            "name": name,
            "code": code,
            "city": city,
            "state": data.get("state", "India"),
            "address": data.get("address", ""),
            "phone": data.get("phone", ""),
            "type": data.get("type", "General Outpatient"),
            "status": "active",
            "is_flagship": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        db["organizations"].insert_one(new_org)

        # Seed standard departments for this hospital
        for dept in ["General Medicine", "Cardiology", "Pediatrics", "Orthopedics", "Dermatology"]:
            db["departments"].insert_one({
                "_id": f"dept-{code.lower()}-{dept.lower().replace(' ', '-')}",
                "organization_id": org_id,
                "name": dept,
                "nominal_duration_minutes": 15,
                "is_active": True
            })

        record_audit_log(
            user_id=str(g.current_user["_id"]),
            organization_id=org_id,
            action="create_organization",
            entity_type="organization",
            entity_id=org_id,
            details={"name": name, "code": code}
        )

        return jsonify({"message": "Organization created.", "organization": serialize_doc(new_org)}), 201

    @app.route("/api/organizations/<org_id>/status", methods=["PATCH"])
    @require_role("platform_admin")
    def update_organization_status(org_id):
        data = request.get_json() or {}
        new_status = data.get("status")
        if new_status not in ["active", "suspended", "pending"]:
            return jsonify({"error": "Bad Request", "message": "Invalid status value."}), 400

        db["organizations"].update_one(
            {"_id": str(org_id)},
            {"$set": {"status": new_status}}
        )

        record_audit_log(
            user_id=str(g.current_user["_id"]),
            organization_id=str(org_id),
            action="update_status",
            entity_type="organization",
            entity_id=str(org_id),
            details={"new_status": new_status}
        )

        return jsonify({"message": f"Organization status updated to {new_status}."})

    @app.route("/api/organizations/<org_id>/departments", methods=["GET"])
    def get_departments(org_id):
        depts = list(db["departments"].find({"organization_id": str(org_id), "is_active": True}))
        return jsonify({"departments": serialize_doc(depts)})

    # -------------------------------------------------------------
    # DOCTORS & SCHEDULES
    # -------------------------------------------------------------
    @app.route("/api/doctors", methods=["GET"])
    def get_doctors():
        org_id = request.args.get("organization_id")
        dept = request.args.get("department")
        available_only = request.args.get("available") == "true"

        query = {}
        if org_id:
            query["organization_id"] = str(org_id)
        if dept:
            query["department_name"] = dept
        if available_only:
            query["is_available"] = True

        docs = list(db["doctors"].find(query))
        return jsonify({"doctors": serialize_doc(docs)})

    @app.route("/api/doctors/<doc_id>", methods=["GET"])
    def get_doctor(doc_id):
        doc = db["doctors"].find_one({"_id": str(doc_id)})
        if not doc:
            return jsonify({"error": "Not Found", "message": "Doctor not found."}), 404

        # Active in-progress consultation
        active_consult = db["consultations"].find_one({
            "doctor_id": str(doc_id),
            "status": "in_progress"
        })

        # Count waiting queue
        waiting_count = db["queue_entries"].count_documents({
            "doctor_id": str(doc_id),
            "status": {"$in": ["checked_in", "waiting"]}
        })

        res = serialize_doc(doc)
        res["active_consultation"] = serialize_doc(active_consult)
        res["waiting_patients_count"] = waiting_count
        return jsonify({"doctor": res})

    @app.route("/api/doctors/<doc_id>/availability", methods=["PATCH"])
    @require_role("doctor", "hospital_admin", "receptionist")
    def toggle_doctor_availability(doc_id):
        data = request.get_json() or {}
        is_available = bool(data.get("is_available", True))

        db["doctors"].update_one(
            {"_id": str(doc_id)},
            {"$set": {"is_available": is_available}}
        )

        record_audit_log(
            user_id=str(g.current_user["_id"]),
            organization_id=g.current_user.get("organization_id"),
            action="toggle_availability",
            entity_type="doctor",
            entity_id=str(doc_id),
            details={"is_available": is_available}
        )

        return jsonify({"message": f"Doctor availability updated to {is_available}."})

    @app.route("/api/doctors/<doc_id>/break", methods=["POST"])
    @require_role("doctor", "hospital_admin", "receptionist")
    def set_doctor_break(doc_id):
        data = request.get_json() or {}
        is_on_break = bool(data.get("is_on_break", True))
        duration_mins = float(data.get("duration_minutes", 20.0))

        db["doctors"].update_one(
            {"_id": str(doc_id)},
            {"$set": {
                "is_on_break": is_on_break,
                "break_remaining_minutes": duration_mins if is_on_break else 0
            }}
        )

        record_audit_log(
            user_id=str(g.current_user["_id"]),
            organization_id=g.current_user.get("organization_id"),
            action="set_break",
            entity_type="doctor",
            entity_id=str(doc_id),
            details={"is_on_break": is_on_break, "duration": duration_mins}
        )

        return jsonify({"message": "Doctor break state updated."})

    @app.route("/api/doctors/<doc_id>/report-delay", methods=["POST"])
    @require_role("doctor", "hospital_admin", "receptionist")
    def report_doctor_delay(doc_id):
        data = request.get_json() or {}
        delay_mins = float(data.get("delay_minutes", 15.0))
        reason = data.get("reason", "Emergency ward consultation")

        db["doctors"].update_one(
            {"_id": str(doc_id)},
            {"$set": {
                "reported_delay_minutes": delay_mins,
                "delay_reason": reason
            }}
        )

        # Notify waiting patients
        active_entries = list(db["queue_entries"].find({
            "doctor_id": str(doc_id),
            "status": {"$in": ["checked_in", "waiting"]}
        }))
        for entry in active_entries:
            create_notification(
                user_id=str(entry.get("patient_id")),
                organization_id=str(entry.get("organization_id")),
                title="Doctor Schedule Update",
                message=f"Dr. {entry.get('doctor_name')} reported a {int(delay_mins)}m delay ({reason}). Estimated waiting times have been adjusted.",
                notification_type="delay_alert"
            )

        record_audit_log(
            user_id=str(g.current_user["_id"]),
            organization_id=g.current_user.get("organization_id"),
            action="report_delay",
            entity_type="doctor",
            entity_id=str(doc_id),
            details={"delay_minutes": delay_mins, "reason": reason}
        )

        return jsonify({"message": f"Delay of {int(delay_mins)} minutes reported and queue updated."})

    # -------------------------------------------------------------
    # PATIENTS
    # -------------------------------------------------------------
    @app.route("/api/patients", methods=["GET"])
    @require_role("receptionist", "hospital_admin", "doctor")
    def get_patients():
        search = (request.args.get("search") or "").strip().lower()
        query = {}
        patients = list(db["patients"].find(query).limit(50))
        if search:
            patients = [p for p in patients if search in p.get("name", "").lower() or search in p.get("mrn", "").lower() or search in p.get("phone", "")]
        return jsonify({"patients": serialize_doc(patients)})

    @app.route("/api/patients/<patient_id>", methods=["GET"])
    @require_auth
    def get_patient(patient_id):
        user = g.current_user
        # Patient can only see their own profile unless staff
        if user.get("role") == "patient" and str(user.get("patient_id")) != str(patient_id):
            return jsonify({"error": "Forbidden", "message": "Access restricted to your own profile."}), 403

        pat = db["patients"].find_one({"_id": str(patient_id)})
        if not pat:
            return jsonify({"error": "Not Found", "message": "Patient not found."}), 404

        # Past appointment history
        history = list(db["appointments"].find({"patient_id": str(patient_id)}).sort("appointment_date", -1).limit(20))

        res = serialize_doc(pat)
        res["appointment_history"] = serialize_doc(history)
        return jsonify({"patient": res})

    @app.route("/api/patients", methods=["POST"])
    @require_role("receptionist", "hospital_admin")
    def register_walk_in():
        data = request.get_json() or {}
        name = (data.get("name") or "").strip()
        phone = (data.get("phone") or "").strip()

        if not name or not phone:
            return jsonify({"error": "Bad Request", "message": "Patient name and phone are required."}), 400

        patient_id = f"pat-{uuid.uuid4().hex[:8]}"
        mrn = f"CQ-MRN-{uuid.uuid4().hex[:6].upper()}"

        new_pat = {
            "_id": patient_id,
            "mrn": mrn,
            "name": name,
            "phone": phone,
            "age": data.get("age", 35),
            "gender": data.get("gender", "Unspecified"),
            "blood_group": data.get("blood_group", "O+"),
            "city": data.get("city", "New Delhi"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        db["patients"].insert_one(new_pat)

        record_audit_log(
            user_id=str(g.current_user["_id"]),
            organization_id=g.current_user.get("organization_id"),
            action="register_walk_in_patient",
            entity_type="patient",
            entity_id=patient_id,
            details={"mrn": mrn, "name": name}
        )

        return jsonify({"message": "Patient registered.", "patient": serialize_doc(new_pat)}), 201

    # -------------------------------------------------------------
    # APPOINTMENTS
    # -------------------------------------------------------------
    @app.route("/api/appointments", methods=["GET"])
    @require_auth
    def get_appointments():
        user = g.current_user
        role = user.get("role")
        date_filter = request.args.get("date")
        status_filter = request.args.get("status")

        query = {}
        if date_filter:
            query["appointment_date"] = date_filter
        if status_filter:
            query["status"] = status_filter

        # Enforce server-side role boundaries
        if role == "patient":
            query["patient_id"] = str(user.get("patient_id"))
        elif role == "doctor":
            query["doctor_id"] = str(user.get("doctor_id"))
        elif role in ["receptionist", "hospital_admin"]:
            if user.get("organization_id"):
                query["organization_id"] = str(user.get("organization_id"))

        appts = list(db["appointments"].find(query).sort([("appointment_date", -1), ("scheduled_time", 1)]).limit(100))
        return jsonify({"appointments": serialize_doc(appts)})

    @app.route("/api/appointments/<appt_id>", methods=["GET"])
    @require_auth
    def get_appointment(appt_id):
        appt = db["appointments"].find_one({"_id": str(appt_id)})
        if not appt:
            return jsonify({"error": "Not Found", "message": "Appointment not found."}), 404

        user = g.current_user
        if user.get("role") == "patient" and str(user.get("patient_id")) != str(appt.get("patient_id")):
            return jsonify({"error": "Forbidden", "message": "Access restricted to your own appointment."}), 403

        # Include timeline events
        events = list(db["queue_events"].find({"appointment_id": str(appt_id)}).sort("timestamp", 1))

        # Include current prediction if active
        prediction = None
        if appt.get("status") in ["checked_in", "waiting"]:
            prediction = calculate_adaptive_wait_time(
                appointment_id=str(appt_id),
                doctor_id=str(appt.get("doctor_id")),
                org_id=str(appt.get("organization_id"))
            )

        res = serialize_doc(appt)
        res["timeline"] = serialize_doc(events)
        res["live_prediction"] = prediction
        return jsonify({"appointment": res})

    @app.route("/api/appointments", methods=["POST"])
    @require_auth
    def book_appointment():
        user = g.current_user
        data = request.get_json() or {}

        doctor_id = str(data.get("doctor_id") or "")
        appt_date = data.get("appointment_date") # YYYY-MM-DD
        sched_time = data.get("scheduled_time")  # HH:MM
        appt_type = data.get("appointment_type", "standard")

        if not doctor_id or not appt_date or not sched_time:
            return jsonify({"error": "Bad Request", "message": "Doctor, appointment date, and time are required."}), 400

        # Validate doctor exists
        doctor = db["doctors"].find_one({"_id": doctor_id})
        if not doctor:
            return jsonify({"error": "Not Found", "message": "Selected doctor does not exist."}), 404

        # Prevent double-booking on exact doctor/date/time
        conflict = db["appointments"].find_one({
            "doctor_id": doctor_id,
            "appointment_date": appt_date,
            "scheduled_time": sched_time,
            "status": {"$in": ["booked", "checked_in", "waiting", "in_consultation"]}
        })
        if conflict:
            return jsonify({
                "error": "Conflict",
                "message": f"Dr. {doctor.get('name')} already has an appointment booked at {sched_time} on {appt_date}. Please choose another slot."
            }), 409

        # Determine patient details
        if user.get("role") == "patient":
            patient_id = str(user.get("patient_id"))
            patient_name = user.get("name")
        else:
            patient_id = str(data.get("patient_id") or "")
            patient_name = data.get("patient_name") or "Walk-in Patient"
            if not patient_id:
                # Create walk-in patient record
                patient_id = f"pat-{uuid.uuid4().hex[:8]}"
                db["patients"].insert_one({
                    "_id": patient_id,
                    "mrn": f"CQ-MRN-{uuid.uuid4().hex[:6].upper()}",
                    "name": patient_name,
                    "phone": data.get("phone", "+91 98000 00000"),
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

        appt_id = f"appt-{uuid.uuid4().hex[:8]}"
        bkg_ref = f"CQ-BKG-{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        new_appt = {
            "_id": appt_id,
            "booking_reference": bkg_ref,
            "patient_id": patient_id,
            "patient_name": patient_name,
            "doctor_id": doctor_id,
            "doctor_name": doctor.get("name"),
            "department_name": doctor.get("department_name"),
            "organization_id": doctor.get("organization_id"),
            "appointment_date": appt_date,
            "scheduled_time": sched_time,
            "appointment_type": appt_type,
            "status": "booked",
            "priority_flags": data.get("priority_flags", []),
            "priority_score": 0,
            "created_at": now_iso
        }
        db["appointments"].insert_one(new_appt)

        # Record event and audit
        db["queue_events"].insert_one({
            "appointment_id": appt_id,
            "doctor_id": doctor_id,
            "event_type": "booked",
            "actor_id": str(user["_id"]),
            "timestamp": now_iso,
            "details": {"booking_reference": bkg_ref}
        })

        record_audit_log(
            user_id=str(user["_id"]),
            organization_id=doctor.get("organization_id"),
            action="book_appointment",
            entity_type="appointment",
            entity_id=appt_id,
            details={"booking_reference": bkg_ref, "doctor_id": doctor_id}
        )

        create_notification(
            user_id=patient_id,
            organization_id=doctor.get("organization_id"),
            title="Appointment Booked",
            message=f"Appointment booked with {doctor.get('name')} for {appt_date} at {sched_time}. Ref: {bkg_ref}",
            notification_type="booking_confirmed"
        )

        return jsonify({
            "message": "Appointment booked successfully.",
            "appointment": serialize_doc(new_appt)
        }), 201

    @app.route("/api/appointments/<appt_id>/cancel", methods=["POST"])
    @require_auth
    def cancel_appointment(appt_id):
        user = g.current_user
        appt = db["appointments"].find_one({"_id": str(appt_id)})
        if not appt:
            return jsonify({"error": "Not Found", "message": "Appointment not found."}), 404

        if user.get("role") == "patient" and str(user.get("patient_id")) != str(appt.get("patient_id")):
            return jsonify({"error": "Forbidden", "message": "Cannot cancel another patient's appointment."}), 403

        if appt.get("status") in ["in_consultation", "completed"]:
            return jsonify({"error": "Bad Request", "message": f"Cannot cancel appointment in '{appt.get('status')}' state."}), 400

        now_iso = datetime.now(timezone.utc).isoformat()
        db["appointments"].update_one(
            {"_id": str(appt_id)},
            {"$set": {"status": "cancelled", "cancelled_at": now_iso}}
        )
        db["queue_entries"].delete_one({"appointment_id": str(appt_id)})

        db["queue_events"].insert_one({
            "appointment_id": str(appt_id),
            "doctor_id": str(appt.get("doctor_id")),
            "event_type": "cancelled",
            "actor_id": str(user["_id"]),
            "timestamp": now_iso,
            "details": {}
        })

        record_audit_log(
            user_id=str(user["_id"]),
            organization_id=appt.get("organization_id"),
            action="cancel_appointment",
            entity_type="appointment",
            entity_id=str(appt_id),
            details={}
        )

        return jsonify({"message": "Appointment cancelled successfully."})

    # -------------------------------------------------------------
    # LIVE QUEUE ORCHESTRATION & CHECK-IN
    # -------------------------------------------------------------
    @app.route("/api/queue", methods=["GET"])
    def get_live_queue():
        doctor_id = request.args.get("doctor_id")
        org_id = request.args.get("organization_id")
        status_filter = request.args.get("status")

        query = {}
        if doctor_id:
            query["doctor_id"] = str(doctor_id)
        if org_id:
            query["organization_id"] = str(org_id)
        if status_filter:
            query["status"] = status_filter
        else:
            # Active queue entries only
            query["status"] = {"$in": ["checked_in", "waiting", "in_consultation"]}

        entries = list(db["queue_entries"].find(query).sort([
            ("priority_score", -1),
            ("check_in_time", 1)
        ]))

        # Calculate live predictions for each waiting entry
        enhanced_entries = []
        for rank, entry in enumerate(entries, 1):
            e = serialize_doc(entry)
            e["queue_position"] = rank
            if e["status"] in ["checked_in", "waiting"]:
                pred = calculate_adaptive_wait_time(
                    appointment_id=str(e.get("appointment_id")),
                    doctor_id=str(e.get("doctor_id")),
                    org_id=str(e.get("organization_id"))
                )
                e["predicted_wait_minutes"] = pred["predicted_wait_minutes"]
                e["predicted_start_time"] = pred["predicted_start_time"]
                e["explanations"] = pred["explanations"]
                e["uncertainty_window_minutes"] = pred["uncertainty_window_minutes"]
            enhanced_entries.append(e)

        return jsonify({"queue": enhanced_entries, "count": len(enhanced_entries)})

    @app.route("/api/queue/check-in", methods=["POST"])
    @require_auth
    def check_in():
        user = g.current_user
        data = request.get_json() or {}
        appt_id = data.get("appointment_id")
        bkg_ref = data.get("booking_reference")
        flags = data.get("priority_flags", [])

        if not appt_id and not bkg_ref:
            return jsonify({"error": "Bad Request", "message": "Appointment ID or Booking Reference is required."}), 400

        if not appt_id and bkg_ref:
            target = db["appointments"].find_one({"booking_reference": bkg_ref.strip().upper()})
            if not target:
                return jsonify({"error": "Not Found", "message": f"No appointment found with reference '{bkg_ref}'."}), 404
            appt_id = str(target["_id"])

        success, msg, payload = check_in_patient(
            appointment_id=str(appt_id),
            actor_id=str(user["_id"]),
            priority_flags=flags
        )

        if not success:
            return jsonify({"error": "Bad Request", "message": msg}), 400

        return jsonify({"message": msg, "data": payload})

    @app.route("/api/queue/call", methods=["POST"])
    @require_role("doctor", "hospital_admin", "receptionist")
    def call_patient_endpoint():
        user = g.current_user
        data = request.get_json() or {}
        appt_id = data.get("appointment_id")
        if not appt_id:
            return jsonify({"error": "Bad Request", "message": "appointment_id is required."}), 400

        from backend.queue_manager import call_patient
        doctor_id = user.get("doctor_id") or data.get("doctor_id")
        if not doctor_id:
            target = db["appointments"].find_one({"_id": str(appt_id)})
            doctor_id = target.get("doctor_id") if target else None

        ok, msg, payload = call_patient(appt_id, doctor_id, str(user["_id"]))
        if not ok:
            return jsonify({"error": "Invalid Transition", "message": msg}), 400

        return jsonify({"message": msg, "data": payload}), 200

    @app.route("/api/queue/<queue_id>/priority", methods=["POST"])
    @require_role("receptionist", "hospital_admin")
    def update_queue_priority(queue_id):
        data = request.get_json() or {}
        flags = data.get("priority_flags", [])
        
        from backend.queue_manager import PRIORITY_FLAG_SCORES
        prio_score = sum(PRIORITY_FLAG_SCORES.get(f, 0) for f in flags)

        entry = db["queue_entries"].find_one({"_id": str(queue_id)})
        if not entry:
            return jsonify({"error": "Not Found", "message": "Queue entry not found."}), 404

        db["queue_entries"].update_one(
            {"_id": str(queue_id)},
            {"$set": {"priority_flags": flags, "priority_score": prio_score}}
        )
        if entry.get("appointment_id"):
            db["appointments"].update_one(
                {"_id": str(entry["appointment_id"])},
                {"$set": {"priority_flags": flags, "priority_score": prio_score}}
            )

        record_audit_log(
            user_id=str(g.current_user["_id"]),
            organization_id=entry.get("organization_id"),
            action="update_priority",
            entity_type="queue_entry",
            entity_id=str(queue_id),
            details={"priority_flags": flags, "priority_score": prio_score}
        )

        return jsonify({"message": "Priority updated.", "priority_score": prio_score})

    @app.route("/api/queue/<queue_id>/no-show", methods=["POST"])
    @require_role("receptionist", "hospital_admin", "doctor")
    def mark_no_show(queue_id):
        entry = db["queue_entries"].find_one({"_id": str(queue_id)})
        if not entry:
            return jsonify({"error": "Not Found", "message": "Queue entry not found."}), 404

        appt_id = entry.get("appointment_id")
        now_iso = datetime.now(timezone.utc).isoformat()

        db["appointments"].update_one(
            {"_id": str(appt_id)},
            {"$set": {"status": "no_show"}}
        )
        db["queue_entries"].delete_one({"_id": str(queue_id)})

        db["queue_events"].insert_one({
            "appointment_id": str(appt_id),
            "doctor_id": str(entry.get("doctor_id")),
            "event_type": "no_show",
            "actor_id": str(g.current_user["_id"]),
            "timestamp": now_iso,
            "details": {}
        })

        return jsonify({"message": "Appointment marked as no-show."})

    # -------------------------------------------------------------
    # CONSULTATIONS
    # -------------------------------------------------------------
    @app.route("/api/consultations/active", methods=["GET"])
    @require_role("doctor")
    def get_active_consultation():
        user = g.current_user
        doc_id = str(user.get("doctor_id"))
        active = db["consultations"].find_one({
            "doctor_id": doc_id,
            "status": "in_progress"
        })
        return jsonify({"consultation": serialize_doc(active)})

    @app.route("/api/consultations/start", methods=["POST"])
    @require_role("doctor")
    def doctor_start_consultation():
        user = g.current_user
        doc_id = str(user.get("doctor_id"))
        data = request.get_json() or {}
        appt_id = data.get("appointment_id")

        if not appt_id:
            return jsonify({"error": "Bad Request", "message": "appointment_id is required."}), 400

        success, msg, payload = start_consultation(
            appointment_id=str(appt_id),
            doctor_id=doc_id,
            actor_id=str(user["_id"])
        )

        if not success:
            return jsonify({"error": "Bad Request", "message": msg}), 400

        return jsonify({"message": msg, "data": payload})

    @app.route("/api/consultations/<cons_id>/complete", methods=["POST"])
    @require_role("doctor")
    def doctor_complete_consultation(cons_id):
        user = g.current_user
        doc_id = str(user.get("doctor_id"))
        data = request.get_json() or {}
        notes = data.get("notes", "")
        duration = float(data["duration_minutes"]) if "duration_minutes" in data else None

        success, msg, payload = complete_consultation(
            consultation_id=str(cons_id),
            doctor_id=doc_id,
            actor_id=str(user["_id"]),
            notes=notes,
            duration_minutes=duration
        )

        if not success:
            return jsonify({"error": "Bad Request", "message": msg}), 400

        return jsonify({"message": msg, "data": payload})

    @app.route("/api/consultations/history", methods=["GET"])
    @require_role("doctor")
    def doctor_consultation_history():
        user = g.current_user
        doc_id = str(user.get("doctor_id"))
        history = list(db["consultations"].find({
            "doctor_id": doc_id,
            "status": "completed"
        }).sort("completed_at", -1).limit(40))
        return jsonify({"consultations": serialize_doc(history)})

    # -------------------------------------------------------------
    # PREDICTIONS & EVALUATION
    # -------------------------------------------------------------
    @app.route("/api/predictions/<appt_id>", methods=["GET"])
    def get_prediction(appt_id):
        appt = db["appointments"].find_one({"_id": str(appt_id)})
        if not appt:
            return jsonify({"error": "Not Found", "message": "Appointment not found."}), 404

        pred = calculate_adaptive_wait_time(
            appointment_id=str(appt_id),
            doctor_id=str(appt.get("doctor_id")),
            org_id=str(appt.get("organization_id"))
        )
        return jsonify({"prediction": pred})

    @app.route("/api/predictions/evaluation", methods=["GET"])
    def get_prediction_evaluation():
        org_id = request.args.get("organization_id")
        metrics = evaluate_prediction_accuracy(organization_id=org_id)
        return jsonify({"evaluation": metrics})

    # -------------------------------------------------------------
    # CLINIC-DAY SIMULATOR (DIGITAL TWIN)
    # -------------------------------------------------------------
    @app.route("/api/simulation/presets", methods=["GET"])
    def get_simulation_presets():
        return jsonify({"presets": get_preset_scenarios()})

    @app.route("/api/simulation/run", methods=["POST"])
    def run_simulation():
        data = request.get_json() or {}
        scenario = data.get("scenario", "custom")
        params = data.get("parameters") or {}

        # If preset name given without parameters, load preset defaults
        presets = get_preset_scenarios()
        if scenario in presets and not params:
            params = presets[scenario]["params"]

        results = run_clinic_simulation(
            scenario_name=scenario,
            num_appointments=int(params.get("num_appointments", 30)),
            walk_in_rate_pct=float(params.get("walk_in_rate_pct", 15.0)),
            duration_variance_pct=float(params.get("duration_variance_pct", 20.0)),
            num_doctors=int(params.get("num_doctors", 2)),
            base_consultation_minutes=float(params.get("base_consultation_minutes", 15.0)),
            break_duration_minutes=float(params.get("break_duration_minutes", 30.0)),
            late_arrival_rate_pct=float(params.get("late_arrival_rate_pct", 10.0)),
            no_show_rate_pct=float(params.get("no_show_rate_pct", 8.0)),
            doctor_delay_minutes=float(params.get("doctor_delay_minutes", 0.0)),
            seed=int(data.get("seed", 42))
        )

        return jsonify({"simulation": results})

    # -------------------------------------------------------------
    # ANALYTICS
    # -------------------------------------------------------------
    @app.route("/api/analytics/dashboard", methods=["GET"])
    def get_analytics():
        org_id = request.args.get("organization_id")
        query = {}
        if org_id:
            query["organization_id"] = str(org_id)

        all_appts = list(db["appointments"].find(query))
        total_count = len(all_appts)
        completed_count = sum(1 for a in all_appts if a.get("status") == "completed")
        no_show_count = sum(1 for a in all_appts if a.get("status") == "no_show")
        cancelled_count = sum(1 for a in all_appts if a.get("status") == "cancelled")
        waiting_count = sum(1 for a in all_appts if a.get("status") in ["checked_in", "waiting", "in_consultation"])

        # Actual wait times
        waits = [a["actual_wait_minutes"] for a in all_appts if a.get("actual_wait_minutes") is not None]
        avg_wait = round(sum(waits) / len(waits), 1) if waits else 18.0
        sorted_waits = sorted(waits) if waits else [18.0]
        median_wait = sorted_waits[len(sorted_waits) // 2]

        # Appointments by department
        dept_counts: Dict[str, int] = {}
        for a in all_appts:
            dept = a.get("department_name", "General")
            dept_counts[dept] = dept_counts.get(dept, 0) + 1

        appts_by_dept = [{"department": k, "count": v} for k, v in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)[:8]]

        # Appointments by day of week
        daily_counts = [
            {"day": "Mon", "appointments": int(total_count * 0.18)},
            {"day": "Tue", "appointments": int(total_count * 0.19)},
            {"day": "Wed", "appointments": int(total_count * 0.17)},
            {"day": "Thu", "appointments": int(total_count * 0.16)},
            {"day": "Fri", "appointments": int(total_count * 0.20)},
            {"day": "Sat", "appointments": int(total_count * 0.10)}
        ]

        # Congestion curve by hour
        hourly_congestion = [
            {"time": "09:00", "patients": 4, "avg_wait": 8},
            {"time": "10:00", "patients": 9, "avg_wait": 16},
            {"time": "11:00", "patients": 14, "avg_wait": 26},
            {"time": "12:00", "patients": 11, "avg_wait": 22},
            {"time": "13:00", "patients": 5, "avg_wait": 12},
            {"time": "14:00", "patients": 8, "avg_wait": 15},
            {"time": "15:00", "patients": 12, "avg_wait": 24},
            {"time": "16:00", "patients": 6, "avg_wait": 10}
        ]

        no_show_rate = round((no_show_count / max(1, total_count)) * 100.0, 1)
        cancellation_rate = round((cancelled_count / max(1, total_count)) * 100.0, 1)

        return jsonify({
            "kpis": {
                "total_appointments": total_count,
                "completed_consultations": completed_count,
                "active_in_queue": waiting_count,
                "average_wait_minutes": avg_wait,
                "median_wait_minutes": median_wait,
                "no_show_rate_pct": no_show_rate,
                "cancellation_rate_pct": cancellation_rate,
                "doctor_utilization_pct": 84.5
            },
            "by_department": appts_by_dept,
            "by_day": daily_counts,
            "hourly_congestion": hourly_congestion
        })

    # -------------------------------------------------------------
    # NOTIFICATIONS
    # -------------------------------------------------------------
    @app.route("/api/notifications", methods=["GET"])
    @require_auth
    def get_notifications():
        user = g.current_user
        # Look for user_id or patient_id
        u_id = str(user["_id"])
        p_id = str(user.get("patient_id")) if user.get("patient_id") else None

        query = {"$or": [{"user_id": u_id}]}
        if p_id:
            query["$or"].append({"user_id": p_id})

        notifs = list(db["notifications"].find(query).sort("created_at", -1).limit(30))
        unread_count = sum(1 for n in notifs if not n.get("is_read", False))

        return jsonify({
            "notifications": serialize_doc(notifs),
            "unread_count": unread_count
        })

    @app.route("/api/notifications/<notif_id>/read", methods=["POST"])
    @require_auth
    def mark_notification_read(notif_id):
        db["notifications"].update_one(
            {"_id": str(notif_id)},
            {"$set": {"is_read": True}}
        )
        return jsonify({"message": "Notification marked as read."})

    @app.route("/api/notifications/read-all", methods=["POST"])
    @require_auth
    def mark_all_notifications_read():
        user = g.current_user
        u_id = str(user["_id"])
        db["notifications"].update_many(
            {"user_id": u_id},
            {"$set": {"is_read": True}}
        )
        return jsonify({"message": "All notifications marked as read."})

    # -------------------------------------------------------------
    # AUDIT LOGS
    # -------------------------------------------------------------
    @app.route("/api/audit-logs", methods=["GET"])
    @require_role("hospital_admin", "platform_admin")
    def get_audit_logs():
        user = g.current_user
        query = {}
        if user.get("role") == "hospital_admin" and user.get("organization_id"):
            query["organization_id"] = str(user.get("organization_id"))

        logs = list(db["audit_logs"].find(query).sort("timestamp", -1).limit(60))
        return jsonify({"audit_logs": serialize_doc(logs)})

    # -------------------------------------------------------------
    # DIGITAL PRESCRIPTIONS (Rx)
    # -------------------------------------------------------------
    @app.route("/api/prescriptions", methods=["GET"])
    @require_auth
    def get_prescriptions():
        user = g.current_user
        query = {}
        if user.get("role") == "patient":
            query["patient_id"] = str(user.get("patient_id"))
        elif request.args.get("patient_id"):
            query["patient_id"] = str(request.args.get("patient_id"))
        elif user.get("role") == "doctor":
            query["doctor_id"] = str(user.get("doctor_id"))

        rx_list = list(db["prescriptions"].find(query).sort("date", -1).limit(30))
        return jsonify({"prescriptions": serialize_doc(rx_list)})

    @app.route("/api/prescriptions", methods=["POST"])
    @require_role("doctor")
    def create_prescription():
        user = g.current_user
        data = request.get_json() or {}
        patient_id = data.get("patient_id")
        medications = data.get("medications", [])
        if not patient_id or not medications:
            return jsonify({"error": "Bad Request", "message": "patient_id and medications are required."}), 400

        doc_rec = db["doctors"].find_one({"_id": str(user.get("doctor_id"))}) or {}
        pat_rec = db["patients"].find_one({"_id": str(patient_id)}) or {}

        rx_id = f"rx-{uuid.uuid4().hex[:8]}"
        new_rx = {
            "_id": rx_id,
            "rx_number": f"CQ-RX-2026-{uuid.uuid4().hex[:4].upper()}",
            "patient_id": str(patient_id),
            "patient_name": pat_rec.get("name", "Patient"),
            "doctor_id": str(user.get("doctor_id")),
            "doctor_name": doc_rec.get("name", user.get("name")),
            "department_name": doc_rec.get("department_name", "Cardiology"),
            "organization_name": doc_rec.get("organization_name", "MetroCare Apex Hospital"),
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "diagnosis": data.get("diagnosis", "Clinical Consultation Review"),
            "medications": medications,
            "advice": data.get("advice", "Follow prescribed dosage and rest."),
            "follow_up": data.get("follow_up", "SOS in 2 weeks"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        db["prescriptions"].insert_one(new_rx)

        record_audit_log(
            user_id=str(user["_id"]),
            organization_id=doc_rec.get("organization_id"),
            action="issue_prescription",
            entity_type="prescription",
            entity_id=rx_id,
            details={"rx_number": new_rx["rx_number"], "patient_id": patient_id}
        )

        return jsonify({"message": "Prescription issued.", "prescription": serialize_doc(new_rx)}), 201

    # -------------------------------------------------------------
    # INSURANCE & COVERAGE DETAILS
    # -------------------------------------------------------------
    @app.route("/api/insurance", methods=["GET"])
    @require_auth
    def get_insurance():
        user = g.current_user
        p_id = str(user.get("patient_id")) if user.get("role") == "patient" else request.args.get("patient_id", "pat-0001")
        ins = db["insurance"].find_one({"patient_id": p_id})
        if not ins:
            ins = {
                "patient_id": p_id,
                "provider_name": "Ayushman Bharat PM-JAY / Universal Health",
                "policy_number": "AB-PMJAY-2026-8819",
                "coverage_limit": "₹ 5,00,000",
                "valid_until": "2027-12-31",
                "copay_percentage": "0%",
                "status": "active",
                "claim_status": "Pre-Approved Verified"
            }
        return jsonify({"insurance": serialize_doc(ins)})

    @app.route("/api/insurance", methods=["PATCH", "POST"])
    @require_auth
    def update_insurance():
        user = g.current_user
        p_id = str(user.get("patient_id")) if user.get("role") == "patient" else request.args.get("patient_id", "pat-0001")
        data = request.get_json() or {}
        db["insurance"].update_one(
            {"patient_id": p_id},
            {"$set": {
                "provider_name": data.get("provider_name", "Star Health Comprehensive"),
                "policy_number": data.get("policy_number", ""),
                "tpa_id": data.get("tpa_id", ""),
                "coverage_limit": data.get("coverage_limit", "₹ 5,00,000"),
                "status": "active"
            }},
            upsert=True
        )
        ins = db["insurance"].find_one({"patient_id": p_id})
        return jsonify({"message": "Insurance details updated.", "insurance": ins})

    # -------------------------------------------------------------
    # DEMO RESET
    # -------------------------------------------------------------
    @app.route("/api/demo/reset", methods=["POST"])
    @require_role("hospital_admin", "platform_admin")
    def reset_demo():
        stats = seed_database(clear_existing=True)
        record_audit_log(
            user_id=str(g.current_user["_id"]),
            organization_id=g.current_user.get("organization_id"),
            action="reset_demo_state",
            entity_type="system",
            entity_id="seed",
            details=stats
        )
        return jsonify({"message": "Demo data reset successfully.", "stats": stats})

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
