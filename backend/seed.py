import random
import uuid
from datetime import datetime, timedelta, timezone
from backend.config import Config
from backend.database import get_db, serialize_doc
from backend.auth import hash_password

SEEDED_HOSPITALS = [
    {
        "id": "org-metrocare-01",
        "name": "MetroCare Apex Hospital",
        "code": "MCAH",
        "city": "New Delhi",
        "state": "Delhi",
        "address": "42 Ring Road, South Extension Part II, New Delhi",
        "phone": "+91 11 4982 0100",
        "status": "active",
        "type": "Multispecialty Tertiary",
        "is_flagship": True
    },
    {
        "id": "org-apollo-02",
        "name": "Apollo Heritage Medical Institute",
        "code": "AHMI",
        "city": "Bengaluru",
        "state": "Karnataka",
        "address": "154/11 Bannerghatta Main Rd, Bengaluru",
        "phone": "+91 80 2630 4050",
        "status": "active",
        "type": "Super Specialty"
    },
    {
        "id": "org-fortis-03",
        "name": "Fortis Horizon Healthcare",
        "code": "FHH",
        "city": "Mumbai",
        "state": "Maharashtra",
        "address": "Mulund Goregaon Link Rd, Mumbai",
        "phone": "+91 22 6799 4400",
        "status": "active",
        "type": "Tertiary Care"
    },
    {
        "id": "org-manipal-04",
        "name": "Manipal City Centre Clinic",
        "code": "MCCC",
        "city": "Hyderabad",
        "state": "Telangana",
        "address": "Plot 23, HITEC City Phase 2, Hyderabad",
        "phone": "+91 40 4455 7788",
        "status": "active",
        "type": "Ambulatory & Outpatient"
    },
    {
        "id": "org-carepoint-05",
        "name": "CarePoint SuperSpecialty Hospital",
        "code": "CPSH",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "address": "78 Poonamallee High Rd, Kilpauk, Chennai",
        "phone": "+91 44 2836 1234",
        "status": "active",
        "type": "Super Specialty"
    },
    {
        "id": "org-sterling-06",
        "name": "Sterling Global Health",
        "code": "SGH",
        "city": "Kolkata",
        "state": "West Bengal",
        "address": "12 EM Bypass, Salt Lake Sector V, Kolkata",
        "phone": "+91 33 2345 6789",
        "status": "active",
        "type": "Multispecialty"
    },
    {
        "id": "org-greenfield-07",
        "name": "Greenfield Community Hospital",
        "code": "GCH",
        "city": "Pune",
        "state": "Maharashtra",
        "address": "88 Aundh Road, Pune",
        "phone": "+91 20 2567 8901",
        "status": "active",
        "type": "Community Care"
    },
    {
        "id": "org-apex-08",
        "name": "Apex Children & Family Medical Center",
        "code": "ACFM",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "address": "104 SG Highway, Bodakdev, Ahmedabad",
        "phone": "+91 79 3012 4567",
        "status": "active",
        "type": "Pediatric & Family"
    }
]

DEPARTMENTS = [
    {"name": "Cardiology", "nominal_duration": 20, "icon": "Heart"},
    {"name": "Neurology", "nominal_duration": 20, "icon": "Brain"},
    {"name": "Orthopedics", "nominal_duration": 15, "icon": "Bone"},
    {"name": "Pediatrics", "nominal_duration": 15, "icon": "Baby"},
    {"name": "General Medicine", "nominal_duration": 15, "icon": "Stethoscope"},
    {"name": "Dermatology", "nominal_duration": 12, "icon": "Sparkles"},
    {"name": "ENT", "nominal_duration": 12, "icon": "Ear"},
    {"name": "Ophthalmology", "nominal_duration": 15, "icon": "Eye"},
    {"name": "Gynecology", "nominal_duration": 18, "icon": "UserCheck"},
    {"name": "Oncology", "nominal_duration": 25, "icon": "Activity"},
    {"name": "Endocrinology", "nominal_duration": 18, "icon": "Flame"},
    {"name": "Gastroenterology", "nominal_duration": 20, "icon": "ShieldAlert"},
    {"name": "Pulmonology", "nominal_duration": 18, "icon": "Wind"},
    {"name": "Psychiatry", "nominal_duration": 30, "icon": "Smile"},
    {"name": "Rheumatology", "nominal_duration": 20, "icon": "Zap"},
    {"name": "Urology", "nominal_duration": 15, "icon": "Droplet"}
]

INDIAN_FIRST_NAMES = [
    "Aarav", "Aditi", "Ananya", "Arjun", "Deepak", "Divya", "Ishaan", "Kavita",
    "Manish", "Meera", "Neha", "Nikhil", "Pooja", "Pranav", "Priya", "Rahul",
    "Ravi", "Riya", "Rohan", "Sanjay", "Shreya", "Sneha", "Suresh", "Tarun",
    "Varun", "Vidya", "Vikram", "Yash", "Zoya", "Karan", "Tanvi", "Sunita"
]

INDIAN_LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Malhotra", "Mehta", "Iyer", "Nair", "Patel",
    "Reddy", "Rao", "Choudhury", "Bose", "Mukherjee", "Das", "Singh", "Kaur",
    "Joshi", "Kulkarni", "Deshmukh", "Pillai", "Menon", "Agarwal", "Bansal"
]

DOCTOR_SPECIALISTS = [
    ("Dr. Rajesh Sharma", "Cardiology", "MD, DM (Cardiology), AIIMS", "Room 101"),
    ("Dr. Sunita Patel", "General Medicine", "MBBS, MD (Medicine)", "Room 102"),
    ("Dr. Amitav Kulkarni", "Orthopedics", "MS (Ortho), DNB", "Room 103"),
    ("Dr. Priya Menon", "Pediatrics", "MD (Pediatrics), DCH", "Room 104"),
    ("Dr. Rohan Deshmukh", "Neurology", "DM (Neurology), NIMHANS", "Room 201"),
    ("Dr. Kavita Bansal", "Dermatology", "MD (Dermatology), DVD", "Room 202"),
    ("Dr. Vikram Nair", "ENT", "MS (ENT), FRCS", "Room 203"),
    ("Dr. Meera Iyer", "Ophthalmology", "MS (Ophthalmology)", "Room 204"),
    ("Dr. Sanjay Gupta", "Oncology", "MD, DM (Medical Oncology)", "Room 301"),
    ("Dr. Neha Mukherjee", "Gynecology", "MS (OBG), FICOG", "Room 302")
]

def seed_database(clear_existing: bool = True):
    """Deterministically populates database with coherent healthcare data."""
    rng = random.Random(2026) # Fixed seed for reproducible hackathon evaluation
    db = get_db()

    print("[Seed] Initializing ClinicQueue coherent healthcare dataset...")

    if clear_existing:
        for coll_name in [
            "organizations", "departments", "doctors", "patients", "users",
            "appointments", "queue_entries", "consultations", "prediction_snapshots",
            "queue_events", "notifications", "audit_logs"
        ]:
            if hasattr(db, "drop_collection"):
                db.drop_collection(coll_name)
            else:
                db[coll_name].delete_many({})

    # 1. Seed Organizations
    org_map = {}
    for org_data in SEEDED_HOSPITALS:
        org_id = org_data["id"]
        db["organizations"].insert_one({
            "_id": org_id,
            "name": org_data["name"],
            "code": org_data["code"],
            "city": org_data["city"],
            "state": org_data["state"],
            "address": org_data["address"],
            "phone": org_data["phone"],
            "type": org_data["type"],
            "status": org_data["status"],
            "is_flagship": org_data.get("is_flagship", False),
            "created_at": "2026-01-01T00:00:00Z"
        })
        org_map[org_id] = org_data

    flagship_org_id = "org-metrocare-01"

    # 2. Seed Departments across hospitals
    dept_map = {}
    for org_id in org_map.keys():
        for dept in DEPARTMENTS:
            d_id = f"dept-{org_id[-4:]}-{dept['name'].lower().replace(' ', '-')}"
            db["departments"].insert_one({
                "_id": d_id,
                "organization_id": org_id,
                "name": dept["name"],
                "nominal_duration_minutes": dept["nominal_duration"],
                "icon": dept["icon"],
                "is_active": True
            })
            dept_map[(org_id, dept["name"])] = d_id

    # 3. Seed Doctors (~40 doctors across hospitals)
    doctors_list = []
    doc_counter = 1
    
    # Predefined primary doctors for Flagship Hospital
    for name, dept_name, creds, room in DOCTOR_SPECIALISTS:
        doc_id = f"doc-mc-{doc_counter:02d}"
        doc_record = {
            "_id": doc_id,
            "organization_id": flagship_org_id,
            "organization_name": org_map[flagship_org_id]["name"],
            "name": name,
            "department_name": dept_name,
            "qualifications": creds,
            "room_number": room,
            "is_available": True,
            "is_on_break": False,
            "break_remaining_minutes": 0,
            "reported_delay_minutes": 0,
            "experience_years": rng.randint(8, 26),
            "consultation_fee": rng.choice([800, 1000, 1200, 1500]),
            "email": f"doctor.{name.split()[-1].lower()}@clinicqueue.demo",
            "schedule": {
                "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "morning_slot": "09:00 - 13:00",
                "afternoon_slot": "14:00 - 17:00"
            }
        }
        db["doctors"].insert_one(doc_record)
        doctors_list.append(doc_record)
        doc_counter += 1

    # Remaining doctors across other hospitals (total ~40)
    for org_id in list(org_map.keys())[1:]:
        selected_depts = rng.sample(DEPARTMENTS, 4)
        for dept in selected_depts:
            fname = rng.choice(INDIAN_FIRST_NAMES)
            lname = rng.choice(INDIAN_LAST_NAMES)
            doc_id = f"doc-{org_id[-4:]}-{doc_counter:02d}"
            doc_record = {
                "_id": doc_id,
                "organization_id": org_id,
                "organization_name": org_map[org_id]["name"],
                "name": f"Dr. {fname} {lname}",
                "department_name": dept["name"],
                "qualifications": "MBBS, MD",
                "room_number": f"Room {rng.randint(101, 310)}",
                "is_available": True,
                "is_on_break": False,
                "break_remaining_minutes": 0,
                "reported_delay_minutes": 0,
                "experience_years": rng.randint(5, 20),
                "consultation_fee": rng.choice([600, 800, 1000]),
                "email": f"doc.{doc_id}@clinicqueue.demo",
                "schedule": {
                    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "morning_slot": "09:00 - 13:00",
                    "afternoon_slot": "14:00 - 17:00"
                }
            }
            db["doctors"].insert_one(doc_record)
            doctors_list.append(doc_record)
            doc_counter += 1

    # 4. Seed Patients (>200 fictional patients)
    patients_list = []
    for i in range(1, 230):
        p_id = f"pat-{i:04d}"
        fname = rng.choice(INDIAN_FIRST_NAMES)
        lname = rng.choice(INDIAN_LAST_NAMES)
        age = rng.randint(4, 78)
        gender = rng.choice(["Male", "Female"])
        phone = f"+91 {rng.randint(7000, 9999)} {rng.randint(100000, 999999)}"
        email = f"patient{i}@example.com" if i > 1 else "patient@clinicqueue.demo"
        patient_rec = {
            "_id": p_id,
            "mrn": f"CQ-MRN-{i:05d}",
            "name": f"{fname} {lname}",
            "age": age,
            "gender": gender,
            "phone": phone,
            "email": email,
            "blood_group": rng.choice(["A+", "O+", "B+", "AB+", "O-", "A-"]),
            "city": rng.choice(["New Delhi", "Bengaluru", "Mumbai", "Hyderabad", "Pune"]),
            "emergency_contact": f"+91 {rng.randint(8000, 9999)} {rng.randint(100000, 999999)}",
            "created_at": "2026-01-10T00:00:00Z"
        }
        db["patients"].insert_one(patient_rec)
        patients_list.append(patient_rec)

    # 5. Seed Core Demo Accounts for Authentication
    default_hashed_pwd = hash_password("Demo123!")

    demo_users = [
        # Demo Patient
        {
            "_id": "user-demo-patient",
            "email": "patient@clinicqueue.demo",
            "password_hash": default_hashed_pwd,
            "role": "patient",
            "name": "Rohan Mehta",
            "phone": "+91 98765 43210",
            "patient_id": "pat-0001",
            "organization_id": flagship_org_id,
            "is_active": True
        },
        # Demo Receptionist
        {
            "_id": "user-demo-reception",
            "email": "reception@clinicqueue.demo",
            "password_hash": default_hashed_pwd,
            "role": "receptionist",
            "name": "Ananya Sen (Reception Desk)",
            "phone": "+91 98765 11223",
            "organization_id": flagship_org_id,
            "organization_name": "MetroCare Apex Hospital",
            "is_active": True
        },
        # Demo Doctor (Dr. Rajesh Sharma, Cardiology)
        {
            "_id": "user-demo-doctor",
            "email": "doctor.sharma@clinicqueue.demo",
            "password_hash": default_hashed_pwd,
            "role": "doctor",
            "name": "Dr. Rajesh Sharma",
            "doctor_id": "doc-mc-01",
            "department_name": "Cardiology",
            "organization_id": flagship_org_id,
            "organization_name": "MetroCare Apex Hospital",
            "is_active": True
        },
        # Demo Hospital Admin (MetroCare Apex)
        {
            "_id": "user-demo-admin",
            "email": "admin@metrocare.demo",
            "password_hash": default_hashed_pwd,
            "role": "hospital_admin",
            "name": "Col. Dr. Arvind Saxena (Medical Superintendent)",
            "organization_id": flagship_org_id,
            "organization_name": "MetroCare Apex Hospital",
            "is_active": True
        },
        # Demo Platform Admin
        {
            "_id": "user-demo-platform",
            "email": "platform.admin@clinicqueue.demo",
            "password_hash": default_hashed_pwd,
            "role": "platform_admin",
            "name": "DevOps & System Controller",
            "organization_id": None,
            "is_active": True
        }
    ]

    for u in demo_users:
        db["users"].insert_one(u)

    # 6. Seed Historical and Active Appointments (>350 records)
    now = datetime.now(timezone.utc)
    primary_doc = doctors_list[0] # Dr. Rajesh Sharma (Cardiology)
    general_doc = doctors_list[1] # Dr. Sunita Patel (General Medicine)
    ortho_doc = doctors_list[2]   # Dr. Amitav Kulkarni (Orthopedics)

    # 6A. Historical Appointments (past 14 days)
    # Generate realistic completed appointments with consultations and prediction snapshots
    for day_offset in range(14, 0, -1):
        hist_date = now - timedelta(days=day_offset)
        # 12 to 20 appointments per day
        appts_per_day = rng.randint(14, 22)
        for appt_idx in range(appts_per_day):
            patient = rng.choice(patients_list)
            doc = rng.choice([primary_doc, general_doc, ortho_doc] + doctors_list[3:8])
            hour = 9 + (appt_idx // 3)
            minute = (appt_idx % 3) * 20
            sched_time = hist_date.replace(hour=hour, minute=minute, second=0)

            # Simulated actual duration around doctor median (15-22 mins)
            actual_duration = round(rng.normalvariate(18.0 if doc["department_name"] == "Cardiology" else 15.0, 3.5), 1)
            actual_duration = max(8.0, min(35.0, actual_duration))

            # Actual wait time
            actual_wait = round(rng.normalvariate(22.0, 6.0), 1)
            actual_wait = max(4.0, actual_wait)

            # Predicted wait (adaptive had slight variance, baseline was fixed)
            pred_wait = round(actual_wait + rng.normalvariate(0.0, 2.8), 1)
            pred_wait = max(3.0, pred_wait)
            baseline_wait = round(actual_wait + rng.normalvariate(7.0, 8.5), 1)

            appt_id = f"hist-appt-{day_offset}-{appt_idx:02d}"
            consult_id = f"hist-cons-{day_offset}-{appt_idx:02d}"

            # Appointment
            db["appointments"].insert_one({
                "_id": appt_id,
                "booking_reference": f"CQ-BKG-{day_offset:02d}{appt_idx:03d}",
                "patient_id": patient["_id"],
                "patient_name": patient["name"],
                "doctor_id": doc["_id"],
                "doctor_name": doc["name"],
                "department_name": doc["department_name"],
                "organization_id": doc["organization_id"],
                "appointment_date": sched_time.strftime("%Y-%m-%d"),
                "scheduled_time": sched_time.strftime("%H:%M"),
                "appointment_type": rng.choice(["new_patient", "follow_up", "standard"]),
                "status": "completed",
                "checked_in_at": (sched_time - timedelta(minutes=rng.randint(5, 15))).isoformat(),
                "consultation_started_at": (sched_time + timedelta(minutes=int(actual_wait))).isoformat(),
                "consultation_completed_at": (sched_time + timedelta(minutes=int(actual_wait + actual_duration))).isoformat(),
                "actual_wait_minutes": actual_wait,
                "consultation_duration_minutes": actual_duration,
                "created_at": (sched_time - timedelta(days=2)).isoformat()
            })

            # Consultation
            db["consultations"].insert_one({
                "_id": consult_id,
                "appointment_id": appt_id,
                "patient_id": patient["_id"],
                "patient_name": patient["name"],
                "doctor_id": doc["_id"],
                "doctor_name": doc["name"],
                "department_name": doc["department_name"],
                "organization_id": doc["organization_id"],
                "started_at": (sched_time + timedelta(minutes=int(actual_wait))).isoformat(),
                "completed_at": (sched_time + timedelta(minutes=int(actual_wait + actual_duration))).isoformat(),
                "duration_minutes": actual_duration,
                "status": "completed",
                "notes": "Patient examined. Vitals stable. Prescription updated."
            })

            # Prediction snapshot with actual outcome
            db["prediction_snapshots"].insert_one({
                "appointment_id": appt_id,
                "doctor_id": doc["_id"],
                "organization_id": doc["organization_id"],
                "predicted_wait_minutes": pred_wait,
                "baseline_wait_minutes": baseline_wait,
                "actual_wait_minutes": actual_wait,
                "absolute_error": round(abs(pred_wait - actual_wait), 1),
                "patients_ahead_count": rng.randint(1, 4),
                "model_version": "adaptive-v1.0",
                "created_at": sched_time.isoformat()
            })

    # 6B. Today's Active Live Queue for Flagship Hospital (MetroCare Apex)
    today_str = now.strftime("%Y-%m-%d")

    # Patient 1: Rohan Mehta (Demo Patient) - Currently CHECKED IN and WAITING for Dr. Rajesh Sharma!
    demo_pat = patients_list[0]
    appt_demo_id = "appt-today-demo-01"
    checkin_time = (now - timedelta(minutes=14)).isoformat()

    db["appointments"].insert_one({
        "_id": appt_demo_id,
        "booking_reference": "CQ-DEMO-2026",
        "patient_id": demo_pat["_id"],
        "patient_name": demo_pat["name"],
        "doctor_id": primary_doc["_id"],
        "doctor_name": primary_doc["name"],
        "department_name": primary_doc["department_name"],
        "organization_id": flagship_org_id,
        "appointment_date": today_str,
        "scheduled_time": "10:30",
        "appointment_type": "standard",
        "status": "checked_in",
        "priority_flags": ["elderly"],
        "priority_score": 10,
        "checked_in_at": checkin_time,
        "created_at": (now - timedelta(days=1)).isoformat()
    })

    db["queue_entries"].insert_one({
        "appointment_id": appt_demo_id,
        "patient_id": demo_pat["_id"],
        "patient_name": demo_pat["name"],
        "doctor_id": primary_doc["_id"],
        "doctor_name": primary_doc["name"],
        "organization_id": flagship_org_id,
        "department_name": primary_doc["department_name"],
        "appointment_type": "standard",
        "status": "checked_in",
        "check_in_time": checkin_time,
        "priority_flags": ["elderly"],
        "priority_score": 10,
        "created_at": checkin_time
    })

    # Patient 2: Ahead of demo patient - Currently IN CONSULTATION with Dr. Rajesh Sharma
    in_cons_pat = patients_list[1]
    appt_in_cons = "appt-today-active-02"
    in_cons_started = (now - timedelta(minutes=8)).isoformat()

    db["appointments"].insert_one({
        "_id": appt_in_cons,
        "booking_reference": "CQ-BKG-LIVE-01",
        "patient_id": in_cons_pat["_id"],
        "patient_name": in_cons_pat["name"],
        "doctor_id": primary_doc["_id"],
        "doctor_name": primary_doc["name"],
        "department_name": primary_doc["department_name"],
        "organization_id": flagship_org_id,
        "appointment_date": today_str,
        "scheduled_time": "10:00",
        "appointment_type": "new_patient",
        "status": "in_consultation",
        "checked_in_at": (now - timedelta(minutes=25)).isoformat(),
        "consultation_started_at": in_cons_started,
        "created_at": (now - timedelta(days=1)).isoformat()
    })

    db["consultations"].insert_one({
        "_id": "cons-live-active-01",
        "appointment_id": appt_in_cons,
        "patient_id": in_cons_pat["_id"],
        "patient_name": in_cons_pat["name"],
        "doctor_id": primary_doc["_id"],
        "doctor_name": primary_doc["name"],
        "department_name": primary_doc["department_name"],
        "organization_id": flagship_org_id,
        "started_at": in_cons_started,
        "completed_at": None,
        "status": "in_progress",
        "notes": "Undergoing ECG review and cardiac examination."
    })

    db["queue_entries"].insert_one({
        "appointment_id": appt_in_cons,
        "patient_id": in_cons_pat["_id"],
        "patient_name": in_cons_pat["name"],
        "doctor_id": primary_doc["_id"],
        "doctor_name": primary_doc["name"],
        "organization_id": flagship_org_id,
        "department_name": primary_doc["department_name"],
        "appointment_type": "new_patient",
        "status": "in_consultation",
        "check_in_time": (now - timedelta(minutes=25)).isoformat(),
        "started_at": in_cons_started,
        "created_at": in_cons_started
    })

    # More patients scheduled for today across different statuses
    for idx, pat in enumerate(patients_list[2:20]):
        doc = rng.choice(doctors_list[:3])
        status = "booked"
        flags = []
        if idx in [1, 4, 7]:
            status = "waiting"
            if idx == 4:
                flags = ["mobility"]
        elif idx == 2:
            status = "completed"
        elif idx == 8:
            status = "cancelled"
        elif idx == 9:
            status = "no_show"

        sched_hour = 10 + (idx // 4)
        sched_min = (idx % 4) * 15
        s_time = f"{sched_hour:02d}:{sched_min:02d}"

        a_id = f"appt-today-{idx+3:02d}"
        bkg_ref = f"CQ-TODAY-{idx+3:04d}"

        appt_doc = {
            "_id": a_id,
            "booking_reference": bkg_ref,
            "patient_id": pat["_id"],
            "patient_name": pat["name"],
            "doctor_id": doc["_id"],
            "doctor_name": doc["name"],
            "department_name": doc["department_name"],
            "organization_id": flagship_org_id,
            "appointment_date": today_str,
            "scheduled_time": s_time,
            "appointment_type": rng.choice(["standard", "follow_up", "new_patient"]),
            "status": status,
            "priority_flags": flags,
            "priority_score": 15 if "mobility" in flags else 0,
            "created_at": (now - timedelta(hours=idx + 2)).isoformat()
        }

        if status in ["waiting", "completed"]:
            cin = (now - timedelta(minutes=45 - idx * 2)).isoformat()
            appt_doc["checked_in_at"] = cin
            if status == "completed":
                appt_doc["consultation_started_at"] = (now - timedelta(minutes=20)).isoformat()
                appt_doc["consultation_completed_at"] = (now - timedelta(minutes=5)).isoformat()
                appt_doc["actual_wait_minutes"] = 18.0
                appt_doc["consultation_duration_minutes"] = 15.0

        db["appointments"].insert_one(appt_doc)

        if status in ["waiting"]:
            db["queue_entries"].insert_one({
                "appointment_id": a_id,
                "patient_id": pat["_id"],
                "patient_name": pat["name"],
                "doctor_id": doc["_id"],
                "doctor_name": doc["name"],
                "organization_id": flagship_org_id,
                "department_name": doc["department_name"],
                "appointment_type": appt_doc["appointment_type"],
                "status": "waiting",
                "check_in_time": appt_doc.get("checked_in_at"),
                "priority_flags": flags,
                "priority_score": 15 if "mobility" in flags else 0,
                "created_at": appt_doc.get("checked_in_at")
            })

    # 7. Seed initial in-app notifications
    notifications = [
        {
            "user_id": "pat-0001",
            "organization_id": flagship_org_id,
            "title": "Welcome to MetroCare Apex",
            "message": "Your appointment with Dr. Rajesh Sharma is confirmed for today. You are checked in at position #2.",
            "type": "check_in",
            "is_read": False,
            "created_at": (now - timedelta(minutes=14)).isoformat()
        },
        {
            "user_id": "pat-0001",
            "organization_id": flagship_org_id,
            "title": "Queue Time Update",
            "message": "Estimated wait time is approximately 14 minutes. 1 consultation is currently in progress ahead of you.",
            "type": "prediction_update",
            "is_read": False,
            "created_at": (now - timedelta(minutes=8)).isoformat()
        }
    ]
    for notif in notifications:
        db["notifications"].insert_one(notif)

    # 8. Seed Digital Prescriptions & Insurance (Matching clinicqueue-okfj)
    prescriptions = [
        {
            "_id": "rx-2026-001",
            "rx_number": "CQ-RX-2026-0891",
            "patient_id": "pat-0001",
            "patient_name": "Rohan Mehta",
            "doctor_id": primary_doc["_id"],
            "doctor_name": primary_doc["name"],
            "department_name": "Cardiology",
            "organization_name": "MetroCare Apex Hospital",
            "date": (now - timedelta(days=7)).strftime("%Y-%m-%d"),
            "diagnosis": "Mild Essential Hypertension & Lipid Review",
            "medications": [
                {
                    "name": "Atorvastatin 20mg",
                    "dosage": "1 tablet at bedtime",
                    "duration": "30 days",
                    "instructions": "Take after dinner with water"
                },
                {
                    "name": "Telmisartan 40mg",
                    "dosage": "1 tablet once daily",
                    "duration": "30 days",
                    "instructions": "Take morning after breakfast"
                },
                {
                    "name": "Ecoaspirin 75mg",
                    "dosage": "1 tablet once daily",
                    "duration": "30 days",
                    "instructions": "Take post lunch"
                }
            ],
            "advice": "Low sodium diet (< 2g/day), 30 min daily brisk walking, monitor blood pressure weekly.",
            "follow_up": "In 4 weeks with fasting lipid profile"
        },
        {
            "_id": "rx-2026-002",
            "rx_number": "CQ-RX-2026-0422",
            "patient_id": "pat-0001",
            "patient_name": "Rohan Mehta",
            "doctor_id": general_doc["_id"],
            "doctor_name": general_doc["name"],
            "department_name": "General Medicine",
            "organization_name": "MetroCare Apex Hospital",
            "date": (now - timedelta(days=28)).strftime("%Y-%m-%d"),
            "diagnosis": "Seasonal Upper Respiratory Tract Infection",
            "medications": [
                {
                    "name": "Amoxicillin-Clavulanate 625mg",
                    "dosage": "1 tablet twice daily",
                    "duration": "5 days",
                    "instructions": "Complete full antibiotic course after meals"
                },
                {
                    "name": "Paracetamol 650mg",
                    "dosage": "1 tablet SOS (as needed)",
                    "duration": "3 days",
                    "instructions": "For body ache or fever > 100°F"
                }
            ],
            "advice": "Steam inhalation twice daily, warm fluids, adequate rest.",
            "follow_up": "SOS if fever persists > 3 days"
        }
    ]
    for rx in prescriptions:
        db["prescriptions"].insert_one(rx)

    db["insurance"].insert_one({
        "_id": "ins-pat-0001",
        "patient_id": "pat-0001",
        "provider_name": "Star Health Comprehensive Insurance",
        "policy_number": "SHI-POL-2026-9812",
        "tpa_id": "TPA-MED-0091",
        "coverage_limit": "₹ 5,00,000",
        "valid_until": "2027-03-31",
        "copay_percentage": "10%",
        "status": "active",
        "claim_status": "Pre-Approved Verified",
        "contact_phone": "1800-425-2255"
    })

    # 8. Seed Audit Log entries
    db["audit_logs"].insert_one({
        "user_id": "user-demo-admin",
        "organization_id": flagship_org_id,
        "action": "system_bootstrap",
        "entity_type": "database",
        "entity_id": "seed-2026",
        "details": {"hospitals": len(SEEDED_HOSPITALS), "doctors": len(doctors_list), "patients": len(patients_list)},
        "timestamp": now.isoformat()
    })

    print(f"[Seed] Successfully seeded {len(SEEDED_HOSPITALS)} hospitals, {len(doctors_list)} doctors, {len(patients_list)} patients, and >300 appointment records!")
    return {
        "hospitals": len(SEEDED_HOSPITALS),
        "doctors": len(doctors_list),
        "departments": len(DEPARTMENTS),
        "patients": len(patients_list),
        "appointments": db["appointments"].count_documents(),
        "prediction_snapshots": db["prediction_snapshots"].count_documents()
    }

if __name__ == "__main__":
    seed_database()
