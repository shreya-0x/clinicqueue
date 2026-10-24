import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Appointment, QueueEntry, Doctor, Patient } from '../types';
import { OperationsAnalytics } from '../components/OperationsAnalytics';
import { DigitalTwinSimulator } from '../components/DigitalTwinSimulator';
import {
  Building2,
  Search,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  Filter,
  RefreshCw,
  X,
  Sliders,
  LineChart as LineChartIcon,
  Play,
  Sparkles,
  Stethoscope,
  Activity,
  Users,
  Settings,
  Calendar,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Phone,
  Check,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';

export const ReceptionView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Core data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Walk-in modal & form state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDocId, setWalkInDocId] = useState('');
  const [walkInAge, setWalkInAge] = useState(42);
  const [walkInGender, setWalkInGender] = useState('Male');
  const [walkInPriority, setWalkInPriority] = useState<string[]>([]);
  const [walkInLoading, setWalkInLoading] = useState(false);

  // Manual Check-in by Ref
  const [checkInRef, setCheckInRef] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings State
  const [targetSlaMinutes, setTargetSlaMinutes] = useState(15);
  const [enableSmsNotifications, setEnableSmsNotifications] = useState(true);
  const [enableAutoReorder, setEnableAutoReorder] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const orgId = user?.organization_id || 'org-metrocare-01';
      const [apptsRes, queueRes, docsRes, patsRes] = await Promise.all([
        api.getAppointments(),
        api.getQueue({ organization_id: orgId }),
        api.getDoctors({ organization_id: orgId }),
        api.getPatients()
      ]);

      // Deduplicate appointments by _id
      const uniqueAppts = Array.from(
        new Map((apptsRes.appointments || []).map((a) => [a._id, a])).values()
      );
      setAppointments(uniqueAppts);

      // Deduplicate queue entries by _id
      const uniqueQueue = Array.from(
        new Map((queueRes.queue || []).map((q) => [q._id, q])).values()
      );
      setQueueEntries(uniqueQueue);

      setDoctors(docsRes.doctors || []);
      setPatients(patsRes.patients || []);
    } catch (err) {
      console.error('Failed to fetch reception data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const orgId = user?.organization_id || 'org-metrocare-01';
        const [apptsRes, queueRes] = await Promise.all([
          api.getAppointments(),
          api.getQueue({ organization_id: orgId })
        ]);
        if (apptsRes.appointments) {
          const uniqueAppts = Array.from(
            new Map(apptsRes.appointments.map((a) => [a._id, a])).values()
          );
          setAppointments(uniqueAppts);
        }
        if (queueRes.queue) {
          const uniqueQueue = Array.from(
            new Map(queueRes.queue.map((q) => [q._id, q])).values()
          );
          setQueueEntries(uniqueQueue);
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInRef.trim()) return;
    setCheckInLoading(true);
    setActionAlert(null);
    try {
      const res = await api.checkIn({ booking_reference: checkInRef.trim().toUpperCase() });
      setActionAlert({ type: 'success', text: res.message || 'Patient verified and placed in outpatient queue.' });
      setCheckInRef('');
      await fetchData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Check-in failed. Please verify booking reference.' });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckInDirect = async (apptId: string) => {
    setActionAlert(null);
    try {
      const res = await api.checkIn({ appointment_id: apptId });
      setActionAlert({ type: 'success', text: res.message || 'Patient checked in successfully.' });
      await fetchData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Check-in failed.' });
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled appointment?')) return;
    try {
      await api.cancelAppointment(apptId);
      setActionAlert({ type: 'success', text: 'Appointment marked as cancelled.' });
      await fetchData();
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    }
  };

  const handleMarkNoShow = async (queueId: string) => {
    try {
      await api.markNoShow(queueId);
      setActionAlert({ type: 'success', text: 'Queue entry flagged as No-Show and removed from active line.' });
      await fetchData();
    } catch (err: any) {
      alert(`No-show update failed: ${err.message}`);
    }
  };

  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInDocId) {
      alert('Please fill patient name and assigned physician.');
      return;
    }
    setWalkInLoading(true);
    try {
      const patRes = await api.registerWalkIn({
        name: walkInName.trim(),
        phone: walkInPhone.trim() || '+91 98000 00000',
        age: Number(walkInAge),
        gender: walkInGender
      });

      const today = '2026-10-25';
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      const apptRes = await api.bookAppointment({
        doctor_id: walkInDocId,
        appointment_date: today,
        scheduled_time: nowTime,
        appointment_type: 'walk_in',
        patient_id: patRes.patient._id,
        patient_name: walkInName,
        priority_flags: walkInPriority
      });

      await api.checkIn({
        appointment_id: apptRes.appointment._id,
        priority_flags: walkInPriority
      });

      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInPriority([]);
      setActionAlert({ type: 'success', text: `Walk-in patient ${walkInName} registered and entered into live queue.` });
      await fetchData();
    } catch (err: any) {
      alert(`Walk-in registration error: ${err.message}`);
    } finally {
      setWalkInLoading(false);
    }
  };

  const filteredAppts = appointments.filter((a) => {
    const matchSearch =
      a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      a.booking_reference.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? a.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.mrn && p.mrn.toLowerCase().includes(q))
    );
  });

  // Subpath detection
  const path = location.pathname;
  const isAppointmentsView = path === '/reception/appointments';
  const isPatientsView = path === '/reception/patients';
  const isCheckinView = path === '/reception/checkin';
  const isQueueView = path === '/reception/queue';
  const isDoctorsView = path === '/reception/doctors';
  const isAnalyticsView = path === '/reception/analytics';
  const isSimulatorView = path === '/reception/simulator';
  const isSettingsView = path === '/reception/settings';
  const isDashboardView = path === '/reception' || (!isAppointmentsView && !isPatientsView && !isCheckinView && !isQueueView && !isDoctorsView && !isAnalyticsView && !isSimulatorView && !isSettingsView);

  // Operational metrics
  const activeWaitingCount = queueEntries.filter((q) => q.status === 'waiting' || q.status === 'called').length;
  const inConsultationCount = queueEntries.filter((q) => q.status === 'in_consultation').length;
  const avgWaitMinutes = queueEntries.length > 0
    ? Math.round(queueEntries.reduce((sum, q) => sum + (q.predicted_wait_minutes || 14), 0) / queueEntries.length)
    : 14;
  const doctorsAvailableCount = doctors.filter((d) => d.is_available && !d.is_on_break).length;

  return (
    <div className="space-y-6">
      {/* Top Action Alert Banner */}
      {actionAlert && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in ${
            actionAlert.type === 'success'
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
              : 'bg-red-950/70 text-red-300 border border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionAlert.text}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. DIGITAL TWIN SIMULATOR VIEW */}
      {isSimulatorView && (
        <div className="space-y-6 animate-fade-in">
          <DigitalTwinSimulator />
        </div>
      )}

      {/* 2. CLINIC-WIDE OPERATIONS ANALYTICS VIEW */}
      {isAnalyticsView && (
        <div className="space-y-6 animate-fade-in">
          <OperationsAnalytics />
        </div>
      )}

      {/* 3. DOCTOR AVAILABILITY ROSTER VIEW */}
      {isDoctorsView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl p-6 border border-[#29344D] light:border-[#E2E8F0] shadow-sm animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B] light:border-[#E2E8F0]">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">Physician Roster & Consulting Rooms</h2>
              <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                Real-time active consultation tracking, scheduled break status, and delay reporting across all departments.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-semibold">
                {doctorsAvailableCount} On Duty
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] text-[#60A5FA] font-mono">
                {doctors.length} Registered
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((d) => {
              const activePatient = queueEntries.find(
                (q) => q.doctor_id === d._id && q.status === 'in_consultation'
              );
              return (
                <div
                  key={d._id}
                  className="p-4 rounded-xl bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs flex flex-col justify-between hover:border-[#60A5FA] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">{d.name}</h3>
                        <p className="text-xs text-[#60A5FA] light:text-[#2563EB] font-medium">{d.department_name}</p>
                        <p className="text-[11px] text-[#94A3B8] light:text-[#64748B] mt-0.5">{d.room_number || 'Room 101'}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          d.is_on_break
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                            : d.is_available
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950/60 text-red-300 border border-red-800'
                        }`}
                      >
                        {d.is_on_break ? 'On Break' : d.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#1E293B] light:border-[#E2E8F0] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#94A3B8] light:text-[#64748B]">Active Patient:</span>
                        <strong className="text-[#F1F5F9] light:text-[#0F172A]">
                          {activePatient ? activePatient.patient_name : 'No active session'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#94A3B8] light:text-[#64748B]">Consultation Slot:</span>
                        <span className="text-[#60A5FA] font-mono">{d.average_consultation_minutes || 15} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await api.toggleDoctorAvailability(d._id, !d.is_available);
                          await fetchData();
                        } catch (err: any) {
                          alert(`Availability update failed: ${err.message}`);
                        }
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] hover:border-[#60A5FA] text-[#F1F5F9] light:text-[#0F172A] font-medium text-[11px] text-center transition-colors"
                    >
                      Toggle Availability
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await api.setDoctorBreak(d._id, !d.is_on_break);
                          await fetchData();
                        } catch (err: any) {
                          alert(`Break update failed: ${err.message}`);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] text-amber-400 light:text-amber-600 font-medium text-[11px] transition-colors"
                    >
                      {d.is_on_break ? 'End Break' : 'Take Break'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DEDICATED LIVE QUEUE BOARD VIEW (/reception/queue) */}
      {isQueueView && (
        <div className="space-y-6 animate-fade-in">
          {/* Queue Top Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#60A5FA] uppercase tracking-wider">Waiting in Queue</span>
              <div className="text-2xl font-bold text-[#F1F5F9] light:text-[#0F172A] mt-1">{activeWaitingCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Awaiting physician call</p>
            </div>
            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">In Consultation</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{inConsultationCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Currently with doctors</p>
            </div>
            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Average Wait Time</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">~{avgWaitMinutes}m</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Adaptive queue estimation</p>
            </div>
            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Physicians On Duty</span>
              <div className="text-2xl font-bold text-[#F1F5F9] light:text-[#0F172A] mt-1">{doctorsAvailableCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Active consultation rooms</p>
            </div>
          </div>

          {/* Full Queue Table */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">Live Outpatient Queue Board</h3>
                <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                  Real-time outpatient queue ordering by arrival timestamp and clinical priority flags.
                </p>
              </div>
              <button
                onClick={() => setShowWalkInModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Walk-in to Queue</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                    <th className="py-2.5 px-3 font-semibold">Position</th>
                    <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned Physician</th>
                    <th className="py-2.5 px-3 font-semibold">Wait Time</th>
                    <th className="py-2.5 px-3 font-semibold">Priority Flags</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                  {queueEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#64748B]">
                        No patients currently waiting in the active outpatient queue.
                      </td>
                    </tr>
                  ) : (
                    queueEntries.map((qe, idx) => (
                      <tr key={qe._id} className="hover:bg-[#1B263D]/40 light:hover:bg-[#F8FAFC]">
                        <td className="py-3 px-3 font-mono font-bold text-[#60A5FA]">
                          #{qe.queue_position || idx + 1}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">{qe.patient_name}</td>
                        <td className="py-3 px-3 text-[#94A3B8]">{qe.doctor_name}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#F1F5F9] light:text-[#0F172A]">~{qe.predicted_wait_minutes || 14}m</span>
                        </td>
                        <td className="py-3 px-3">
                          {qe.priority_flags && qe.priority_flags.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#1B263D] text-[#60A5FA] border border-[#29344D]">
                              {qe.priority_flags.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[#64748B]">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            qe.status === 'in_consultation'
                              ? 'bg-[#1B263D] text-[#60A5FA] border border-[#60A5FA] animate-pulse'
                              : qe.status === 'called'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-600 animate-pulse'
                              : 'bg-amber-950/60 text-amber-300'
                          }`}>
                            {qe.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleMarkNoShow(qe._id)}
                            className="text-xs text-red-400 hover:underline"
                          >
                            Mark No-Show
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. DEDICATED APPOINTMENTS MASTER VIEW (/reception/appointments) */}
      {isAppointmentsView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B] light:border-[#E2E8F0]">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">Appointments Master Schedule</h2>
              <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                Complete outpatient booking registry with verified status transitions and arrival verification.
              </p>
            </div>
            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Walk-in</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search patient, doctor, or ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['', 'booked', 'checked_in', 'called', 'in_consultation', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-[#60A5FA] text-[#0B1020]'
                      : 'bg-[#0F172A] light:bg-[#F8FAFC] text-[#94A3B8] border border-[#29344D] light:border-[#E2E8F0]'
                  }`}
                >
                  {st === '' ? 'All Statuses' : st.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                  <th className="py-2.5 px-3 font-semibold">Reference</th>
                  <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                  <th className="py-2.5 px-3 font-semibold">Physician & Specialty</th>
                  <th className="py-2.5 px-3 font-semibold">Date & Time</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                {filteredAppts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#64748B]">
                      No appointments matching the specified filters.
                    </td>
                  </tr>
                ) : (
                  filteredAppts.map((a) => (
                    <tr key={a._id} className="hover:bg-[#1B263D]/40 light:hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-mono font-medium text-[#60A5FA]">{a.booking_reference}</td>
                      <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">{a.patient_name}</td>
                      <td className="py-3 px-3 text-[#94A3B8]">
                        <span className="block text-[#F1F5F9] light:text-[#0F172A]">{a.doctor_name}</span>
                        <span className="text-[10px] text-[#64748B]">{a.department_name}</span>
                      </td>
                      <td className="py-3 px-3 text-[#94A3B8]">
                        {a.appointment_date} at {a.scheduled_time}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                          a.status === 'completed'
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : a.status === 'in_consultation'
                            ? 'bg-[#1B263D] text-[#60A5FA]'
                            : a.status === 'called'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-600 animate-pulse'
                            : a.status === 'checked_in' || a.status === 'waiting'
                            ? 'bg-amber-950/60 text-amber-300'
                            : a.status === 'cancelled'
                            ? 'bg-red-950/60 text-red-300'
                            : 'bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8]'
                        }`}>
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {a.status === 'booked' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCheckInDirect(a._id)}
                              className="px-3 py-1.5 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] text-[#0B1020] font-semibold text-xs"
                            >
                              Check In
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(a._id)}
                              className="text-red-400 hover:underline text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PATIENT SEARCH DIRECTORY VIEW (/reception/patients) */}
      {isPatientsView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B] light:border-[#E2E8F0]">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">Patient Medical Registry Directory</h2>
              <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                Search patients by MRN, name, or phone number to view clinical history or register new visits.
              </p>
            </div>
            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Walk-in Patient</span>
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by name, phone (+91), or MRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                  <th className="py-2.5 px-3 font-semibold">MRN</th>
                  <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                  <th className="py-2.5 px-3 font-semibold">Phone Number</th>
                  <th className="py-2.5 px-3 font-semibold">Demographics</th>
                  <th className="py-2.5 px-3 font-semibold">Total Visits</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#64748B]">
                      No patients found matching "{search}".
                    </td>
                  </tr>
                ) : (
                  filteredPatients.slice(0, 25).map((p) => {
                    const patientAppts = appointments.filter((a) => a.patient_id === p._id);
                    return (
                      <tr key={p._id} className="hover:bg-[#1B263D]/40 light:hover:bg-[#F8FAFC]">
                        <td className="py-3 px-3 font-mono font-medium text-[#60A5FA]">{p.mrn || 'MRN-2026-001'}</td>
                        <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">{p.name}</td>
                        <td className="py-3 px-3 text-[#94A3B8] font-mono">{p.phone || '+91 98765 43210'}</td>
                        <td className="py-3 px-3 text-[#94A3B8]">
                          {p.age || 40} yrs • {p.gender || 'Unknown'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">
                          {patientAppts.length} consultations
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setWalkInName(p.name);
                              setWalkInPhone(p.phone || '');
                              setWalkInAge(p.age || 40);
                              setWalkInGender(p.gender || 'Male');
                              setShowWalkInModal(true);
                            }}
                            className="px-2.5 py-1 rounded-md bg-[#1B263D] hover:bg-[#29344D] text-[#60A5FA] font-medium text-xs transition-colors"
                          >
                            New Visit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. EXPRESS CHECK-IN STATION VIEW (/reception/checkin) */}
      {isCheckinView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Station 1: Express Reference Verification */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <UserCheck className="w-5 h-5 text-[#60A5FA]" />
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">Express Check-In Desk</h3>
                <p className="text-xs text-[#94A3B8] light:text-[#475569]">Enter booking reference code to confirm arrival.</p>
              </div>
            </div>

            <form onSubmit={handleManualCheckIn} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                  Booking Reference / Barcode
                </label>
                <input
                  type="text"
                  placeholder="e.g. CQ-2026-9812..."
                  value={checkInRef}
                  onChange={(e) => setCheckInRef(e.target.value)}
                  className="w-full font-mono uppercase text-sm rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] px-3.5 py-2.5 text-[#F1F5F9] light:text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
                />
              </div>

              <button
                type="submit"
                disabled={checkInLoading || !checkInRef.trim()}
                className="w-full py-2.5 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] disabled:opacity-50 text-[#0B1020] light:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {checkInLoading ? 'Verifying Reference...' : 'Confirm Patient Arrival'}
              </button>
            </form>

            <div className="mt-4 p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#94A3B8] light:text-[#64748B]">
              <div className="flex items-center gap-1.5 font-semibold text-[#F1F5F9] light:text-[#0F172A] mb-1">
                <Info className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>Verification Policy</span>
              </div>
              Checking in places the patient into the live queue, issues a position token, and triggers SMS delivery with dynamic arrival wait estimation.
            </div>
          </div>

          {/* Station 2: Walk-In Triage & Registration */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">Direct Walk-in Patient Triage</h3>
                <p className="text-xs text-[#94A3B8] light:text-[#475569]">Register an unscheduled outpatient arrival.</p>
              </div>
            </div>

            <form onSubmit={handleRegisterWalkIn} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Full Patient Name</label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Age & Gender</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={walkInAge}
                      onChange={(e) => setWalkInAge(Number(e.target.value))}
                      className="w-16 px-2 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                    />
                    <select
                      value={walkInGender}
                      onChange={(e) => setWalkInGender(e.target.value)}
                      className="flex-1 px-2 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Assign Physician</label>
                <select
                  required
                  value={walkInDocId}
                  onChange={(e) => setWalkInDocId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                >
                  <option value="">-- Choose Available Physician --</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.department_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Priority Rule Flags</label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {['Senior Citizen', 'Emergency', 'Pediatric', 'Post-Op'].map((flg) => {
                    const active = walkInPriority.includes(flg);
                    return (
                      <button
                        type="button"
                        key={flg}
                        onClick={() =>
                          setWalkInPriority((prev) =>
                            active ? prev.filter((f) => f !== flg) : [...prev, flg]
                          )
                        }
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                          active
                            ? 'bg-[#60A5FA] text-[#0B1020] border-[#60A5FA]'
                            : 'bg-[#0F172A] light:bg-[#F8FAFC] text-[#94A3B8] border-[#29344D] light:border-[#E2E8F0]'
                        }`}
                      >
                        {flg}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={walkInLoading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                {walkInLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Check In Walk-In to Live Queue</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 8. CLINIC SETTINGS VIEW (/reception/settings) */}
      {isSettingsView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] light:border-[#E2E8F0]">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">Clinic Operational Configuration</h2>
              <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                Tune queue prioritization weights, SMS notification thresholds, and outpatient service level agreements.
              </p>
            </div>
            {settingsSaved && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Configuration Saved</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">Queue Pacing & SLA</h3>
              <div className="p-4 rounded-xl bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-3 text-xs">
                <div>
                  <label className="block text-[#94A3B8] light:text-[#475569] mb-1">Target Wait Time SLA (minutes)</label>
                  <input
                    type="number"
                    value={targetSlaMinutes}
                    onChange={(e) => setTargetSlaMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#151D31] light:bg-white border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  />
                  <p className="text-[10px] text-[#64748B] mt-1">Alerts front desk when predicted dwell exceeds target.</p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoReorder"
                    checked={enableAutoReorder}
                    onChange={(e) => setEnableAutoReorder(e.target.checked)}
                    className="rounded border-[#29344D] text-[#60A5FA] focus:ring-0"
                  />
                  <label htmlFor="autoReorder" className="text-[#F1F5F9] light:text-[#0F172A] cursor-pointer">
                    Enable Clinical Priority Reordering
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider">Patient Communication Triggers</h3>
              <div className="p-4 rounded-xl bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    checked={enableSmsNotifications}
                    onChange={(e) => setEnableSmsNotifications(e.target.checked)}
                    className="rounded border-[#29344D] text-[#60A5FA] focus:ring-0"
                  />
                  <label htmlFor="smsNotifications" className="text-[#F1F5F9] light:text-[#0F172A] cursor-pointer">
                    Send SMS arrival and queue position alerts
                  </label>
                </div>
                <p className="text-[10px] text-[#64748B]">
                  Automatically triggers WhatsApp and SMS reminders when patient is 3 tokens away.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E293B] light:border-[#E2E8F0] flex justify-end">
            <button
              onClick={() => {
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 2500);
              }}
              className="px-5 py-2.5 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] text-[#0B1020] font-semibold text-xs transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* 9. PRIMARY DASHBOARD VIEW (/reception) */}
      {isDashboardView && (
        <div className="space-y-6">
          {/* Quick Check-in Bar & Register Walk-in CTA */}
          <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <form onSubmit={handleManualCheckIn} className="flex-1 w-full flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-[#60A5FA] shrink-0" />
              <input
                type="text"
                placeholder="Check in by Reference (e.g. CQ-2026-9812)..."
                value={checkInRef}
                onChange={(e) => setCheckInRef(e.target.value)}
                className="flex-1 font-mono uppercase text-xs rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] px-3 py-2 text-[#F1F5F9] light:text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
              />
              <button
                type="submit"
                disabled={checkInLoading || !checkInRef.trim()}
                className="px-3.5 py-2 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] disabled:opacity-50 text-[#0B1020] light:text-white font-semibold text-xs shrink-0"
              >
                {checkInLoading ? 'Verifying...' : 'Check In'}
              </button>
            </form>

            <button
              onClick={() => setShowWalkInModal(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Walk-in Patient</span>
            </button>
          </div>

          {/* Operational KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#60A5FA] uppercase tracking-wider">Active Queue</span>
              <div className="text-2xl font-bold text-[#F1F5F9] light:text-[#0F172A] mt-1">{activeWaitingCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Patients in waiting hall</p>
            </div>

            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">In Consultation</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{inConsultationCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Across consulting rooms</p>
            </div>

            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Avg Waiting Time</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">~{avgWaitMinutes}m</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Dynamic pacing estimate</p>
            </div>

            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Doctors On Duty</span>
              <div className="text-2xl font-bold text-[#F1F5F9] light:text-[#0F172A] mt-1">{doctorsAvailableCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Ready for next patient</p>
            </div>
          </div>

          {/* Live Outpatient Queue Preview */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">Live Waiting Queue</h3>
                <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                  Active patients in waiting area. Order reflects arrival timestamp and authorized priority rules.
                </p>
              </div>
              <Link
                to="/reception/queue"
                className="text-xs text-[#60A5FA] hover:underline font-semibold flex items-center gap-1"
              >
                <span>View Full Queue Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                    <th className="py-2.5 px-3 font-semibold">Position</th>
                    <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned Physician</th>
                    <th className="py-2.5 px-3 font-semibold">Wait Time</th>
                    <th className="py-2.5 px-3 font-semibold">Priority</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                  {queueEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#64748B]">
                        No patients currently waiting in the active queue.
                      </td>
                    </tr>
                  ) : (
                    queueEntries.slice(0, 6).map((qe, idx) => (
                      <tr key={qe._id} className="hover:bg-[#1B263D]/40 light:hover:bg-[#F8FAFC]">
                        <td className="py-3 px-3 font-mono font-bold text-[#60A5FA]">#{qe.queue_position || idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">{qe.patient_name}</td>
                        <td className="py-3 px-3 text-[#94A3B8]">{qe.doctor_name}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#F1F5F9] light:text-[#0F172A]">~{qe.predicted_wait_minutes || 14}m</span>
                        </td>
                        <td className="py-3 px-3">
                          {qe.priority_flags && qe.priority_flags.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#1B263D] text-[#60A5FA] border border-[#29344D]">
                              {qe.priority_flags.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[#64748B]">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            qe.status === 'in_consultation'
                              ? 'bg-[#1B263D] text-[#60A5FA] border border-[#60A5FA] animate-pulse'
                              : qe.status === 'called'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-600 animate-pulse'
                              : 'bg-amber-950/60 text-amber-300'
                          }`}>
                            {qe.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleMarkNoShow(qe._id)}
                            className="text-xs text-red-400 hover:underline"
                          >
                            Mark No-Show
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Appointments Table Preview */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">Recent Appointments</h3>
                <p className="text-xs text-[#94A3B8] light:text-[#475569]">Scheduled outpatient bookings ready for check in.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filter by patient or ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A] w-full sm:w-48"
                />
                <Link
                  to="/reception/appointments"
                  className="text-xs text-[#60A5FA] hover:underline font-semibold whitespace-nowrap"
                >
                  Manage All ({appointments.length})
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                    <th className="py-2.5 px-3 font-semibold">Ref</th>
                    <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                    <th className="py-2.5 px-3 font-semibold">Physician</th>
                    <th className="py-2.5 px-3 font-semibold">Time</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Desk Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                  {filteredAppts.slice(0, 8).map((a) => (
                    <tr key={a._id} className="hover:bg-[#1B263D]/40 light:hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-mono font-medium text-[#60A5FA]">{a.booking_reference}</td>
                      <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">{a.patient_name}</td>
                      <td className="py-3 px-3 text-[#94A3B8]">{a.doctor_name}</td>
                      <td className="py-3 px-3 text-[#94A3B8]">{a.scheduled_time}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                          a.status === 'completed'
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : a.status === 'in_consultation'
                            ? 'bg-[#1B263D] text-[#60A5FA]'
                            : a.status === 'called'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-600 animate-pulse'
                            : a.status === 'checked_in' || a.status === 'waiting'
                            ? 'bg-amber-950/60 text-amber-300'
                            : 'bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8]'
                        }`}>
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {a.status === 'booked' && (
                          <button
                            onClick={() => handleCheckInDirect(a._id)}
                            className="px-3 py-1.5 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] text-[#0B1020] font-semibold text-xs"
                          >
                            Check In
                          </button>
                        )}
                        {a.status === 'booked' && (
                          <button
                            onClick={() => handleCancelAppointment(a._id)}
                            className="ml-2 text-red-400 hover:underline text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Registration Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <h3 className="font-bold text-base text-[#F1F5F9] light:text-[#0F172A]">Register Walk-In Patient</h3>
              <button onClick={() => setShowWalkInModal(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterWalkIn} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Deepak Sharma"
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Age</label>
                  <input
                    type="number"
                    value={walkInAge}
                    onChange={(e) => setWalkInAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Assign Physician</label>
                <select
                  required
                  value={walkInDocId}
                  onChange={(e) => setWalkInDocId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                >
                  <option value="">-- Choose Available Physician --</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.department_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Priority Rule Flags</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Senior Citizen', 'Emergency', 'Pediatric', 'Post-Op'].map((flg) => {
                    const active = walkInPriority.includes(flg);
                    return (
                      <button
                        type="button"
                        key={flg}
                        onClick={() =>
                          setWalkInPriority((prev) =>
                            active ? prev.filter((f) => f !== flg) : [...prev, flg]
                          )
                        }
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                          active
                            ? 'bg-[#60A5FA] text-[#0B1020] border-[#60A5FA]'
                            : 'bg-[#0F172A] light:bg-[#F8FAFC] text-[#94A3B8] border-[#29344D] light:border-[#E2E8F0]'
                        }`}
                      >
                        {flg}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={walkInLoading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                {walkInLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Check In Walk-In to Queue</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionView;
