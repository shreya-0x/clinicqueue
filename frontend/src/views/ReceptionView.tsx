import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Appointment, QueueEntry, Doctor, Patient } from '../types';
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
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';

export const ReceptionView: React.FC = () => {
  const { user } = useAuth();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptsRes, queueRes, docsRes] = await Promise.all([
        api.getAppointments(),
        api.getQueue({ organization_id: user?.organization_id || 'org-metrocare-01' }),
        api.getDoctors({ organization_id: user?.organization_id || 'org-metrocare-01' })
      ]);
      setAppointments(apptsRes.appointments || []);
      setQueueEntries(queueRes.queue || []);
      setDoctors(docsRes.doctors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
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
      setActionAlert({ type: 'success', text: 'Marked as no-show.' });
      await fetchData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message });
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!confirm('Cancel this appointment?')) return;
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
      alert('Patient name and doctor are required.');
      return;
    }
    setWalkInLoading(true);
    try {
      // 1. Register walk in patient
      const patRes = await api.registerWalkIn({
        name: walkInName,
        phone: walkInPhone || '+91 98000 00000',
        age: Number(walkInAge),
        gender: walkInGender
      });

      // 2. Book appointment today
      const today = new Date().toISOString().split('T')[0];
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

      // 3. Immediately check in
      await api.checkIn({
        appointment_id: apptRes.appointment._id,
        priority_flags: walkInPriority
      });

      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInPriority([]);
      setActionAlert({ type: 'success', text: `Walk-in patient ${walkInName} registered and checked in!` });
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

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Reception Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Outpatient Reception Desk</span>
            </div>
            <h1 className="text-2xl font-bold text-navy-900">
              MetroCare Apex Hospital • Daily Queue Orchestrator
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage patient check-ins, register unscheduled walk-ins, and authorize priority queue placement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Walk-in</span>
            </button>

            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {actionAlert && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold mb-6 flex items-center justify-between animate-fade-in ${
              actionAlert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>{actionAlert.text}</span>
            </div>
            <button onClick={() => setActionAlert(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Fast Check-In Form by Reference */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8">
          <h2 className="text-sm font-bold text-navy-900 mb-1">Fast Check-In (Booking Reference / QR Code)</h2>
          <p className="text-xs text-slate-500 mb-4">
            Enter booking reference code (e.g. CQ-DEMO-2026 or CQ-BKG-LIVE-01) for instant eligibility verification and queue placement.
          </p>

          <form onSubmit={handleManualCheckIn} className="flex gap-3 max-w-xl">
            <input
              type="text"
              placeholder="e.g. CQ-DEMO-2026"
              value={checkInRef}
              onChange={(e) => setCheckInRef(e.target.value)}
              className="flex-1 text-xs rounded-xl border border-slate-300 p-2.5 font-mono uppercase text-navy-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={checkInLoading || !checkInRef.trim()}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {checkInLoading ? 'Verifying...' : 'Check In Patient'}
            </button>
          </form>
        </div>

        {/* Live Active Queue Board */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-bold text-navy-900">Active Outpatient Queue Board</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                  {queueEntries.length} Patients Waiting / In Consult
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Queue automatically sorted by clinical priority score and arrival timestamp.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Priority Flags</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Predicted Wait</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queueEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Active waiting queue is currently clear.
                    </td>
                  </tr>
                ) : (
                  queueEntries.map((q, idx) => (
                    <tr key={q._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-brand-700">#{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-navy-900">{q.patient_name}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-navy-900">{q.doctor_name}</div>
                        <div className="text-[11px] text-slate-500">{q.department_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {q.check_in_time ? new Date(q.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {q.priority_flags?.length ? (
                          <div className="flex gap-1 flex-wrap">
                            {q.priority_flags.map((f, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            q.status === 'in_consultation'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse'
                              : 'bg-brand-50 text-brand-700'
                          }`}
                        >
                          {q.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">
                        {q.status === 'in_consultation' ? '0m (In Consult)' : `${q.predicted_wait_minutes || 15}m`}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {q.status !== 'in_consultation' && (
                          <button
                            onClick={() => handleMarkNoShow(q._id)}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            Mark No-Show
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Full Schedule Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900">Today's Appointment Schedule</h2>
              <p className="text-xs text-slate-500">Search appointments by patient, reference, or doctor.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search patient, doc, or ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-navy-900"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-300 p-2 bg-white text-navy-900"
              >
                <option value="">All Statuses</option>
                <option value="booked">Booked</option>
                <option value="checked_in">Checked In</option>
                <option value="in_consultation">In Consultation</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppts.slice(0, 20).map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-navy-900">{a.booking_reference}</td>
                    <td className="py-3.5 px-4 font-semibold text-navy-900">{a.patient_name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{a.doctor_name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{a.scheduled_time}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          a.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : a.status === 'checked_in' || a.status === 'waiting'
                            ? 'bg-brand-50 text-brand-700 border border-brand-200'
                            : a.status === 'in_consultation'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {a.status === 'booked' && (
                        <>
                          <button
                            onClick={() => handleCheckInDirect(a._id)}
                            className="px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[11px] transition-colors"
                          >
                            Check In
                          </button>
                          <button
                            onClick={() => handleCheckInDirect(a._id, ['elderly'])}
                            className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-[11px] transition-colors"
                            title="Check in with Elderly Priority (+10 score)"
                          >
                            + Elderly
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(a._id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {a.status === 'checked_in' && (
                        <span className="text-xs text-brand-700 font-medium">Checked In</span>
                      )}
                      {a.status === 'completed' && (
                        <span className="text-xs text-slate-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Walk-in Registration Modal */}
        {showWalkInModal && (
          <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-navy-900">Register Walk-in Patient</h3>
                <button onClick={() => setShowWalkInModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleWalkInSubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="e.g. Ramesh Verma"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-navy-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      placeholder="+91 98..."
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-navy-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={walkInAge}
                      onChange={(e) => setWalkInAge(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-navy-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Doctor</label>
                  <select
                    value={walkInDocId}
                    onChange={(e) => setWalkInDocId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-navy-900"
                  >
                    <option value="">-- Select Available Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} • {d.department_name} ({d.room_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Override Flags</label>
                  <div className="flex gap-2 flex-wrap">
                    {['elderly', 'mobility', 'pediatric', 'urgent_triage'].map((flag) => {
                      const isSelected = walkInPriority.includes(flag);
                      return (
                        <button
                          key={flag}
                          type="button"
                          onClick={() => {
                            setWalkInPriority((prev) =>
                              isSelected ? prev.filter((f) => f !== flag) : [...prev, flag]
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold capitalize transition-colors ${
                            isSelected
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {flag.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWalkInModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={walkInLoading}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                  >
                    {walkInLoading ? 'Registering...' : 'Complete Walk-in Check-in'}
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
