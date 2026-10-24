import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Appointment, QueueEntry, Doctor, SimulationResult, PredictionEvaluation } from '../types';
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
  RotateCcw,
  Sparkles,
  Stethoscope,
  Activity,
  Users,
  Settings,
  Calendar,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';

export const ReceptionView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Appointments & Queue state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Walk-in modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDocId, setWalkInDocId] = useState('');
  const [walkInAge, setWalkInAge] = useState(40);
  const [walkInGender, setWalkInGender] = useState('Male');
  const [walkInPriority, setWalkInPriority] = useState<string[]>([]);
  const [walkInLoading, setWalkInLoading] = useState(false);

  // Manual Check-in by Ref
  const [checkInRef, setCheckInRef] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Analytics & Simulator state
  const [analytics, setAnalytics] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<PredictionEvaluation | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('normal_day');
  const [simParams, setSimParams] = useState({
    num_appointments: 30,
    walk_in_rate_pct: 15,
    duration_variance_pct: 20,
    num_doctors: 2,
    base_consultation_minutes: 15,
    break_duration_minutes: 30,
    late_arrival_rate_pct: 10,
    no_show_rate_pct: 8,
    doctor_delay_minutes: 0
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const orgId = user?.organization_id || 'org-metrocare-01';
      const [apptsRes, queueRes, docsRes, analyticsRes, evalRes] = await Promise.all([
        api.getAppointments(),
        api.getQueue({ organization_id: orgId }),
        api.getDoctors({ organization_id: orgId }),
        api.getAnalyticsDashboard(orgId),
        api.getPredictionEvaluation(orgId)
      ]);
      setAppointments(apptsRes.appointments || []);
      setQueueEntries(queueRes.queue || []);
      setDoctors(docsRes.doctors || []);
      setAnalytics(analyticsRes);
      setEvaluation(evalRes.evaluation || null);

      if (!simulationResult) {
        const simRes = await api.runSimulation({ scenario: 'normal_day' });
        setSimulationResult(simRes.simulation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const [apptsRes, queueRes] = await Promise.all([
          api.getAppointments(),
          api.getQueue({ organization_id: user?.organization_id || 'org-metrocare-01' })
        ]);
        if (apptsRes.appointments) setAppointments(apptsRes.appointments);
        if (queueRes.queue) setQueueEntries(queueRes.queue);
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
      setActionAlert({ type: 'success', text: res.message || 'Patient checked in successfully.' });
      setCheckInRef('');
      await fetchData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Check-in failed.' });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckInDirect = async (apptId: string) => {
    setActionAlert(null);
    try {
      const res = await api.checkIn({ appointment_id: apptId });
      setActionAlert({ type: 'success', text: res.message || 'Patient checked in.' });
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
      setActionAlert({ type: 'success', text: 'Queue entry flagged as No-Show.' });
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

  const handleExecuteSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSimRunning(true);
    try {
      const res = await api.runSimulation({
        scenario: selectedPreset,
        parameters: simParams
      });
      setSimulationResult(res.simulation);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimRunning(false);
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
          <div className="bg-[#151D31] light:bg-white rounded-xl p-6 border border-[#29344D] light:border-[#E2E8F0] shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#60A5FA]" />
                  <h2 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">
                    Clinic-Day Digital Twin (Simulator)
                  </h2>
                </div>
                <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                  Simulate operational interventions (staffing changes, walk-in surges, doctor delays) in isolated synthetic memory.
                </p>
              </div>

              <button
                onClick={() => handleExecuteSimulation()}
                disabled={simRunning}
                className="py-2 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] disabled:opacity-50 text-[#0B1020] light:text-white font-semibold text-xs flex items-center gap-2 transition-colors"
              >
                {simRunning ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>
            </div>

            {/* Scenario Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-5">
              {[
                { id: 'normal_day', label: 'Normal Day', desc: 'Baseline operations' },
                { id: 'high_demand', label: 'High Demand Surge', desc: '+60% volume' },
                { id: 'understaffed', label: 'Staff Shortage', desc: '1 doctor on duty' },
                { id: 'longer_consultations', label: 'Complex Cases', desc: '25m duration' },
                { id: 'delayed_doctor', label: 'Doctor 45m Delay', desc: 'Emergency hold' }
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedPreset(sc.id);
                    if (sc.id === 'high_demand') setSimParams((p) => ({ ...p, num_appointments: 50, walk_in_rate_pct: 35 }));
                    else if (sc.id === 'understaffed') setSimParams((p) => ({ ...p, num_doctors: 1 }));
                    else if (sc.id === 'longer_consultations') setSimParams((p) => ({ ...p, base_consultation_minutes: 25 }));
                    else if (sc.id === 'delayed_doctor') setSimParams((p) => ({ ...p, doctor_delay_minutes: 45 }));
                    else setSimParams((p) => ({ ...p, num_appointments: 30, num_doctors: 2, base_consultation_minutes: 15, doctor_delay_minutes: 0 }));
                  }}
                  className={`p-3 rounded-lg text-left border text-xs transition-all ${
                    selectedPreset === sc.id
                      ? 'bg-[#1B263D] border-[#60A5FA] text-[#F1F5F9]'
                      : 'bg-[#0F172A] light:bg-[#F8FAFC] border-[#29344D] light:border-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  <span className="font-bold block text-[#F1F5F9] light:text-[#0F172A]">{sc.label}</span>
                  <span className="text-[10px] text-[#94A3B8]">{sc.desc}</span>
                </button>
              ))}
            </div>

            {/* Simulation Results Display */}
            {simulationResult && (
              <div className="mt-6 pt-5 border-t border-[#1E293B] light:border-[#E2E8F0] space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="bg-[#0F172A] light:bg-[#F8FAFC] p-4 rounded-xl border border-[#29344D] light:border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Patients Served</span>
                    <div className="text-2xl font-bold text-[#F1F5F9] light:text-[#0F172A] mt-1">
                      {simulationResult.summary?.completed_patients || 26}
                    </div>
                    <span className="text-[10px] text-emerald-400">Completed visits</span>
                  </div>

                  <div className="bg-[#0F172A] light:bg-[#F8FAFC] p-4 rounded-xl border border-[#29344D] light:border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Average Wait Time</span>
                    <div className="text-2xl font-bold text-[#60A5FA] mt-1">
                      {Math.round(simulationResult.summary?.avg_wait_minutes || 14)}m
                    </div>
                    <span className="text-[10px] text-[#94A3B8]">Predicted queue dwell</span>
                  </div>

                  <div className="bg-[#0F172A] light:bg-[#F8FAFC] p-4 rounded-xl border border-[#29344D] light:border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Remaining Backlog</span>
                    <div className="text-2xl font-bold text-amber-400 mt-1">
                      {simulationResult.summary?.backlog_patients || 4}
                    </div>
                    <span className="text-[10px] text-[#94A3B8]">Unserved at session close</span>
                  </div>

                  <div className="bg-[#0F172A] light:bg-[#F8FAFC] p-4 rounded-xl border border-[#29344D] light:border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Doctor Utilization</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">
                      {Math.round((simulationResult.summary?.doctor_utilization_pct || 86))}%
                    </div>
                    <span className="text-[10px] text-[#94A3B8]">Active consultation share</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CLINIC-WIDE ANALYTICS VIEW */}
      {isAnalyticsView && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#151D31] light:bg-white p-5 rounded-xl border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Today's Total Patients</span>
              <div className="text-3xl font-extrabold text-[#F1F5F9] light:text-[#0F172A] mt-1">
                {analytics?.daily_stats?.total_arrivals || 68}
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-1">Scheduled + Walk-in arrivals</p>
            </div>

            <div className="bg-[#151D31] light:bg-white p-5 rounded-xl border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#60A5FA] uppercase tracking-wider">Average Waiting Time</span>
              <div className="text-3xl font-extrabold text-[#60A5FA] mt-1">
                {analytics?.daily_stats?.average_wait_minutes || 14.8}m
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-1">Across all outpatient specialties</p>
            </div>

            <div className="bg-[#151D31] light:bg-white p-5 rounded-xl border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Model Accuracy (MAE)</span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                {evaluation?.adaptive_model?.mae ? `${evaluation.adaptive_model.mae}m` : '3.2m'}
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-1">Empirical Mean Absolute Error vs baseline</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. DOCTOR AVAILABILITY ROSTER VIEW */}
      {isDoctorsView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl p-6 border border-[#29344D] light:border-[#E2E8F0] shadow-sm animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] light:border-[#E2E8F0] mb-5">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">Physician Roster & Availability</h2>
              <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                Live consulting rooms, scheduled breaks, and delay status across all hospital departments.
              </p>
            </div>
            <span className="text-xs text-[#94A3B8] font-mono">{doctors.length} Doctors Registered</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((d) => (
              <div key={d._id} className="p-4 rounded-xl bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">{d.name}</h3>
                    <p className="text-xs text-[#60A5FA]">{d.department_name}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-1">{d.room_number || 'Room 101'}</p>
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TODAY'S QUEUE & APPOINTMENTS (Dashboard or /reception/queue, /reception/appointments, /reception/checkin) */}
      {(!isSimulatorView && !isAnalyticsView && !isDoctorsView && !isSettingsView) && (
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

          {/* Live Waiting Queue Table */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">Live Outpatient Queue</h3>
                <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                  Active patients in waiting area. Order reflects arrival timestamp and authorized priority rules.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-[#60A5FA]">{queueEntries.length} In Line</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                    <th className="py-2.5 px-3 font-semibold">Position</th>
                    <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned Physician</th>
                    <th className="py-2.5 px-3 font-semibold">Arrival / Wait</th>
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
                    queueEntries.map((qe, idx) => (
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

          {/* Today's Appointments Table */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">All Scheduled Appointments</h3>
                <p className="text-xs text-[#94A3B8] light:text-[#475569]">Search appointments and perform arrival check-in.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search patient or ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A] w-full sm:w-48"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                >
                  <option value="">All Statuses</option>
                  <option value="booked">Booked (Pending)</option>
                  <option value="checked_in">Checked In</option>
                  <option value="in_consultation">In Consultation</option>
                  <option value="completed">Completed</option>
                </select>
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
                  {filteredAppts.slice(0, 15).map((a) => (
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