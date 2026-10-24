import {
  User,
  Doctor,
  Patient,
  Appointment,
  QueueEntry,
  Consultation,
  Organization,
  Department,
  Prescription,
  Insurance,
  SimulationResult,
  PredictionEvaluation,
  NotificationItem
} from './types';
import mockData from './mockData.json';

const HOSPITALS: Organization[] = [
  {
    _id: 'org-metrocare-01',
    name: 'MetroCare Apex Hospital',
    code: 'MCAH',
    city: 'New Delhi',
    state: 'Delhi',
    address: '42 Ring Road, South Extension Part II, New Delhi',
    phone: '+91 11 4982 0100',
    status: 'active',
    type: 'Multispecialty Tertiary',
    is_flagship: true
  },
  {
    _id: 'org-apollo-02',
    name: 'Apollo Heritage Medical Institute',
    code: 'AHMI',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '154/11 Bannerghatta Main Rd, Bengaluru',
    phone: '+91 80 2630 4050',
    status: 'active',
    type: 'Super Specialty'
  },
  {
    _id: 'org-fortis-03',
    name: 'Fortis Horizon Healthcare',
    code: 'FHH',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Mulund Goregaon Link Rd, Mumbai',
    phone: '+91 22 6799 4400',
    status: 'active',
    type: 'Tertiary Care'
  },
  {
    _id: 'org-manipal-04',
    name: 'Manipal City Centre Clinic',
    code: 'MCCC',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Plot 23, HITEC City Phase 2, Hyderabad',
    phone: '+91 40 4455 7788',
    status: 'active',
    type: 'Ambulatory & Outpatient'
  }
];

const DEPARTMENTS: Department[] = [
  { _id: 'dept-cardio', organization_id: 'org-metrocare-01', name: 'Cardiology', nominal_duration_minutes: 20, is_active: true },
  { _id: 'dept-neuro', organization_id: 'org-metrocare-01', name: 'Neurology', nominal_duration_minutes: 20, is_active: true },
  { _id: 'dept-ortho', organization_id: 'org-metrocare-01', name: 'Orthopedics', nominal_duration_minutes: 15, is_active: true },
  { _id: 'dept-pedia', organization_id: 'org-metrocare-01', name: 'Pediatrics', nominal_duration_minutes: 15, is_active: true },
  { _id: 'dept-genmed', organization_id: 'org-metrocare-01', name: 'General Medicine', nominal_duration_minutes: 15, is_active: true },
  { _id: 'dept-derma', organization_id: 'org-metrocare-01', name: 'Dermatology', nominal_duration_minutes: 12, is_active: true },
  { _id: 'dept-ent', organization_id: 'org-metrocare-01', name: 'ENT', nominal_duration_minutes: 12, is_active: true },
  { _id: 'dept-onco', organization_id: 'org-metrocare-01', name: 'Oncology', nominal_duration_minutes: 25, is_active: true }
];

const DOCTORS: Doctor[] = [
  {
    _id: 'doc-mc-01',
    organization_id: 'org-metrocare-01',
    organization_name: 'MetroCare Apex Hospital',
    name: 'Dr. Rajesh Sharma',
    department_name: 'Cardiology',
    qualifications: 'MD, DM (Cardiology), AIIMS',
    room_number: 'Room 101',
    is_available: true,
    is_on_break: false,
    break_remaining_minutes: 0,
    reported_delay_minutes: 0,
    experience_years: 18,
    consultation_fee: 1200,
    email: 'doctor.sharma@clinicqueue.demo'
  },
  {
    _id: 'doc-mc-02',
    organization_id: 'org-metrocare-01',
    organization_name: 'MetroCare Apex Hospital',
    name: 'Dr. Sunita Patel',
    department_name: 'General Medicine',
    qualifications: 'MBBS, MD (Medicine)',
    room_number: 'Room 102',
    is_available: true,
    is_on_break: false,
    break_remaining_minutes: 0,
    reported_delay_minutes: 0,
    experience_years: 14,
    consultation_fee: 800,
    email: 'doctor.patel@clinicqueue.demo'
  },
  {
    _id: 'doc-mc-03',
    organization_id: 'org-metrocare-01',
    organization_name: 'MetroCare Apex Hospital',
    name: 'Dr. Amitav Kulkarni',
    department_name: 'Orthopedics',
    qualifications: 'MS (Ortho), DNB',
    room_number: 'Room 103',
    is_available: true,
    is_on_break: false,
    break_remaining_minutes: 0,
    reported_delay_minutes: 0,
    experience_years: 16,
    consultation_fee: 1000,
    email: 'doctor.kulkarni@clinicqueue.demo'
  },
  {
    _id: 'doc-mc-04',
    organization_id: 'org-metrocare-01',
    organization_name: 'MetroCare Apex Hospital',
    name: 'Dr. Priya Menon',
    department_name: 'Pediatrics',
    qualifications: 'MD (Pediatrics), DCH',
    room_number: 'Room 104',
    is_available: true,
    is_on_break: false,
    break_remaining_minutes: 0,
    reported_delay_minutes: 0,
    experience_years: 12,
    consultation_fee: 800,
    email: 'doctor.menon@clinicqueue.demo'
  },
  {
    _id: 'doc-mc-05',
    organization_id: 'org-metrocare-01',
    organization_name: 'MetroCare Apex Hospital',
    name: 'Dr. Rohan Deshmukh',
    department_name: 'Neurology',
    qualifications: 'DM (Neurology), NIMHANS',
    room_number: 'Room 201',
    is_available: true,
    is_on_break: false,
    break_remaining_minutes: 0,
    reported_delay_minutes: 0,
    experience_years: 20,
    consultation_fee: 1500,
    email: 'doctor.deshmukh@clinicqueue.demo'
  }
];

const INITIAL_USERS: Record<string, User> = {
  patient: {
    _id: 'user-demo-patient',
    email: 'patient@clinicqueue.demo',
    name: 'Rohan Mehta',
    role: 'patient',
    phone: '+91 98765 43210',
    mrn: 'CQ-MRN-00001',
    patient_id: 'pat-0001',
    organization_id: 'org-metrocare-01',
    organization_name: 'MetroCare Apex Hospital'
  },
  doctor: {
    _id: 'user-demo-doctor',
    email: 'doctor.sharma@clinicqueue.demo',
    name: 'Dr. Rajesh Sharma',
    role: 'doctor',
    phone: '+91 98111 22334',
    doctor_id: 'doc-mc-01',
    organization_id: 'org-metrocare-01',
    organization_name: 'MetroCare Apex Hospital'
  },
  receptionist: {
    _id: 'user-demo-reception',
    email: 'reception@clinicqueue.demo',
    name: 'Ananya Sen',
    role: 'receptionist',
    phone: '+91 98222 33445',
    organization_id: 'org-metrocare-01',
    organization_name: 'MetroCare Apex Hospital'
  }
};

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    _id: 'appt-001',
    booking_reference: 'CQ-2026-9812',
    patient_id: 'pat-0001',
    patient_name: 'Rohan Mehta',
    doctor_id: 'doc-mc-01',
    doctor_name: 'Dr. Rajesh Sharma',
    department_name: 'Cardiology',
    organization_id: 'org-metrocare-01',
    appointment_date: '2026-10-25',
    scheduled_time: '10:00',
    appointment_type: 'standard',
    status: 'waiting',
    check_in_time: '2026-10-25T09:45:00Z',
    priority_flags: ['Standard'],
    created_at: '2026-10-24T18:00:00Z',
    live_prediction: {
      appointment_id: 'appt-001',
      doctor_id: 'doc-mc-01',
      organization_id: 'org-metrocare-01',
      predicted_wait_minutes: 14,
      estimated_wait_minutes: 14,
      queue_position: 2,
      confidence_score: 0.92,
      estimated_consultation_time: '2026-10-25T10:14:00Z',
      patients_ahead_count: 1,
      predicted_start_time: '2026-10-25T10:14:00Z',
      uncertainty_window_minutes: 4,
      active_consultation_in_progress: true,
      doctor_median_duration: 16,
      model_version: 'v2.6-adaptive',
      timestamp: new Date().toISOString(),
      explanations: ['Doctor pacing is steady at 1.02x', 'Active consultation is 8m into session'],
      factors: {
        patients_ahead: 1,
        doctor_pacing_factor: 1.02,
        nominal_duration_minutes: 20
      }
    }
  },
  {
    _id: 'appt-002',
    booking_reference: 'CQ-2026-7734',
    patient_id: 'pat-0002',
    patient_name: 'Sanjay Gupta',
    doctor_id: 'doc-mc-01',
    doctor_name: 'Dr. Rajesh Sharma',
    department_name: 'Cardiology',
    organization_id: 'org-metrocare-01',
    appointment_date: '2026-10-25',
    scheduled_time: '09:30',
    appointment_type: 'standard',
    status: 'in_consultation',
    check_in_time: '2026-10-25T09:20:00Z',
    consultation_started_at: new Date(Date.now() - 8 * 60000).toISOString(),
    priority_flags: ['Senior Citizen'],
    created_at: '2026-10-24T17:00:00Z'
  },
  {
    _id: 'appt-003',
    booking_reference: 'CQ-2026-5521',
    patient_id: 'pat-0003',
    patient_name: 'Pooja Verma',
    doctor_id: 'doc-mc-01',
    doctor_name: 'Dr. Rajesh Sharma',
    department_name: 'Cardiology',
    organization_id: 'org-metrocare-01',
    appointment_date: '2026-10-25',
    scheduled_time: '10:30',
    appointment_type: 'standard',
    status: 'booked',
    created_at: '2026-10-24T19:00:00Z'
  },
  {
    _id: 'appt-004',
    booking_reference: 'CQ-2026-3390',
    patient_id: 'pat-0004',
    patient_name: 'Vikram Nair',
    doctor_id: 'doc-mc-02',
    doctor_name: 'Dr. Sunita Patel',
    department_name: 'General Medicine',
    organization_id: 'org-metrocare-01',
    appointment_date: '2026-10-25',
    scheduled_time: '11:00',
    appointment_type: 'standard',
    status: 'booked',
    created_at: '2026-10-24T19:30:00Z'
  },
  {
    _id: 'appt-005',
    booking_reference: 'CQ-2026-1182',
    patient_id: 'pat-0005',
    patient_name: 'Aditi Rao',
    doctor_id: 'doc-mc-01',
    doctor_name: 'Dr. Rajesh Sharma',
    department_name: 'Cardiology',
    organization_id: 'org-metrocare-01',
    appointment_date: '2026-10-24',
    scheduled_time: '14:00',
    appointment_type: 'follow_up',
    status: 'completed',
    check_in_time: '2026-10-24T13:50:00Z',
    consultation_started_at: '2026-10-24T14:05:00Z',
    consultation_completed_at: '2026-10-24T14:22:00Z',
    consultation_duration_minutes: 17,
    created_at: '2026-10-23T10:00:00Z'
  }
];

const INITIAL_QUEUE: QueueEntry[] = [
  {
    _id: 'q-001',
    appointment_id: 'appt-002',
    patient_id: 'pat-0002',
    patient_name: 'Sanjay Gupta',
    doctor_id: 'doc-mc-01',
    doctor_name: 'Dr. Rajesh Sharma',
    department_name: 'Cardiology',
    organization_id: 'org-metrocare-01',
    appointment_type: 'standard',
    status: 'in_consultation',
    queue_position: 1,
    predicted_wait_minutes: 0,
    check_in_time: '2026-10-25T09:20:00Z',
    priority_flags: ['Senior Citizen']
  },
  {
    _id: 'q-002',
    appointment_id: 'appt-001',
    patient_id: 'pat-0001',
    patient_name: 'Rohan Mehta',
    doctor_id: 'doc-mc-01',
    doctor_name: 'Dr. Rajesh Sharma',
    department_name: 'Cardiology',
    organization_id: 'org-metrocare-01',
    appointment_type: 'standard',
    status: 'waiting',
    queue_position: 2,
    predicted_wait_minutes: 14,
    check_in_time: '2026-10-25T09:45:00Z',
    priority_flags: ['Standard']
  }
];

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    _id: 'rx-001',
    rx_number: 'CQ-RX-2026-081',
    prescription_number: 'CQ-RX-2026-081',
    patient_id: 'pat-0001',
    patient_name: 'Rohan Mehta',
    doctor_id: 'doc-mc-01',
    doctor_name: 'Dr. Rajesh Sharma',
    department_name: 'Cardiology',
    organization_name: 'MetroCare Apex Hospital',
    date: '2026-10-24',
    issued_date: '2026-10-24',
    diagnosis: 'Mild Hypertension & Dyslipidemia',
    medications: [
      { name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily (Night)', duration: '30 days', instructions: 'Take after dinner' },
      { name: 'Telmisartan', dosage: '40mg', frequency: 'Once daily (Morning)', duration: '30 days', instructions: 'Take after breakfast' }
    ],
    advice: 'Low-sodium diet, 30 minutes daily walking. Re-check BP in 2 weeks.',
    notes: 'Low-sodium diet, 30 minutes daily walking. Re-check BP in 2 weeks.',
    follow_up: '2 weeks'
  }
];

class MockStore {
  private users = INITIAL_USERS;
  private hospitals: Organization[] = (mockData.organizations as any) || HOSPITALS;
  private departments: Department[] = (mockData.departments as any) || DEPARTMENTS;
  private doctors: Doctor[] = (mockData.doctors as any) || [...DOCTORS];
  private patients: Patient[] = (mockData.patients as any) || [];
  private appointments: Appointment[] = (mockData.appointments as any) || [...INITIAL_APPOINTMENTS];
  private queue: QueueEntry[] = (mockData.queue_entries as any) || [...INITIAL_QUEUE];
  private consultations: Consultation[] = (mockData.consultations as any) || [];
  private predictionSnapshots: any[] = (mockData.prediction_snapshots as any) || [];
  private prescriptions: Prescription[] = (mockData.prescriptions as any) || [...INITIAL_PRESCRIPTIONS];
  private activeConsultation: Consultation | null = {
    _id: 'cons-live-active-01',
    appointment_id: 'appt-today-003',
    patient_id: 'pat-0002',
    patient_name: 'Sanjay Gupta',
    doctor_id: 'doc-mc-01',
    doctor_name: 'Dr. Rajesh Sharma',
    department_name: 'Cardiology',
    organization_id: 'org-metrocare-01',
    started_at: new Date(Date.now() - 8 * 60000).toISOString(),
    status: 'in_progress',
    notes: 'Consultation underway, patient symptoms under clinical evaluation.'
  };
  private insurance: Insurance = (mockData.insurance && mockData.insurance[0]) ? (mockData.insurance[0] as any) : {
    _id: 'ins-001',
    patient_id: 'pat-0001',
    provider_name: 'Star Health Comprehensive Insurance',
    policy_number: 'SHI-POL-2026-9812',
    tpa_id: 'TPA-MED-0091',
    coverage_limit: '₹ 5,00,000',
    copay_percentage: '10%',
    valid_until: '2027-03-31',
    status: 'active',
    claim_status: 'Pre-Approved Verified'
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem('clinicqueue_mock_db_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appointments && parsed.appointments.length > 50) this.appointments = parsed.appointments;
        if (parsed.queue && parsed.queue.length > 10) this.queue = parsed.queue;
        if (parsed.doctors && parsed.doctors.length > 10) this.doctors = parsed.doctors;
        if (parsed.prescriptions) this.prescriptions = parsed.prescriptions;
        if (parsed.insurance) this.insurance = parsed.insurance;
        if (parsed.activeConsultation !== undefined) this.activeConsultation = parsed.activeConsultation;
      }
    } catch {}
  }

  private save() {
    try {
      localStorage.setItem(
        'clinicqueue_mock_db_v3',
        JSON.stringify({
          appointments: this.appointments,
          queue: this.queue,
          doctors: this.doctors,
          prescriptions: this.prescriptions,
          insurance: this.insurance,
          activeConsultation: this.activeConsultation
        })
      );
    } catch {}
  }

  // Handle Mock Requests
  handleRequest<T>(endpoint: string, options: RequestInit = {}): T {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : {};

    // 1. Health
    if (endpoint === '/health') {
      return { status: 'healthy', storage: { type: 'client_store', is_atlas: true }, version: '1.0.0' } as T;
    }

    // 2. Demo Switch
    if (endpoint === '/auth/demo-switch') {
      const targetRole = body.role || 'patient';
      const user = this.users[targetRole] || this.users.patient;
      const token = `mock-token-${targetRole}-${Date.now()}`;
      return { token, user } as T;
    }

    // 3. Login
    if (endpoint === '/auth/login') {
      const email = (body.email || '').toLowerCase();
      let user = this.users.patient;
      if (email.includes('doctor')) user = this.users.doctor;
      else if (email.includes('reception')) user = this.users.receptionist;
      const token = `mock-token-${user.role}-${Date.now()}`;
      return { token, user } as T;
    }

    // 4. Register
    if (endpoint === '/auth/register') {
      const newUser: User = {
        _id: `user-${Date.now()}`,
        email: body.email,
        name: body.name,
        role: 'patient',
        phone: body.phone,
        mrn: `CQ-MRN-${Math.floor(1000 + Math.random() * 9000)}`,
        patient_id: `pat-${Date.now()}`,
        organization_id: 'org-metrocare-01',
        organization_name: 'MetroCare Apex Hospital'
      };
      const token = `mock-token-patient-${Date.now()}`;
      return { token, user: newUser } as T;
    }

    // 5. Auth /me
    if (endpoint === '/auth/me') {
      const token = localStorage.getItem('clinicqueue_token') || '';
      let role = 'patient';
      if (token.includes('doctor')) role = 'doctor';
      else if (token.includes('reception')) role = 'receptionist';
      return { user: this.users[role] || this.users.patient } as T;
    }

    // 6. Organizations
    if (endpoint === '/organizations') {
      return { organizations: this.hospitals } as T;
    }

    // 7. Departments
    if (endpoint.startsWith('/departments')) {
      return { departments: this.departments } as T;
    }

    // 8. Doctors
    if (endpoint.startsWith('/doctors')) {
      if (method === 'GET') {
        const parts = endpoint.split('/');
        if (parts.length > 2 && parts[2]) {
          const doc = this.doctors.find((d) => d._id === parts[2]) || this.doctors[0];
          return { doctor: doc } as T;
        }
        return { doctors: this.doctors } as T;
      }
      if (endpoint.includes('/break')) {
        const docId = endpoint.split('/')[2];
        const doc = this.doctors.find((d) => d._id === docId);
        if (doc) doc.is_on_break = !doc.is_on_break;
        this.save();
        return { message: 'Break toggled', doctor: doc } as T;
      }
      if (endpoint.includes('/delay')) {
        const docId = endpoint.split('/')[2];
        const doc = this.doctors.find((d) => d._id === docId);
        if (doc) doc.reported_delay_minutes = body.delay_minutes || 15;
        this.save();
        return { message: 'Delay reported', doctor: doc } as T;
      }
    }

    // 9. Appointments
    if (endpoint.startsWith('/appointments')) {
      if (method === 'GET') {
        return { appointments: this.appointments } as T;
      }
      if (method === 'POST' && endpoint === '/appointments') {
        const doc = this.doctors.find((d) => d._id === body.doctor_id) || this.doctors[0];
        const newAppt: Appointment = {
          _id: `appt-${Date.now()}`,
          booking_reference: `CQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          patient_id: body.patient_id || 'pat-0001',
          patient_name: body.patient_name || 'Rohan Mehta',
          doctor_id: doc._id,
          doctor_name: doc.name,
          department_name: doc.department_name,
          organization_id: 'org-metrocare-01',
          appointment_date: body.appointment_date || '2026-10-25',
          scheduled_time: body.scheduled_time || '11:00',
          appointment_type: (body.appointment_type as any) || 'standard',
          status: 'booked',
          priority_flags: body.priority_flags || ['Standard'],
          created_at: new Date().toISOString()
        };
        this.appointments.unshift(newAppt);
        this.save();
        return { message: 'Booked successfully', appointment: newAppt } as T;
      }
      if (endpoint.includes('/cancel')) {
        const apptId = endpoint.split('/')[2];
        const appt = this.appointments.find((a) => a._id === apptId);
        if (appt) appt.status = 'cancelled';
        this.save();
        return { message: 'Appointment cancelled' } as T;
      }
    }

    // 10. Queue
    if (endpoint.startsWith('/queue')) {
      if (method === 'GET') {
        return { queue: this.queue, count: this.queue.length } as T;
      }
      if (endpoint === '/queue/check-in') {
        let appt = this.appointments.find((a) => a._id === body.appointment_id);
        if (!appt && body.booking_reference) {
          appt = this.appointments.find((a) => a.booking_reference.toLowerCase() === body.booking_reference.toLowerCase());
        }
        if (appt) {
          appt.status = 'checked_in';
          appt.check_in_time = new Date().toISOString();
          const qEntry: QueueEntry = {
            _id: `q-${Date.now()}`,
            appointment_id: appt._id,
            patient_id: appt.patient_id,
            patient_name: appt.patient_name,
            doctor_id: appt.doctor_id,
            doctor_name: appt.doctor_name,
            department_name: appt.department_name,
            organization_id: appt.organization_id,
            appointment_type: appt.appointment_type,
            status: 'checked_in',
            queue_position: this.queue.length + 1,
            predicted_wait_minutes: 15,
            check_in_time: new Date().toISOString(),
            priority_flags: body.priority_flags || ['Standard']
          };
          this.queue.push(qEntry);
          this.save();
          return { message: 'Patient checked in successfully', data: qEntry } as T;
        }
        return { message: 'Check in processed', data: {} } as T;
      }
      if (endpoint.includes('/no-show')) {
        const qId = endpoint.split('/')[2];
        const entry = this.queue.find((q) => q._id === qId);
        if (entry) entry.status = 'no_show';
        this.save();
        return { message: 'Marked as no show' } as T;
      }
    }

    // 11. Patients / Walk-in
    if (endpoint.startsWith('/patients')) {
      if (method === 'POST') {
        const newPat: Patient = {
          _id: `pat-${Date.now()}`,
          name: body.name,
          phone: body.phone,
          age: body.age || 35,
          gender: body.gender || 'Male',
          mrn: `CQ-MRN-${Math.floor(1000 + Math.random() * 9000)}`
        };
        this.patients.unshift(newPat);
        return { patient: newPat } as T;
      }
      return { patients: this.patients } as T;
    }

    // 12. Consultations
    if (endpoint === '/consultations/active') {
      return { consultation: this.activeConsultation } as T;
    }
    if (endpoint === '/consultations/start') {
      const appt = this.appointments.find((a) => a._id === body.appointment_id) || this.appointments[0];
      if (appt) {
        appt.status = 'in_consultation';
        appt.consultation_started_at = new Date().toISOString();
      }
      const q = this.queue.find((item) => item.appointment_id === body.appointment_id);
      if (q) q.status = 'in_consultation';

      this.activeConsultation = {
        _id: `c-${Date.now()}`,
        appointment_id: appt._id,
        patient_id: appt.patient_id,
        patient_name: appt.patient_name,
        doctor_id: appt.doctor_id,
        doctor_name: appt.doctor_name,
        department_name: appt.department_name,
        organization_id: appt.organization_id,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        notes: ''
      };
      this.save();
      return { message: 'Consultation started', data: this.activeConsultation } as T;
    }
    if (endpoint.includes('/complete')) {
      if (this.activeConsultation) {
        const appt = this.appointments.find((a) => a._id === this.activeConsultation?.appointment_id);
        if (appt) {
          appt.status = 'completed';
          appt.consultation_completed_at = new Date().toISOString();
          appt.consultation_duration_minutes = body.duration_minutes || 16;
        }
        this.consultations.unshift({
          ...this.activeConsultation,
          completed_at: new Date().toISOString(),
          status: 'completed',
          duration_minutes: body.duration_minutes || 16,
          notes: body.notes || 'Consultation completed.'
        });
        this.queue = this.queue.filter((q) => q.appointment_id !== this.activeConsultation?.appointment_id);
        this.activeConsultation = null;
        this.save();
      }
      return { message: 'Consultation completed successfully' } as T;
    }
    if (endpoint === '/consultations/history') {
      return { consultations: this.consultations } as T;
    }

    // 13. Prescriptions & Insurance
    if (endpoint.startsWith('/prescriptions')) {
      return { prescriptions: this.prescriptions } as T;
    }
    if (endpoint.startsWith('/insurance')) {
      if (method === 'PATCH' || method === 'POST') {
        this.insurance = { ...this.insurance, ...body };
        this.save();
        return { message: 'Updated', insurance: this.insurance } as T;
      }
      return { insurance: this.insurance } as T;
    }

    // 14. Predictions & Evaluation
    if (endpoint.startsWith('/predictions/evaluation')) {
      const evalData: PredictionEvaluation = {
        status: 'healthy',
        sample_size: 450,
        adaptive_model: {
          name: 'ClinicQueue Adaptive Regression',
          mae: 3.2,
          median_ae: 2.4,
          p90_ae: 5.8
        },
        baseline_model: {
          name: 'Fixed Nominal Slot Baseline',
          mae: 11.4,
          median_ae: 9.8
        },
        improvement_pct: 71.9,
        is_outperforming_baseline: true,
        by_department: [
          { department: 'Cardiology', samples: 120, mae: 3.1, median_ae: 2.2 },
          { department: 'General Medicine', samples: 150, mae: 2.8, median_ae: 2.0 },
          { department: 'Orthopedics', samples: 90, mae: 3.6, median_ae: 2.9 }
        ],
        by_doctor: [
          { doctor_id: 'doc-mc-01', doctor_name: 'Dr. Rajesh Sharma', department: 'Cardiology', samples: 80, mae: 2.9 }
        ]
      };
      return { evaluation: evalData } as T;
    }

    // 15. Simulation
    if (endpoint === '/simulation/run') {
      const scenario = body.scenario || 'normal_day';
      let served = 28;
      let backlog = 3;
      let wait = 14.2;
      let util = 88;
      if (scenario === 'high_demand') {
        served = 42;
        backlog = 12;
        wait = 26.5;
        util = 96;
      } else if (scenario === 'understaffed') {
        served = 18;
        backlog = 15;
        wait = 38.0;
        util = 98;
      }
      const simResult: SimulationResult = {
        scenario_name: scenario,
        is_simulation: true,
        parameters: {
          num_appointments: body.parameters?.num_appointments || 30,
          walk_in_rate_pct: 15,
          duration_variance_pct: 20,
          num_doctors: body.parameters?.num_doctors || 2,
          base_consultation_minutes: body.parameters?.base_consultation_minutes || 15,
          break_duration_minutes: 30,
          late_arrival_rate_pct: 10,
          no_show_rate_pct: 8,
          doctor_delay_minutes: body.parameters?.doctor_delay_minutes || 0
        },
        summary: {
          completed_patients: served,
          avg_wait_minutes: wait,
          backlog_patients: backlog,
          doctor_utilization_pct: util
        },
        results: {
          patients_served: served,
          unserved_backlog: backlog,
          total_demand: served + backlog,
          average_wait_minutes: wait,
          median_wait_minutes: wait - 2,
          max_wait_minutes: wait + 15,
          p90_wait_minutes: wait + 8,
          doctor_utilization_pct: util,
          hourly_congestion: [
            { time: '09:00', hour: 9, waiting: 4 },
            { time: '10:00', hour: 10, waiting: 8 },
            { time: '11:00', hour: 11, waiting: 6 },
            { time: '12:00', hour: 12, waiting: 3 },
            { time: '14:00', hour: 14, waiting: 5 },
            { time: '15:00', hour: 15, waiting: 2 }
          ]
        }
      };
      return { simulation: simResult } as T;
    }

    // 16. Analytics Dashboard
    if (endpoint.startsWith('/analytics/dashboard')) {
      const completedCount = this.consultations.length || 259;
      const queueCount = this.queue.length || 37;
      return {
        daily_stats: {
          total_arrivals: queueCount + 42,
          completed_visits: completedCount,
          average_wait_minutes: 13.8,
          average_duration_minutes: 16.4,
          no_show_rate_pct: 4.2,
          doctor_utilization_pct: 89.4
        },
        hourly_arrivals: [
          { hour: '08:00', count: 14 },
          { hour: '09:00', count: 28 },
          { hour: '10:00', count: 32 },
          { hour: '11:00', count: 24 },
          { hour: '12:00', count: 16 },
          { hour: '14:00', count: 20 },
          { hour: '15:00', count: 18 },
          { hour: '16:00', count: 12 }
        ],
        department_distribution: [
          { name: 'General Medicine', value: 62 },
          { name: 'Cardiology', value: 48 },
          { name: 'Orthopedics', value: 38 },
          { name: 'Pediatrics', value: 34 },
          { name: 'Neurology', value: 28 },
          { name: 'Dermatology', value: 25 }
        ]
      } as T;
    }

    // 17. Notifications
    if (endpoint === '/notifications') {
      return {
        notifications: [
          {
            _id: 'notif-01',
            user_id: 'user-01',
            title: 'Queue Position Update',
            message: 'Your estimated wait time is calibrated to ~14 minutes.',
            type: 'queue',
            is_read: false,
            created_at: new Date().toISOString()
          }
        ],
        unread_count: 1
      } as T;
    }
    if (endpoint === '/notifications/read-all') {
      return { message: 'All marked as read' } as T;
    }

    // Fallback empty
    return {} as T;
  }
}

export const mockStore = new MockStore();
