import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Consultation, QueueEntry, Doctor, Appointment } from '../types';
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  AlertTriangle,
  Play,
  Check,
  UserCheck,
  History,
  Activity,
  X,
  FileText,
  User,
  TrendingUp,
  Calendar,
  Settings,
  ArrowRight,
  BellRing,
  CheckCheck,
  Sliders,
  Sparkles
} from 'lucide-react';
import { OperationsAnalytics } from '../components/OperationsAnalytics';

export const DoctorView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeConsult, setActiveConsult] = useState<Consultation | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [schedule, setSchedule] = useState<Appointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [history, setHistory] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Complete consultation modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [customDuration, setCustomDuration] = useState<number>(16);
  const [actionLoading, setActionLoading] = useState(false);

  // Delay reporting modal
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMins, setDelayMins] = useState(15);
  const [delayReason, setDelayReason] = useState('Emergency clinical consultation');

  // Elapsed timer for active consultation
  const [elapsedMinutes, setElapsedMinutes] = useState(8);

  const docId = user?.doctor_id || 'doc-mc-01';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activeRes, queueRes, docRes, histRes, apptsRes] = await Promise.all([
        api.getActiveConsultation(),
        api.getQueue({ doctor_id: docId }),
        api.getDoctor(docId),
        api.getConsultationHistory(),
        api.getAppointments()
      ]);
      setActiveConsult(activeRes.consultation || null);
      setQueue(queueRes.queue || []);
      setDoctorProfile(docRes.doctor || null);
      setHistory(histRes.consultations || []);

      // Filter today's appointments for this doctor
      const allAppts = apptsRes.appointments || [];
      const docAppts = allAppts.filter(
        (a) => a.doctor_id === docId || a.doctor_name === (docRes.doctor?.name || 'Dr. Rajesh Sharma')
      );
      setSchedule(docAppts);

      if (activeRes.consultation?.started_at) {
        const start = new Date(activeRes.consultation.started_at).getTime();
        const now = Date.now();
        const mins = Math.max(1, Math.round((now - start) / 60000));
        setElapsedMinutes(mins);
        setCustomDuration(mins);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Action 1: Call Patient (Transitions visit to 'called')
  const handleCallPatient = async (apptId: string, patientName: string) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      await api.callPatient(apptId);
      setActionMessage({
        type: 'success',
        text: `Called patient ${patientName} to ${doctorProfile?.room_number || 'Consulting Room 101'}. Notification sent!`
      });
      await fetchData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Call patient failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action 2: Start Consultation (Transitions visit to 'in_consultation')
  const handleStartConsultation = async (apptId: string) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      await api.startConsultation(apptId);
      setActionMessage({ type: 'success', text: 'Consultation session initiated. Consulting room marked occupied.' });
      await fetchData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Start consultation failed: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  // Action 3: Complete Consultation (Records notes, duration, frees room)
  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsult) return;
    setActionLoading(true);
    try {
      await api.completeConsultation(activeConsult._id, clinicalNotes, Number(customDuration));
      setShowCompleteModal(false);
      setClinicalNotes('');
      setActionMessage({ type: 'success', text: 'Consultation concluded successfully. Record logged and queue advanced.' });
      await fetchData();
    } catch (err: any) {
      alert(`Failed to complete: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBreak = async () => {
    if (!doctorProfile) return;
    const nextState = !doctorProfile.is_on_break;
    try {
      await api.setDoctorBreak(docId, nextState, 20);
      setActionMessage({
        type: 'success',
        text: nextState ? 'Physician break mode activated. Pacing updated.' : 'Resumed availability for consultations.'
      });
      await fetchData();
    } catch (err: any) {
      alert(`Break update failed: ${err.message}`);
    }
  };

  const handleReportDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.reportDoctorDelay(docId, Number(delayMins), delayReason);
      setShowDelayModal(false);
      setActionMessage({
        type: 'success',
        text: `Delay broadcasted (${delayMins}m). Waiting-time estimates recalibrated across all patient trackers.`
      });
      await fetchData();
    } catch (err: any) {
      alert(`Delay report failed: ${err.message}`);
    }
  };

  const waitingPatients = queue.filter((q) => q.status === 'checked_in' || q.status === 'waiting' || q.status === 'called');

  // Subroutes detection
  const path = location.pathname;
  const isScheduleView = path === '/doctor/schedule';
  const isQueueView = path === '/doctor/queue';
  const isConsultationsView = path === '/doctor/consultations';
  const isPatientsView = path === '/doctor/patients';
  const isAvailabilityView = path === '/doctor/availability';
  const isAnalyticsView = path === '/doctor/analytics';
  const isSettingsView = path === '/doctor/settings';

  return (
    <div className="space-y-6">
      {/* Action Notification Alert Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
              : 'bg-red-950/70 text-red-300 border border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Physician Header & Availability Bar */}
      <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F172A] light:bg-[#EFF6FF] text-[#60A5FA] light:text-[#2563EB] mb-1">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Consulting Room: {doctorProfile?.room_number || 'Room 101'}</span>
          </div>
          <h2 className="text-xl font-bold text-[#F1F5F9] light:text-[#0F172A]">
            {doctorProfile?.name || 'Dr. Rajesh Sharma'}
          </h2>
          <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
            {doctorProfile?.department_name} • {doctorProfile?.qualifications}
          </p>
        </div>

        {/* Quick Availability Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToggleBreak}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              doctorProfile?.is_on_break
                ? 'bg-amber-950/40 text-amber-300 border-amber-800'
                : 'bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#F1F5F9] border-[#29344D] light:border-[#E2E8F0]'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>{doctorProfile?.is_on_break ? 'On Break (Resume)' : 'Take Break'}</span>
          </button>

          <button
            onClick={() => setShowDelayModal(true)}
            className="px-3 py-1.5 rounded-lg bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#29344D] light:border-[#E2E8F0] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcast Delay</span>
          </button>
        </div>
      </div>

      {/* 1. ACTIVE CONSULTATION ROOM (Shown on Dashboard or /doctor/consultations) */}
      {(isConsultationsView || (!isScheduleView && !isQueueView && !isPatientsView && !isAvailabilityView && !isAnalyticsView && !isSettingsView)) && (
        <div className="bg-[#151D31] light:bg-white rounded-xl p-6 border border-[#29344D] light:border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] light:border-[#E2E8F0] mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">Active Consultation Room</h3>
            </div>
            <span className="text-xs text-[#94A3B8] light:text-[#475569]">
              Room Status: {activeConsult ? 'Occupied' : 'Awaiting Next Patient'}
            </span>
          </div>

          {activeConsult ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1B263D] text-[#60A5FA]">
                    Currently In Consultation
                  </span>
                  <h4 className="text-lg font-bold text-[#F1F5F9] light:text-[#0F172A] mt-1">
                    {activeConsult.patient_name}
                  </h4>
                  <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                    Appointment ID: <span className="font-mono">{activeConsult.appointment_id}</span>
                  </p>
                </div>

                {/* Elapsed Consultation Timer */}
                <div className="flex items-center gap-3">
                  <div className="text-center px-4 py-2 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE]">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] light:text-[#64748B] block">Elapsed Time</span>
                    <span className="text-2xl font-black text-[#60A5FA] light:text-[#2563EB]">
                      {elapsedMinutes}m
                    </span>
                  </div>

                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Conclude Consultation</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <UserCheck className="w-10 h-10 text-[#64748B] mx-auto mb-2" />
              <h4 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">No Active Consultation In Session</h4>
              <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-1 max-w-sm mx-auto">
                Call the next eligible waiting patient from your queue into the consulting room.
              </p>
              {waitingPatients.length > 0 && (
                <button
                  onClick={() => handleCallPatient(waitingPatients[0].appointment_id, waitingPatients[0].patient_name)}
                  disabled={actionLoading}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] text-[#0B1020] light:text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Call Next: {waitingPatients[0].patient_name}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. TODAY'S SCHEDULE VIEW */}
      {isScheduleView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">Today's Scheduled Appointments</h3>
              <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                Scheduled outpatient roster with arrival status and call controls ({schedule.length} bookings).
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-[#0F172A] light:bg-[#F1F5F9] font-mono text-[#60A5FA]">
              Today: Oct 25, 2026
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                  <th className="py-2.5 px-3 font-semibold">Time Slot</th>
                  <th className="py-2.5 px-3 font-semibold">Booking Ref</th>
                  <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                  <th className="py-2.5 px-3 font-semibold">Visit Type</th>
                  <th className="py-2.5 px-3 font-semibold">Priority</th>
                  <th className="py-2.5 px-3 font-semibold">Arrival Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                {schedule.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#64748B]">
                      No scheduled appointments assigned for this clinic session.
                    </td>
                  </tr>
                ) : (
                  schedule.map((appt) => (
                    <tr key={appt._id} className="hover:bg-[#1B263D]/40 light:hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-mono font-bold text-[#60A5FA] light:text-[#2563EB]">
                        {appt.scheduled_time || '09:00'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#94A3B8]">
                        {appt.booking_reference}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">
                        {appt.patient_name}
                      </td>
                      <td className="py-3 px-3 capitalize text-[#94A3B8]">
                        {appt.appointment_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3">
                        {appt.priority_flags && appt.priority_flags.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#1B263D] text-[#60A5FA] border border-[#29344D]">
                            {appt.priority_flags.join(', ')}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            appt.status === 'in_consultation'
                              ? 'bg-[#1B263D] text-[#60A5FA] border border-[#60A5FA] animate-pulse'
                              : appt.status === 'called'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-600'
                              : appt.status === 'completed'
                              ? 'bg-emerald-950/60 text-emerald-300'
                              : appt.status === 'checked_in' || appt.status === 'waiting'
                              ? 'bg-blue-950/60 text-blue-300'
                              : 'bg-[#0F172A] text-[#94A3B8]'
                          }`}
                        >
                          {appt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {(appt.status === 'waiting' || appt.status === 'checked_in') && (
                          <button
                            onClick={() => handleCallPatient(appt._id, appt.patient_name)}
                            disabled={actionLoading}
                            className="py-1 px-2.5 rounded-md bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] text-[#0B1020] light:text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                          >
                            <BellRing className="w-3 h-3" />
                            <span>Call Patient</span>
                          </button>
                        )}
                        {appt.status === 'called' && (
                          <button
                            onClick={() => handleStartConsultation(appt._id)}
                            disabled={actionLoading || !!activeConsult}
                            className="py-1 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start Visit</span>
                          </button>
                        )}
                        {appt.status === 'completed' && (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Concluded</span>
                          </span>
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

      {/* 3. WAITING QUEUE VIEW */}
      {(isQueueView || (!isScheduleView && !isConsultationsView && !isPatientsView && !isAvailabilityView && !isAnalyticsView && !isSettingsView)) && (
        <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">Waiting Patient Queue</h3>
              <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                Patients checked in and waiting in the clinical lobby ({waitingPatients.length} waiting).
              </p>
            </div>
            <span className="text-xs text-[#94A3B8] font-semibold">Priority Order</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                  <th className="py-2.5 px-3 font-semibold">Queue Position</th>
                  <th className="py-2.5 px-3 font-semibold">Ticket</th>
                  <th className="py-2.5 px-3 font-semibold">Patient Name</th>
                  <th className="py-2.5 px-3 font-semibold">Arrival / Check-in</th>
                  <th className="py-2.5 px-3 font-semibold">Priority</th>
                  <th className="py-2.5 px-3 font-semibold">Est. Wait</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                {waitingPatients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#64748B]">
                      Queue is currently clear. No patients waiting.
                    </td>
                  </tr>
                ) : (
                  waitingPatients.map((entry, idx) => (
                    <tr key={entry._id} className="hover:bg-[#1B263D]/40 light:hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-mono font-bold text-[#60A5FA] light:text-[#2563EB]">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#F1F5F9] light:text-[#0F172A]">
                        {entry.queue_number || `A${idx + 10}`}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">
                        {entry.patient_name}
                      </td>
                      <td className="py-3 px-3 text-[#94A3B8] light:text-[#475569]">
                        {entry.check_in_time ? new Date(entry.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Arrived'}
                      </td>
                      <td className="py-3 px-3">
                        {entry.priority_flags && entry.priority_flags.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#1B263D] text-[#60A5FA] border border-[#29344D]">
                            {entry.priority_flags.join(', ')}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs font-bold text-[#60A5FA]">
                        ~{entry.estimated_wait_minutes || (idx + 1) * 14}m
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            entry.status === 'called'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-600 animate-pulse'
                              : 'bg-blue-950/60 text-blue-300'
                          }`}
                        >
                          {entry.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {entry.status !== 'called' && (
                            <button
                              onClick={() => handleCallPatient(entry.appointment_id, entry.patient_name)}
                              disabled={actionLoading}
                              className="py-1 px-2.5 rounded-md bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] text-[#0B1020] light:text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                            >
                              <BellRing className="w-3 h-3" />
                              <span>Call</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleStartConsultation(entry.appointment_id)}
                            disabled={actionLoading || !!activeConsult}
                            className="py-1 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PATIENT HISTORY VIEW */}
      {isPatientsView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">Concluded Consultation Records</h3>
              <p className="text-xs text-[#94A3B8] light:text-[#475569]">Historical patient consultations with recorded durations and notes.</p>
            </div>
            <span className="text-xs text-[#94A3B8] font-semibold">{history.length} Visits Logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                  <th className="py-2 px-3 font-semibold">Patient</th>
                  <th className="py-2 px-3 font-semibold">Date & Completed Time</th>
                  <th className="py-2 px-3 font-semibold">Duration</th>
                  <th className="py-2 px-3 font-semibold">Clinical Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-[#64748B]">
                      No completed consultations recorded yet today.
                    </td>
                  </tr>
                ) : (
                  history.slice(0, 30).map((h) => (
                    <tr key={h._id} className="hover:bg-[#1B263D]/40 light:hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">{h.patient_name}</td>
                      <td className="py-3 px-3 text-[#94A3B8] light:text-[#475569]">
                        {h.completed_at ? new Date(h.completed_at).toLocaleString() : 'Concluded'}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#60A5FA]">{h.duration_minutes || 15} mins</td>
                      <td className="py-3 px-3 text-[#94A3B8] light:text-[#475569]">{h.notes || 'Routine outpatient follow-up.'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. DOCTOR ANALYTICS VIEW */}
      {isAnalyticsView && (
        <div className="space-y-6 animate-fade-in">
          <OperationsAnalytics organizationId={doctorProfile?.organization_id || 'org-metrocare-01'} />
        </div>
      )}

      {/* 6. AVAILABILITY & DELAYS VIEW */}
      {isAvailabilityView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl p-6 border border-[#29344D] light:border-[#E2E8F0] space-y-5 animate-fade-in">
          <h3 className="font-bold text-base text-[#F1F5F9] light:text-[#0F172A]">Physician Availability & Roster Pacing</h3>
          <p className="text-xs text-[#94A3B8] light:text-[#475569]">
            Signal sudden emergencies, break schedules, or delays. The adaptive waiting-time engine recalculates queues automatically.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-2">
              <span className="text-xs font-bold text-[#F1F5F9] light:text-[#0F172A] block">Scheduled Break Status</span>
              <p className="text-xs text-[#94A3B8]">Currently: {doctorProfile?.is_on_break ? 'On Break' : 'Active & Available'}</p>
              <button
                onClick={handleToggleBreak}
                className="mt-2 py-1.5 px-3 rounded-lg bg-[#60A5FA] text-[#0B1020] font-semibold text-xs"
              >
                {doctorProfile?.is_on_break ? 'Resume Availability' : 'Take 20m Break'}
              </button>
            </div>

            <div className="p-4 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-2">
              <span className="text-xs font-bold text-[#F1F5F9] light:text-[#0F172A] block">Reported Delay Offset</span>
              <p className="text-xs text-[#94A3B8]">Active delay: {doctorProfile?.reported_delay_minutes || 0} minutes</p>
              <button
                onClick={() => setShowDelayModal(true)}
                className="mt-2 py-1.5 px-3 rounded-lg bg-amber-500 text-[#0B1020] font-semibold text-xs"
              >
                Broadcast Clinical Delay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PRACTICE SETTINGS VIEW */}
      {isSettingsView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl p-6 border border-[#29344D] light:border-[#E2E8F0] space-y-5 animate-fade-in">
          <div>
            <h3 className="font-bold text-base text-[#F1F5F9] light:text-[#0F172A]">Practice & Consulting Room Preferences</h3>
            <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
              Customize nominal consultation duration, room displays, and schedule slots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-3">
              <label className="text-xs font-bold text-[#F1F5F9] light:text-[#0F172A] block">Assigned Consulting Room</label>
              <input
                type="text"
                defaultValue={doctorProfile?.room_number || 'Room 101'}
                className="w-full text-xs px-3 py-2 rounded-lg bg-[#151D31] light:bg-white border border-[#29344D] light:border-[#E2E8F0] text-[#F1F5F9] light:text-[#0F172A]"
              />
              <p className="text-[11px] text-[#94A3B8]">Displayed on patient tracker when you call them into the room.</p>
            </div>

            <div className="p-4 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-3">
              <label className="text-xs font-bold text-[#F1F5F9] light:text-[#0F172A] block">Target Nominal Consultation Slot</label>
              <select
                defaultValue="15"
                className="w-full text-xs px-3 py-2 rounded-lg bg-[#151D31] light:bg-white border border-[#29344D] light:border-[#E2E8F0] text-[#F1F5F9] light:text-[#0F172A]"
              >
                <option value="12">12 Minutes (High Throughput)</option>
                <option value="15">15 Minutes (Standard OPD)</option>
                <option value="20">20 Minutes (Comprehensive Review)</option>
                <option value="25">25 Minutes (Complex Diagnostic)</option>
              </select>
              <p className="text-[11px] text-[#94A3B8]">Feeds into predictive waiting time calculation.</p>
            </div>
          </div>
        </div>
      )}

      {/* Complete Consultation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <h3 className="font-bold text-base text-[#F1F5F9] light:text-[#0F172A]">Conclude Consultation</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteConsultation} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                  Recorded Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                  Clinical / Operational Summary Notes
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Patient presented with seasonal respiratory symptoms; recommended medication and follow-up in 10 days."
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Record & Advance Queue</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delay Reporting Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <h3 className="font-bold text-base text-[#F1F5F9] light:text-[#0F172A]">Broadcast Clinical Delay</h3>
              <button onClick={() => setShowDelayModal(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportDelay} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                  Delay Offset (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="90"
                  step="5"
                  value={delayMins}
                  onChange={(e) => setDelayMins(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Reason</label>
                <select
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                >
                  <option value="Emergency clinical consultation">Emergency clinical consultation</option>
                  <option value="Complex multi-symptom case">Complex multi-symptom case</option>
                  <option value="Ward rounds in inpatient department">Ward rounds in inpatient department</option>
                  <option value="Equipment recalibration">Equipment recalibration</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0B1020] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Update Waiting Time Predictions</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorView;
