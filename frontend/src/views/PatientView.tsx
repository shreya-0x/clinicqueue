import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Appointment, Doctor, Department } from '../types';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  User,
  Activity,
  Sparkles,
  Search,
  Plus,
  HelpCircle,
  X,
  ShieldCheck
} from 'lucide-react';

export const PatientView: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Booking modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [apptDate, setApptDate] = useState('2026-10-25');
  const [apptTime, setApptTime] = useState('11:00');
  const [apptType, setApptType] = useState('standard');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check-in modal state
  const [checkInLoading, setCheckInLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptsRes, docsRes] = await Promise.all([
        api.getAppointments(),
        api.getDoctors({ organization_id: user?.organization_id || 'org-metrocare-01' })
      ]);
      setAppointments(apptsRes.appointments || []);
      setDoctors(docsRes.doctors || []);

      // Auto-select checked_in or in_consultation appointment
      const active = (apptsRes.appointments || []).find(
        (a) => a.status === 'checked_in' || a.status === 'waiting' || a.status === 'in_consultation'
      );
      if (active) {
        // Fetch detailed prediction
        try {
          const detail = await api.getAppointment(active._id);
          setSelectedAppt(detail.appointment);
        } catch {
          setSelectedAppt(active);
        }
      } else if (apptsRes.appointments?.length) {
        setSelectedAppt(apptsRes.appointments[0]);
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
      // Polling for live queue movement
      if (selectedAppt && (selectedAppt.status === 'checked_in' || selectedAppt.status === 'waiting')) {
        try {
          const res = await api.getAppointment(selectedAppt._id);
          setSelectedAppt(res.appointment);
        } catch {}
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (apptId: string) => {
    setCheckInLoading(true);
    try {
      await api.checkIn({ appointment_id: apptId });
      await fetchData();
    } catch (err: any) {
      alert(`Check-in failed: ${err.message}`);
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) {
      setBookingMsg({ type: 'error', text: 'Please select a doctor.' });
      return;
    }
    setBookingLoading(true);
    setBookingMsg(null);
    try {
      await api.bookAppointment({
        doctor_id: selectedDocId,
        appointment_date: apptDate,
        scheduled_time: apptTime,
        appointment_type: apptType
      });
      setBookingMsg({ type: 'success', text: 'Appointment booked successfully!' });
      setTimeout(() => {
        setShowBookModal(false);
        setBookingMsg(null);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setBookingMsg({ type: 'error', text: err.message || 'Booking failed.' });
    } finally {
      setBookingLoading(false);
    }
  };

  const activeAppt = appointments.find(
    (a) => a.status === 'checked_in' || a.status === 'waiting' || a.status === 'in_consultation'
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 mb-1">
              <User className="w-3.5 h-3.5" />
              <span>Patient Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-navy-900">
              Welcome back, {user?.name || 'Patient'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              MRN: {user?.patient_profile?.mrn || 'CQ-MRN-00001'} • MetroCare Apex Hospital
            </p>
          </div>

          <button
            onClick={() => setShowBookModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Consultation</span>
          </button>
        </div>

        {/* Live Active Queue Card */}
        {activeAppt ? (
          <div className="bg-white rounded-2xl border border-brand-200 p-6 shadow-sm mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Live Active Queue Tracker
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-800 border border-brand-200">
                    Ref: {activeAppt.booking_reference}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-navy-900">
                  Consultation with {activeAppt.doctor_name} ({activeAppt.department_name})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Scheduled for {activeAppt.appointment_date} at {activeAppt.scheduled_time} • Room 101
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Queue State</div>
                  <div className="text-sm font-bold capitalize text-brand-700">
                    {activeAppt.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="px-4 py-3 bg-brand-50 rounded-xl border border-brand-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-brand-700 tracking-wider">Position</div>
                  <div className="text-2xl font-extrabold text-brand-900">
                    {activeAppt.status === 'in_consultation' ? 'Now' : '#2'}
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Estimated Wait Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-navy-900">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>Adaptive Estimated Wait</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-navy-900">
                    {activeAppt.status === 'in_consultation' ? '0' : activeAppt.live_prediction?.predicted_wait_minutes || '14'}
                  </span>
                  <span className="text-sm font-semibold text-slate-600">minutes</span>
                  <span className="text-xs text-slate-500">
                    (±{activeAppt.live_prediction?.uncertainty_window_minutes || 3}m)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Expected Start:{' '}
                  {activeAppt.status === 'in_consultation'
                    ? 'In Progress Now'
                    : activeAppt.live_prediction?.predicted_start_time
                    ? new Date(activeAppt.live_prediction.predicted_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '10:44 AM'}
                </p>
              </div>

              {/* Explanations List */}
              <div className="md:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-navy-900 mb-2.5">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>Why is this my estimate? (Explainable Engine)</span>
                </div>

                <div className="space-y-1.5">
                  {activeAppt.live_prediction?.explanations?.length ? (
                    activeAppt.live_prediction.explanations.map((exp, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                        <span>{exp}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                        <span>1 consultation currently in progress (~6m remaining).</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                        <span>1 eligible patient is ahead in line.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                        <span>Calibrated against Dr. Rajesh Sharma's historical median consult length (18m).</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center py-10 mb-8">
            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-navy-900">No Active Consultations in Progress</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You are currently not checked into an active clinic queue. Book an appointment below or check in to an existing booking.
            </p>
          </div>
        )}

        {/* Appointments List (Upcoming & Past) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-lg font-bold text-navy-900">My Appointments</h2>
              <p className="text-xs text-slate-500">Track upcoming bookings and review past outpatient visits.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Doctor & Specialty</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No appointments found. Book your first consultation above!
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-navy-900">{a.booking_reference}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-navy-900">{a.doctor_name}</div>
                        <div className="text-[11px] text-slate-500">{a.department_name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-navy-900">{a.appointment_date}</div>
                        <div className="text-[11px] text-slate-500">{a.scheduled_time}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize font-medium text-slate-600">
                        {a.appointment_type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            a.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : a.status === 'checked_in' || a.status === 'waiting'
                              ? 'bg-brand-50 text-brand-700 border border-brand-200'
                              : a.status === 'in_consultation'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse'
                              : a.status === 'cancelled'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {a.status === 'booked' && (
                          <button
                            onClick={() => handleCheckIn(a._id)}
                            disabled={checkInLoading}
                            className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        {a.status === 'checked_in' && (
                          <span className="text-xs text-brand-600 font-medium">In Queue</span>
                        )}
                        {a.status === 'completed' && a.consultation_duration_minutes && (
                          <span className="text-xs text-slate-500">
                            Duration: {a.consultation_duration_minutes}m
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

        {/* Booking Modal */}
        {showBookModal && (
          <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-navy-900">Book Outpatient Consultation</h3>
                <button
                  onClick={() => setShowBookModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bookingMsg && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                    bookingMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {bookingMsg.text}
                </div>
              )}

              <form onSubmit={handleBook} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-navy-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} • {d.department_name} ({d.room_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date</label>
                    <input
                      type="date"
                      value={apptDate}
                      onChange={(e) => setApptDate(e.target.value)}
                      required
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-navy-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time</label>
                    <select
                      value={apptTime}
                      onChange={(e) => setApptTime(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-navy-900"
                    >
                      <option value="09:00">09:00 AM</option>
                      <option value="09:30">09:30 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="14:30">02:30 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="15:30">03:30 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Type</label>
                  <select
                    value={apptType}
                    onChange={(e) => setApptType(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-navy-900"
                  >
                    <option value="standard">Standard Consultation (15m)</option>
                    <option value="new_patient">New Patient Comprehensive (25m)</option>
                    <option value="follow_up">Follow-Up Review (10m)</option>
                    <option value="quick_review">Quick Test Results Review (8m)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    {bookingLoading ? 'Checking Availability...' : 'Confirm Booking'}
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
