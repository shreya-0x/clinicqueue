import {
  User,
  Organization,
  Doctor,
  Patient,
  Appointment,
  QueueEntry,
  Consultation,
  Prediction,
  PredictionEvaluation,
  SimulationResult,
  NotificationItem,
  AuditLog
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('clinicqueue_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errMsg = `Request failed (${res.status})`;
      try {
        const errJson = await res.json();
        errMsg = errJson.message || errJson.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; storage: any; version: string }>('/health'),

  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (data: { name: string; email: string; password: string; phone?: string; age?: number }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  demoSwitch: (role: string) =>
    request<{ token: string; user: User }>('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role })
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST'
    }),

  // Organizations
  getOrganizations: (city?: string) =>
    request<{ organizations: Organization[] }>(`/organizations${city ? `?city=${encodeURIComponent(city)}` : ''}`),

  getOrganization: (id: string) =>
    request<{ organization: Organization }>(`/organizations/${id}`),

  createOrganization: (data: Partial<Organization>) =>
    request<{ organization: Organization }>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateOrgStatus: (id: string, status: string) =>
    request<{ message: string }>(`/organizations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Doctors
  getDoctors: (params?: { organization_id?: string; department?: string; available?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.organization_id) query.set('organization_id', params.organization_id);
    if (params?.department) query.set('department', params.department);
    if (params?.available) query.set('available', 'true');
    const qs = query.toString();
    return request<{ doctors: Doctor[] }>(`/doctors${qs ? `?${qs}` : ''}`);
  },

  getDoctor: (id: string) => request<{ doctor: Doctor }>(`/doctors/${id}`),

  toggleDoctorAvailability: (id: string, is_available: boolean) =>
    request<{ message: string }>(`/doctors/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available })
    }),

  setDoctorBreak: (id: string, is_on_break: boolean, duration_minutes?: number) =>
    request<{ message: string }>(`/doctors/${id}/break`, {
      method: 'POST',
      body: JSON.stringify({ is_on_break, duration_minutes })
    }),

  reportDoctorDelay: (id: string, delay_minutes: number, reason?: string) =>
    request<{ message: string }>(`/doctors/${id}/report-delay`, {
      method: 'POST',
      body: JSON.stringify({ delay_minutes, reason })
    }),

  // Patients
  getPatients: (search?: string) =>
    request<{ patients: Patient[] }>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getPatient: (id: string) => request<{ patient: Patient }>(`/patients/${id}`),

  registerWalkIn: (data: { name: string; phone: string; age?: number; gender?: string }) =>
    request<{ patient: Patient }>('/patients', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Appointments
  getAppointments: (params?: { date?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return request<{ appointments: Appointment[] }>(`/appointments${qs ? `?${qs}` : ''}`);
  },

  getAppointment: (id: string) => request<{ appointment: Appointment }>(`/appointments/${id}`),

  bookAppointment: (data: {
    doctor_id: string;
    appointment_date: string;
    scheduled_time: string;
    appointment_type?: string;
    patient_id?: string;
    patient_name?: string;
    priority_flags?: string[];
  }) =>
    request<{ message: string; appointment: Appointment }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  cancelAppointment: (id: string) =>
    request<{ message: string }>(`/appointments/${id}/cancel`, {
      method: 'POST'
    }),

  // Queue
  getQueue: (params?: { doctor_id?: string; organization_id?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.doctor_id) query.set('doctor_id', params.doctor_id);
    if (params?.organization_id) query.set('organization_id', params.organization_id);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return request<{ queue: QueueEntry[]; count: number }>(`/queue${qs ? `?${qs}` : ''}`);
  },

  checkIn: (data: { appointment_id?: string; booking_reference?: string; priority_flags?: string[] }) =>
    request<{ message: string; data: any }>('/queue/check-in', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateQueuePriority: (queueId: string, priority_flags: string[]) =>
    request<{ message: string; priority_score: number }>(`/queue/${queueId}/priority`, {
      method: 'POST',
      body: JSON.stringify({ priority_flags })
    }),

  markNoShow: (queueId: string) =>
    request<{ message: string }>(`/queue/${queueId}/no-show`, {
      method: 'POST'
    }),

  // Consultations
  getActiveConsultation: () => request<{ consultation: Consultation | null }>('/consultations/active'),

  startConsultation: (appointment_id: string) =>
    request<{ message: string; data: any }>('/consultations/start', {
      method: 'POST',
      body: JSON.stringify({ appointment_id })
    }),

  completeConsultation: (consultationId: string, notes?: string, duration_minutes?: number) =>
    request<{ message: string; data: any }>(`/consultations/${consultationId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes, duration_minutes })
    }),

  getConsultationHistory: () => request<{ consultations: Consultation[] }>('/consultations/history'),

  // Predictions
  getPrediction: (apptId: string) => request<{ prediction: Prediction }>(`/predictions/${apptId}`),

  getPredictionEvaluation: (organization_id?: string) =>
    request<{ evaluation: PredictionEvaluation }>(
      `/predictions/evaluation${organization_id ? `?organization_id=${organization_id}` : ''}`
    ),

  // Simulation
  getSimulationPresets: () => request<{ presets: Record<string, any> }>('/simulation/presets'),

  runSimulation: (data: { scenario?: string; parameters?: any; seed?: number }) =>
    request<{ simulation: SimulationResult }>('/simulation/run', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Analytics
  getAnalyticsDashboard: (organization_id?: string) =>
    request<any>(`/analytics/dashboard${organization_id ? `?organization_id=${organization_id}` : ''}`),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[]; unread_count: number }>('/notifications'),

  markNotificationRead: (id: string) => request<{ message: string }>(`/notifications/${id}/read`, { method: 'POST' }),

  markAllNotificationsRead: () => request<{ message: string }>('/notifications/read-all', { method: 'POST' }),

  // Audit Logs
  getAuditLogs: () => request<{ audit_logs: AuditLog[] }>('/audit-logs'),

  // Demo Controls
  resetDemoData: () => request<{ message: string; stats: any }>('/demo/reset', { method: 'POST' })
};
