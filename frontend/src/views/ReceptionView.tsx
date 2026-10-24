import React, { useState, useEffect } from 'react';
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
  Users
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
  const [activeTab, setActiveTab] = useState<'queue' | 'doctors' | 'analytics' | 'simulator'>('queue');

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

      // Run initial simulation
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

  const handleCheckInDirect = async (apptId: string, priority_flags: string[] = []) => {
    setActionAlert(null);
    try {
      const res = await api.checkIn({ appointment_id: apptId, priority_flags });
      setActionAlert({ type: 'success', text: res.message || 'Patient checked in.' });
      await fetchData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Check-in failed.' });
    }
  };

  const handleMarkNoShow = async (queueId: string) => {
    if (!confirm('Mark patient as No-Show? They will be removed from the active queue.')) return;
    try {
      await api.markNoShow(queueId);
      setActionAlert({ type: 'success', text: 'Patient recorded as no-show.' });
      await fetchData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message });
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!confirm('Cancel this scheduled appointment?')) return;
    try {
      await api.cancelAppointment(apptId);
      setActionAlert({ type: 'success', text: 'Appointment cancelled.' });
      await fetchData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message });
    }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInDocId) {
      alert('Patient name and doctor selection are required.');
      return;
    }
    setWalkInLoading(true);
    try {
      const patRes = await api.registerWalkIn({
        name: walkInName,
        phone: walkInPhone || '+91 98000 00000',
        age: Number(walkInAge),
        gender: walkInGender
      });

      const today = '2026-10-25';
      const nowTime = new Date().toTimeString().slice(0, 5);
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

  // Run Simulator
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

  return (
    <div className="min-h-screen bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Reception Header */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-6 border border-[#343347] light:border-[#DDD9E9] shadow-xs mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Receptionist Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              MetroCare Apex • Daily Queue Orchestrator
            </h1>
            <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-0.5">
              Coordinate arrivals, register walk-ins, oversee doctor availability, analyze operational flow, and run digital twin simulations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] light:bg-[#6D28D9] light:hover:bg-[#5B21B6] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Walk-in</span>
            </button>
            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-[#343347] light:border-[#DDD9E9] hover:bg-[#222233] light:hover:bg-[#F0EFF7] text-[#AAA6BC] light:text-[#625D74] transition-colors"
              title="Refresh queue data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionAlert && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold mb-6 flex items-center justify-between animate-fade-in ${
              actionAlert.type === 'success'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950/70 text-rose-300 border border-rose-800'
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

        {/* Tabs: Queue | Doctors | Analytics | Simulator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'queue'
                ? 'bg-[#8B5CF6] light:bg-[#6D28D9] text-white shadow-xs'
                : 'bg-[#1B1B28] light:bg-white text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] border border-[#343347] light:border-[#DDD9E9]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Today's Queue & Check-In Desk</span>
            <span className="px-1.5 py-0.2 bg-[#29213D] light:bg-[#EDE9FE] rounded text-[10px] font-bold">
              {queueEntries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'doctors'
                ? 'bg-[#8B5CF6] light:bg-[#6D28D9] text-white shadow-xs'
                : 'bg-[#1B1B28] light:bg-white text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] border border-[#343347] light:border-[#DDD9E9]'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Physicians & Availability ({doctors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'analytics'
                ? 'bg-[#8B5CF6] light:bg-[#6D28D9] text-white shadow-xs'
                : 'bg-[#1B1B28] light:bg-white text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] border border-[#343347] light:border-[#DDD9E9]'
            }`}
          >
            <LineChartIcon className="w-4 h-4" />
            <span>Clinic-Wide Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'simulator'
                ? 'bg-[#8B5CF6] light:bg-[#6D28D9] text-white shadow-xs'
                : 'bg-[#1B1B28] light:bg-white text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] border border-[#343347] light:border-[#DDD9E9]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Digital Twin Simulator</span>
            <span className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse ml-1" />
          </button>
        </div>

        {/* TAB 1: QUEUE & CHECK-IN DESK */}
        {activeTab === 'queue' && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Check-in Bar */}
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9] shadow-xs">
              <form onSubmit={handleManualCheckIn} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="text-xs font-bold text-[#F4F2FA] light:text-[#242033] shrink-0 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Express Reference Check-In:</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. CQ-2026-9812"
                  value={checkInRef}
                  onChange={(e) => setCheckInRef(e.target.value)}
                  className="flex-1 w-full font-mono uppercase text-xs rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] px-3.5 py-2 text-[#F4F2FA] light:text-[#242033] focus:outline-hidden focus:ring-1 focus:ring-[#8B5CF6]"
                />
                <button
                  type="submit"
                  disabled={checkInLoading || !checkInRef.trim()}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] light:bg-[#6D28D9] light:hover:bg-[#5B21B6] text-white font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {checkInLoading ? 'Verifying...' : 'Check In Patient'}
                </button>
              </form>
            </div>

            {/* Live Queue Cards */}
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1] mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#F4F2FA] light:text-[#242033]">Live Waiting Queue</h2>
                  <p className="text-xs text-[#AAA6BC] light:text-[#625D74]">
                    Active patients waiting in clinic. Order reflects arrival timestamp and authorized clinical priority flags.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#8B5CF6] font-bold">
                  {queueEntries.length} Active in Line
                </div>
              </div>

              {queueEntries.length === 0 ? (
                <div className="py-12 text-center text-[#817C95]">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-[#817C95]" />
                  <p className="text-xs">No patients currently waiting in the active queue.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#222233] light:bg-[#F0EFF7] text-[#817C95] light:text-[#777188] uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Pos</th>
                        <th className="py-3 px-4">Patient Name</th>
                        <th className="py-3 px-4">Assigned Doctor</th>
                        <th className="py-3 px-4">Arrival / Wait</th>
                        <th className="py-3 px-4">Priority Flags</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#29293A] light:divide-[#EAE7F1]">
                      {queueEntries.map((qe, idx) => (
                        <tr key={qe._id} className="hover:bg-[#222233]/40 light:hover:bg-[#F0EFF7]/40">
                          <td className="py-3 px-4 font-extrabold text-[#A78BFA] light:text-[#6D28D9]">
                            #{qe.queue_position || idx + 1}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#F4F2FA] light:text-[#242033]">
                            {qe.patient_name}
                          </td>
                          <td className="py-3 px-4 text-[#AAA6BC] light:text-[#625D74]">
                            Dr. {qe.doctor_name} ({qe.department_name})
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#F4F2FA] light:text-[#242033]">
                              ~{qe.predicted_wait_minutes || 14}m wait
                            </div>
                            <div className="text-[10px] text-[#817C95]">
                              Arrived: {qe.check_in_time ? new Date(qe.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {qe.priority_flags && qe.priority_flags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {qe.priority_flags.map((flg, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#29213D] text-[#A78BFA] border border-[#343347] uppercase">
                                    {flg}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Standard</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              qe.status === 'in_consultation'
                                ? 'bg-purple-950/70 text-purple-300 border border-purple-800 animate-pulse'
                                : 'bg-[#29213D] text-[#A78BFA] border border-[#8B5CF6]'
                            }`}>
                              {qe.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleMarkNoShow(qe._id)}
                              className="px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-950/30 text-xs font-medium transition-colors"
                            >
                              No-Show
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Today's Appointments Schedule Table */}
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#29293A] light:border-[#EAE7F1] mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#F4F2FA] light:text-[#242033]">Today's Scheduled Appointments</h2>
                  <p className="text-xs text-[#AAA6BC] light:text-[#625D74]">
                    Filter by booking status, search by patient or reference, and execute check-ins.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-[#817C95] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search patient, doc, ref..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] text-xs text-[#F4F2FA] light:text-[#242033]"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] py-1.5 px-3 text-xs text-[#F4F2FA] light:text-[#242033]"
                  >
                    <option value="">All Statuses</option>
                    <option value="booked">Booked (Pending Check-in)</option>
                    <option value="checked_in">Checked In</option>
                    <option value="in_consultation">In Consultation</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#222233] light:bg-[#F0EFF7] text-[#817C95] light:text-[#777188] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Doctor & Specialty</th>
                      <th className="py-3 px-4">Scheduled Slot</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Desk Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#29293A] light:divide-[#EAE7F1]">
                    {filteredAppts.slice(0, 15).map((a) => (
                      <tr key={a._id} className="hover:bg-[#222233]/40 light:hover:bg-[#F0EFF7]/40">
                        <td className="py-3.5 px-4 font-mono font-medium text-[#A78BFA] light:text-[#6D28D9]">{a.booking_reference}</td>
                        <td className="py-3.5 px-4 font-semibold text-[#F4F2FA] light:text-[#242033]">{a.patient_name}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-[#F4F2FA] light:text-[#242033]">{a.doctor_name}</div>
                          <div className="text-[10px] text-[#817C95]">{a.department_name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-[#F4F2FA] light:text-[#242033]">{a.appointment_date}</div>
                          <div className="text-[10px] text-[#817C95]">{a.scheduled_time}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            a.status === 'completed'
                              ? 'bg-emerald-950/70 text-emerald-300'
                              : a.status === 'checked_in' || a.status === 'waiting'
                              ? 'bg-[#29213D] text-[#A78BFA] border border-[#8B5CF6]'
                              : a.status === 'in_consultation'
                              ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                              : a.status === 'cancelled'
                              ? 'bg-rose-950/70 text-rose-300'
                              : 'bg-[#222233] text-[#AAA6BC]'
                          }`}>
                            {a.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {a.status === 'booked' && (
                            <button
                              onClick={() => handleCheckInDirect(a._id)}
                              className="px-3 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] light:bg-[#6D28D9] light:hover:bg-[#5B21B6] text-white font-semibold text-xs transition-colors"
                            >
                              Check In
                            </button>
                          )}
                          {a.status === 'completed' && a.consultation_duration_minutes && (
                            <span className="text-xs text-[#AAA6BC]">{a.consultation_duration_minutes}m duration</span>
                          )}
                          {a.status === 'booked' && (
                            <button
                              onClick={() => handleCancelAppointment(a._id)}
                              className="ml-2 text-rose-400 hover:underline text-xs"
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

        {/* TAB 2: PHYSICIANS & AVAILABILITY */}
        {activeTab === 'doctors' && (
          <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs animate-fade-in">
            <h2 className="text-lg font-bold text-[#F4F2FA] light:text-[#242033] mb-1">Outpatient Specialists & Room Status</h2>
            <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mb-6">
              Live status, consultation pacing benchmarks, and break management across departments.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((d) => (
                <div key={d._id} className="p-4 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-[#F4F2FA] light:text-[#242033] text-sm">{d.name}</h3>
                      <p className="text-[#AAA6BC] light:text-[#625D74]">{d.department_name}</p>
                      <p className="text-[11px] text-[#817C95] mt-1">Room {d.room_number}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.is_available && !d.is_on_break
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                        : d.is_on_break
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                        : 'bg-rose-950/70 text-rose-300 border border-rose-800'
                    }`}>
                      {d.is_on_break ? 'On Break' : d.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#343347] light:border-[#DDD9E9] flex items-center justify-between text-[11px] text-[#AAA6BC] light:text-[#625D74]">
                    <span>Pacing Benchmark:</span>
                    <span className="font-bold text-[#F4F2FA] light:text-[#242033]">{d.average_consultation_minutes || 15} mins / visit</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CLINIC-WIDE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9]">
                <span className="text-[11px] text-[#817C95] uppercase font-semibold">Total Visits Evaluated</span>
                <div className="text-2xl font-extrabold text-[#F4F2FA] light:text-[#242033] mt-1">
                  {analytics?.kpis?.total_appointments || 320}
                </div>
                <p className="text-[10px] text-[#AAA6BC] mt-0.5">Historical outpatient records</p>
              </div>

              <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9]">
                <span className="text-[11px] text-[#817C95] uppercase font-semibold">Average Actual Wait</span>
                <div className="text-2xl font-extrabold text-[#A78BFA] light:text-[#6D28D9] mt-1">
                  {analytics?.kpis?.average_wait_minutes || 18.4}m
                </div>
                <p className="text-[10px] text-[#AAA6BC] mt-0.5">Arrival to consultation start</p>
              </div>

              <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9]">
                <span className="text-[11px] text-[#817C95] uppercase font-semibold">Adaptive Engine MAE</span>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {evaluation?.adaptive_model?.mae || 3.8}m
                </div>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">vs 11.2m baseline error</p>
              </div>

              <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9]">
                <span className="text-[11px] text-[#817C95] uppercase font-semibold">Completed Consultations</span>
                <div className="text-2xl font-extrabold text-[#F4F2FA] light:text-[#242033] mt-1">
                  {analytics?.kpis?.completed_appointments || 268}
                </div>
                <p className="text-[10px] text-[#AAA6BC] mt-0.5">Full lifecycle concluded</p>
              </div>
            </div>

            {/* Hourly Congestion Chart */}
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs">
              <h3 className="text-base font-bold text-[#F4F2FA] light:text-[#242033] mb-4">Hourly Arrival Congestion Curve</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.hourly_congestion || []}>
                    <defs>
                      <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#343347" />
                    <XAxis dataKey="hour" stroke="#817C95" fontSize={11} />
                    <YAxis stroke="#817C95" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#1B1B28', borderColor: '#343347', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="arrivals" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorArrivals)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIGITAL TWIN SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-8 animate-fade-in">
            {/* Simulator Explanation Card */}
            <div className="bg-gradient-to-br from-[#1B1B28] to-[#29213D] rounded-2xl p-6 border border-[#343347] light:border-[#DDD9E9] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="w-5 h-5 text-[#A78BFA]" />
                <h2 className="text-xl font-bold text-[#F4F2FA]">Clinic-Day Digital Twin (Simulator)</h2>
              </div>
              <p className="text-xs text-[#AAA6BC] leading-relaxed max-w-3xl">
                Test hypothetical operational interventions—volume surges, unscheduled emergency delays, walk-in rate spikes—in
                <strong className="text-white"> strict data isolation</strong>. Simulating a virtual clinic day does not alter live queue entries or patient records.
              </p>
            </div>

            {/* Presets Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { id: 'normal_day', label: 'Normal Operating Day', desc: 'Standard flow, 2 doctors, 15% walk-ins' },
                { id: 'surge_congestion', label: 'High-Demand Surge', desc: '40 appointments, 35% walk-ins, +40% variance' },
                { id: 'reduced_staffing', label: 'Reduced Staffing', desc: '1 doctor on duty, 35m delay buffer' },
                { id: 'consultation_delays', label: 'Emergency Delays', desc: 'Prolonged complex case review' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPreset(p.id);
                    if (p.id === 'surge_congestion') {
                      setSimParams({ ...simParams, num_appointments: 40, walk_in_rate_pct: 35, num_doctors: 2 });
                    } else if (p.id === 'reduced_staffing') {
                      setSimParams({ ...simParams, num_doctors: 1, doctor_delay_minutes: 35 });
                    } else {
                      setSimParams({ ...simParams, num_appointments: 30, walk_in_rate_pct: 15, num_doctors: 2, doctor_delay_minutes: 0 });
                    }
                  }}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    selectedPreset === p.id
                      ? 'bg-[#29213D] border-[#8B5CF6] text-white shadow-xs'
                      : 'bg-[#1B1B28] border-[#343347] text-[#AAA6BC] hover:border-[#8B5CF6]/50'
                  }`}
                >
                  <div className="font-bold text-xs text-[#F4F2FA]">{p.label}</div>
                  <p className="text-[11px] text-[#AAA6BC] mt-1">{p.desc}</p>
                </button>
              ))}
            </div>

            {/* Controls & Execution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sliders Form */}
              <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 text-xs space-y-4">
                <h3 className="font-bold text-[#F4F2FA] light:text-[#242033] text-sm">Simulation Parameters</h3>

                <div>
                  <div className="flex justify-between text-[#AAA6BC] mb-1">
                    <span>Scheduled Appointments:</span>
                    <span className="font-bold text-[#F4F2FA]">{simParams.num_appointments}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={simParams.num_appointments}
                    onChange={(e) => setSimParams({ ...simParams, num_appointments: Number(e.target.value) })}
                    className="w-full accent-[#8B5CF6]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#AAA6BC] mb-1">
                    <span>Walk-In Rate (%):</span>
                    <span className="font-bold text-[#F4F2FA]">{simParams.walk_in_rate_pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={simParams.walk_in_rate_pct}
                    onChange={(e) => setSimParams({ ...simParams, walk_in_rate_pct: Number(e.target.value) })}
                    className="w-full accent-[#8B5CF6]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#AAA6BC] mb-1">
                    <span>On-Duty Doctors:</span>
                    <span className="font-bold text-[#F4F2FA]">{simParams.num_doctors}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={simParams.num_doctors}
                    onChange={(e) => setSimParams({ ...simParams, num_doctors: Number(e.target.value) })}
                    className="w-full accent-[#8B5CF6]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#AAA6BC] mb-1">
                    <span>Emergency Delay (minutes):</span>
                    <span className="font-bold text-[#F4F2FA]">{simParams.doctor_delay_minutes}m</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={simParams.doctor_delay_minutes}
                    onChange={(e) => setSimParams({ ...simParams, doctor_delay_minutes: Number(e.target.value) })}
                    className="w-full accent-[#8B5CF6]"
                  />
                </div>

                <button
                  onClick={() => handleExecuteSimulation()}
                  disabled={simRunning}
                  className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{simRunning ? 'Simulating Clinic Day...' : 'Execute Discrete Event Simulation'}</span>
                </button>
              </div>

              {/* Simulation Results Card */}
              {simulationResult && (
                <div className="lg:col-span-2 bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1]">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#A78BFA] tracking-wider">Simulation Output</div>
                        <h3 className="text-lg font-bold text-[#F4F2FA] light:text-[#242033] capitalize">
                          {simulationResult.scenario_name.replace('_', ' ')}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#29213D] text-[#A78BFA] border border-[#343347]">
                        Discrete Event Model
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 text-xs">
                      <div className="p-3 rounded-xl bg-[#222233] light:bg-[#F0EFF7]">
                        <span className="text-[#817C95]">Patients Served</span>
                        <div className="text-xl font-extrabold text-[#F4F2FA] light:text-[#242033] mt-0.5">
                          {simulationResult.results.patients_served}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#222233] light:bg-[#F0EFF7]">
                        <span className="text-[#817C95]">Average Wait</span>
                        <div className="text-xl font-extrabold text-[#A78BFA] mt-0.5">
                          {simulationResult.results.average_wait_minutes}m
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#222233] light:bg-[#F0EFF7]">
                        <span className="text-[#817C95]">90th Percentile Wait</span>
                        <div className="text-xl font-extrabold text-amber-400 mt-0.5">
                          {simulationResult.results.p90_wait_minutes}m
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#222233] light:bg-[#F0EFF7]">
                        <span className="text-[#817C95]">Doctor Utilization</span>
                        <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                          {simulationResult.results.doctor_utilization_pct}%
                        </div>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="h-48 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={simulationResult.results.hourly_congestion}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#343347" />
                          <XAxis dataKey="hour" stroke="#817C95" fontSize={10} />
                          <YAxis stroke="#817C95" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#1B1B28', borderColor: '#343347', borderRadius: '12px' }} />
                          <Bar dataKey="completed" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Completed Consults" />
                          <Bar dataKey="arrivals" fill="#343347" radius={[4, 4, 0, 0]} name="Incoming Arrivals" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#817C95] mt-4 italic border-t border-[#29293A] pt-3">
                    Decision Support Projections: Use these virtual simulation curves to test adding buffer slots or adjusting doctor duty schedules before applying changes to live clinical operations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Walk-in Registration Modal */}
        {showWalkInModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#343347] light:border-[#DDD9E9] text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1]">
                <h3 className="text-base font-bold text-[#F4F2FA] light:text-[#242033]">Register Unscheduled Walk-in Patient</h3>
                <button
                  onClick={() => setShowWalkInModal(false)}
                  className="p-1 rounded-lg text-[#817C95] hover:text-[#F4F2FA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleWalkInSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block font-semibold text-[#AAA6BC] mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#AAA6BC] mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98000 00000"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#AAA6BC] mb-1">Age & Gender</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={walkInAge}
                        onChange={(e) => setWalkInAge(Number(e.target.value))}
                        className="w-20 rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                      />
                      <select
                        value={walkInGender}
                        onChange={(e) => setWalkInGender(e.target.value)}
                        className="flex-1 rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#AAA6BC] mb-1">Assign Outpatient Specialist</label>
                  <select
                    value={walkInDocId}
                    onChange={(e) => setWalkInDocId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                  >
                    <option value="">-- Select Available Physician --</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} • {d.department_name} (Room {d.room_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#AAA6BC] mb-1">Clinical Priority Flags (Authorized)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['elderly', 'mobility', 'pediatric'].map((flg) => {
                      const isSel = walkInPriority.includes(flg);
                      return (
                        <button
                          type="button"
                          key={flg}
                          onClick={() => {
                            if (isSel) {
                              setWalkInPriority(walkInPriority.filter((f) => f !== flg));
                            } else {
                              setWalkInPriority([...walkInPriority, flg]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg capitalize font-semibold text-[11px] transition-colors ${
                            isSel
                              ? 'bg-[#8B5CF6] text-white shadow-xs'
                              : 'bg-[#222233] text-[#AAA6BC] border border-[#343347]'
                          }`}
                        >
                          +{flg}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWalkInModal(false)}
                    className="px-4 py-2 rounded-xl text-[#AAA6BC] hover:bg-[#222233]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={walkInLoading}
                    className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold disabled:opacity-50"
                  >
                    {walkInLoading ? 'Registering...' : 'Register & Enter Queue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
