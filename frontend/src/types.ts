export type Role = 'patient' | 'receptionist' | 'doctor' | 'hospital_admin' | 'platform_admin';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  patient_id?: string;
  doctor_id?: string;
  organization_id?: string;
  organization_name?: string;
  patient_profile?: Patient;
  doctor_profile?: Doctor;
}

export interface Organization {
  _id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  type: string;
  status: 'active' | 'suspended' | 'pending';
  is_flagship?: boolean;
  stats?: {
    doctor_count: number;
    department_count: number;
    active_appointments: number;
  };
}

export interface Department {
  _id: string;
  organization_id: string;
  name: string;
  nominal_duration_minutes: number;
  icon?: string;
  is_active: boolean;
}

export interface Doctor {
  _id: string;
  organization_id: string;
  organization_name: string;
  name: string;
  department_name: string;
  qualifications: string;
  room_number: string;
  is_available: boolean;
  is_on_break: boolean;
  break_remaining_minutes: number;
  reported_delay_minutes: number;
  delay_reason?: string;
  experience_years: number;
  consultation_fee: number;
  email: string;
  schedule?: {
    days: string[];
    morning_slot: string;
    afternoon_slot: string;
  };
  active_consultation?: Consultation;
  waiting_patients_count?: number;
}

export interface Patient {
  _id: string;
  mrn: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  blood_group?: string;
  city?: string;
  emergency_contact?: string;
  appointment_history?: Appointment[];
}

export type AppointmentStatus =
  | 'booked'
  | 'checked_in'
  | 'waiting'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface Appointment {
  _id: string;
  booking_reference: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department_name: string;
  organization_id: string;
  appointment_date: string;
  scheduled_time: string;
  appointment_type: 'standard' | 'new_patient' | 'follow_up' | 'quick_review' | 'walk_in';
  status: AppointmentStatus;
  priority_flags?: string[];
  priority_score?: number;
  checked_in_at?: string;
  consultation_started_at?: string;
  consultation_completed_at?: string;
  actual_wait_minutes?: number;
  consultation_duration_minutes?: number;
  created_at?: string;
  timeline?: QueueEvent[];
  live_prediction?: Prediction;
}

export interface QueueEntry {
  _id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  organization_id: string;
  department_name: string;
  appointment_type: string;
  status: AppointmentStatus;
  check_in_time?: string;
  priority_flags?: string[];
  priority_score?: number;
  queue_position?: number;
  predicted_wait_minutes?: number;
  predicted_start_time?: string;
  explanations?: string[];
  uncertainty_window_minutes?: number;
}

export interface Consultation {
  _id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department_name: string;
  organization_id: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  status: 'in_progress' | 'completed';
  notes?: string;
}

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  _id: string;
  rx_number: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department_name: string;
  organization_name: string;
  date: string;
  diagnosis: string;
  medications: PrescriptionMedication[];
  advice: string;
  follow_up: string;
}

export interface Insurance {
  _id?: string;
  patient_id: string;
  provider_name: string;
  policy_number: string;
  tpa_id?: string;
  coverage_limit: string;
  valid_until: string;
  copay_percentage: string;
  status: 'active' | 'expired' | 'pending';
  claim_status: string;
  contact_phone?: string;
}

export interface Prediction {
  appointment_id: string;
  doctor_id: string;
  organization_id: string;
  predicted_wait_minutes: number;
  predicted_start_time: string;
  uncertainty_window_minutes: number;
  patients_ahead_count: number;
  active_consultation_in_progress: boolean;
  doctor_median_duration: number;
  model_version: string;
  timestamp: string;
  explanations: string[];
}

export interface PredictionEvaluation {
  status: string;
  sample_size: number;
  adaptive_model: {
    name: string;
    mae: number;
    median_ae: number;
    p90_ae?: number;
  };
  baseline_model: {
    name: string;
    mae: number;
    median_ae: number;
  };
  improvement_pct: number;
  is_outperforming_baseline: boolean;
  by_department: Array<{
    department: string;
    samples: number;
    mae: number;
    median_ae: number;
  }>;
  by_doctor: Array<{
    doctor_id: string;
    doctor_name: string;
    department: string;
    samples: number;
    mae: number;
  }>;
}

export interface SimulationResult {
  scenario_name: string;
  is_simulation: boolean;
  parameters: {
    num_appointments: number;
    walk_in_rate_pct: number;
    duration_variance_pct: number;
    num_doctors: number;
    base_consultation_minutes: number;
    break_duration_minutes: number;
    late_arrival_rate_pct: number;
    no_show_rate_pct: number;
    doctor_delay_minutes: number;
  };
  results: {
    patients_served: number;
    unserved_backlog: number;
    total_demand: number;
    average_wait_minutes: number;
    median_wait_minutes: number;
    max_wait_minutes: number;
    p90_wait_minutes: number;
    doctor_utilization_pct: number;
    hourly_congestion: Array<{
      time: string;
      hour: number;
      waiting: number;
    }>;
  };
}

export interface NotificationItem {
  _id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface QueueEvent {
  _id: string;
  appointment_id: string;
  doctor_id: string;
  event_type: string;
  actor_id: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface AuditLog {
  _id: string;
  user_id: string;
  organization_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  timestamp: string;
}
