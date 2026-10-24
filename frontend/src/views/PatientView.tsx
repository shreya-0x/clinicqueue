import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Appointment, Doctor, Department } from '../types';
import { PrescriptionsView } from './PrescriptionsView';
import { ProfileView } from './ProfileView';
import { PatientTracker } from '../components/PatientTracker';
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
  ShieldCheck,
  FileText,
  Pill,
  CreditCard,
  UserCheck,
  Check,
  Filter
} from 'lucide-react';

export const PatientView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'visits' | 'prescriptions' | 'insurance'>('visits');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  // Filter & Search states
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'today' | 'past' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      const list = apptsRes.appointments || [];
      setAppointments(list);
      setDoctors(docsRes.doctors || []);

      // Auto-select checked_in, in_consultation, or first appointment
      const active = list.find(
        (a) => a.status === 'checked_in' || a.status === 'waiting' || a.status === 'in_consultation'
      );
      if (active) {
        setSelectedApptId(active._id);
      } else if (list.length > 0 && !selectedApptId) {
        setSelectedApptId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      // Polling for live queue state transitions
      try {
        const apptsRes = await api.getAppointments();
        if (apptsRes.appointments) {
          setAppointments(apptsRes.appointments);
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (apptId: string) => {
    setCheckInLoading(true);
    try {
      await api.checkIn({ appointment_id: apptId });
      await fetchData();
      setSelectedApptId(apptId);
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
      const res = await api.bookAppointment({
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
        if (res.appointment?._id) {
          setSelectedApptId(res.appointment._id);
        }
      }, 1400);
    } catch (err: any) {
      setBookingMsg({ type: 'error', text: err.message || 'Booking failed.' });
    } finally {
      setBookingLoading(false);
    }
  };

  // Appointment counts derived from authentic database records
  const upcomingCount = appointments.filter((a) => a.status === 'booked').length;
  const awaitingCheckInCount = appointments.filter((a) => a.status === 'booked' && a.appointment_date === '2026-10-25').length;
  const inProgressCount = appointments.filter((a) => a.status === 'in_consultation' || a.status === 'checked_in' || a.status === 'waiting').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  // Filtered appointments list
  const filteredAppointments = appointments.filter((a) => {
    // Status filter
    if (filterStatus === 'upcoming' && a.status !== 'booked') return false;
    if (filterStatus === 'today' && a.appointment_date !== '2026-10-25') return false;
    if (filterStatus === 'past' && a.status !== 'completed') return false;
    if (filterStatus === 'cancelled' && a.status !== 'cancelled') return false;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchDoc = a.doctor_name.toLowerCase().includes(query);
      const matchDept = a.department_name.toLowerCase().includes(query);
      const matchRef = a.booking_reference.toLowerCase().includes(query);
      return matchDoc || matchDept || matchRef;
    }
    return true;
  });

  const selectedAppointment = appointments.find((a) => a._id === selectedApptId) || (appointments.length > 0 ? appointments[0] : null);

  return (
    <div className="min-h-screen bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-6 border border-[#343347] light:border-[#DDD9E9] shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Patient Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome, {user?.name || 'Rohan Mehta'}
            </h1>
            <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-0.5">
              MRN: {user?.patient_profile?.mrn || 'CQ-MRN-00001'} • MetroCare Apex Hospital
            </p>
          </div>

          <button
            onClick={() => setShowBookModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] light:bg-[#6D28D9] light:hover:bg-[#5B21B6] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Consultation</span>
          </button>
        </div>

        {/* Portal Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'visits'
                ? 'bg-[#8B5CF6] light:bg-[#6D28D9] text-white shadow-xs'
                : 'bg-[#1B1B28] light:bg-white text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] border border-[#343347] light:border-[#DDD9E9]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>My Appointments & Visit Tracker</span>
            {inProgressCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'prescriptions'
                ? 'bg-[#8B5CF6] light:bg-[#6D28D9] text-white shadow-xs'
                : 'bg-[#1B1B28] light:bg-white text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] border border-[#343347] light:border-[#DDD9E9]'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Digital Prescriptions</span>
          </button>

          <button
            onClick={() => setActiveTab('insurance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'insurance'
                ? 'bg-[#8B5CF6] light:bg-[#6D28D9] text-white shadow-xs'
                : 'bg-[#1B1B28] light:bg-white text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] border border-[#343347] light:border-[#DDD9E9]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Insurance & Health Profile</span>
          </button>
        </div>

        {/* TAB 1: MY APPOINTMENTS & VISIT TRACKER */}
        {activeTab === 'visits' && (
          <div className="space-y-8 animate-fade-in">
            {/* A. Appointment Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9]">
                <div className="text-[11px] font-semibold text-[#817C95] light:text-[#777188] uppercase tracking-wider">
                  Upcoming
                </div>
                <div className="text-2xl font-extrabold text-[#F4F2FA] light:text-[#242033] mt-1">
                  {upcomingCount}
                </div>
                <p className="text-[10px] text-[#AAA6BC] light:text-[#625D74] mt-0.5">Scheduled visits</p>
              </div>

              <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9]">
                <div className="text-[11px] font-semibold text-amber-400 light:text-amber-600 uppercase tracking-wider">
                  Check-In Ready
                </div>
                <div className="text-2xl font-extrabold text-amber-400 light:text-amber-600 mt-1">
                  {awaitingCheckInCount}
                </div>
                <p className="text-[10px] text-[#AAA6BC] light:text-[#625D74] mt-0.5">Today's bookings</p>
              </div>

              <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9]">
                <div className="text-[11px] font-semibold text-[#A78BFA] light:text-[#6D28D9] uppercase tracking-wider">
                  In Progress
                </div>
                <div className="text-2xl font-extrabold text-[#A78BFA] light:text-[#6D28D9] mt-1">
                  {inProgressCount}
                </div>
                <p className="text-[10px] text-[#AAA6BC] light:text-[#625D74] mt-0.5">In queue / consultation</p>
              </div>

              <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9]">
                <div className="text-[11px] font-semibold text-emerald-400 light:text-emerald-600 uppercase tracking-wider">
                  Completed
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 light:text-emerald-600 mt-1">
                  {completedCount}
                </div>
                <p className="text-[10px] text-[#AAA6BC] light:text-[#625D74] mt-0.5">Concluded visits</p>
              </div>

              <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-4 border border-[#343347] light:border-[#DDD9E9]">
                <div className="text-[11px] font-semibold text-rose-400 light:text-rose-600 uppercase tracking-wider">
                  Cancelled
                </div>
                <div className="text-2xl font-extrabold text-rose-400 light:text-rose-600 mt-1">
                  {cancelledCount}
                </div>
                <p className="text-[10px] text-[#AAA6BC] light:text-[#625D74] mt-0.5">Prior cancellations</p>
              </div>
            </div>

            {/* B. Live Visit Tracker for Selected / Active Appointment */}
            {selectedAppointment ? (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#AAA6BC] light:text-[#625D74]">
                      Selected Visit Tracker Stepper
                    </h2>
                  </div>
                  <span className="text-xs text-[#817C95] light:text-[#777188]">
                    Click any visit in the table below to inspect its timeline
                  </span>
                </div>
                <PatientTracker
                  appointment={selectedAppointment}
                  onCheckIn={handleCheckIn}
                  checkInLoading={checkInLoading}
                />
              </div>
            ) : (
              <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-8 text-center text-[#AAA6BC] light:text-[#625D74]">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-[#817C95]" />
                <h3 className="text-base font-bold text-[#F4F2FA] light:text-[#242033]">No Appointments Found</h3>
                <p className="text-xs mt-1">Book your first outpatient consultation using the button above.</p>
              </div>
            )}

            {/* C. Appointments Filter and Complete History List */}
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#29293A] light:border-[#EAE7F1]">
                <div>
                  <h2 className="text-lg font-bold text-[#F4F2FA] light:text-[#242033]">Appointment History & Schedule</h2>
                  <p className="text-xs text-[#AAA6BC] light:text-[#625D74]">
                    Filter by status, search by physician or specialty, and select to inspect live progression.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 text-[#817C95] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search doctor, dept, ref..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] text-xs text-[#F4F2FA] light:text-[#242033] focus:outline-hidden focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 py-4 overflow-x-auto border-b border-[#29293A] light:border-[#EAE7F1] text-xs">
                <span className="text-[#817C95] light:text-[#777188] flex items-center gap-1 text-[11px] font-semibold mr-1">
                  <Filter className="w-3 h-3" />
                  Filter:
                </span>
                {(['all', 'upcoming', 'today', 'past', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                      filterStatus === st
                        ? 'bg-[#8B5CF6] light:bg-[#6D28D9] text-white font-semibold'
                        : 'bg-[#222233] light:bg-[#F0EFF7] text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033]'
                    }`}
                  >
                    {st === 'all' ? `All (${appointments.length})` : st}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#222233] light:bg-[#F0EFF7] text-[#817C95] light:text-[#777188] font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Doctor & Department</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#29293A] light:divide-[#EAE7F1]">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#817C95]">
                          No appointments match the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((a) => {
                        const isSelected = selectedApptId === a._id;
                        return (
                          <tr
                            key={a._id}
                            onClick={() => setSelectedApptId(a._id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#29213D]/60 light:bg-[#EDE9FE]/60'
                                : 'hover:bg-[#222233]/40 light:hover:bg-[#F0EFF7]/40'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-mono font-medium text-[#A78BFA] light:text-[#6D28D9]">
                              {a.booking_reference}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#F4F2FA] light:text-[#242033]">{a.doctor_name}</div>
                              <div className="text-[11px] text-[#AAA6BC] light:text-[#625D74]">{a.department_name}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-[#F4F2FA] light:text-[#242033]">{a.appointment_date}</div>
                              <div className="text-[11px] text-[#AAA6BC] light:text-[#625D74]">{a.scheduled_time}</div>
                            </td>
                            <td className="py-3.5 px-4 capitalize font-medium text-[#AAA6BC] light:text-[#625D74]">
                              {a.appointment_type.replace('_', ' ')}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                  a.status === 'completed'
                                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                                    : a.status === 'checked_in' || a.status === 'waiting'
                                    ? 'bg-[#29213D] text-[#A78BFA] border border-[#8B5CF6]'
                                    : a.status === 'in_consultation'
                                    ? 'bg-[#29213D] text-[#A78BFA] border border-[#8B5CF6] animate-pulse'
                                    : a.status === 'cancelled'
                                    ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                                    : 'bg-[#222233] light:bg-[#F0EFF7] text-[#AAA6BC] light:text-[#625D74]'
                                }`}
                              >
                                {a.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {a.status === 'booked' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckIn(a._id);
                                  }}
                                  disabled={checkInLoading}
                                  className="px-3 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] light:bg-[#6D28D9] light:hover:bg-[#5B21B6] text-white font-semibold text-xs transition-colors"
                                >
                                  Check In
                                </button>
                              )}
                              {a.status === 'completed' && a.consultation_duration_minutes && (
                                <span className="text-xs text-[#AAA6BC] light:text-[#625D74]">
                                  {a.consultation_duration_minutes}m duration
                                </span>
                              )}
                              {(a.status === 'checked_in' || a.status === 'waiting' || a.status === 'in_consultation') && (
                                <span className="text-xs text-[#A78BFA] light:text-[#6D28D9] font-medium">
                                  Track Live →
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIGITAL PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className="animate-fade-in">
            <PrescriptionsView />
          </div>
        )}

        {/* TAB 3: INSURANCE & HEALTH PROFILE */}
        {activeTab === 'insurance' && (
          <div className="animate-fade-in">
            <ProfileView />
          </div>
        )}

        {/* Booking Modal */}
        {showBookModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#343347] light:border-[#DDD9E9] text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1]">
                <h3 className="text-base font-bold text-[#F4F2FA] light:text-[#242033]">Book Outpatient Consultation</h3>
                <button
                  onClick={() => setShowBookModal(false)}
                  className="p-1 rounded-lg text-[#817C95] hover:text-[#F4F2FA] light:hover:text-[#242033]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bookingMsg && (
                <div
                  className={`mt-4 p-3 rounded-xl font-semibold ${
                    bookingMsg.type === 'success'
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950/70 text-rose-300 border border-rose-800'
                  }`}
                >
                  {bookingMsg.text}
                </div>
              )}

              <form onSubmit={handleBook} className="mt-4 space-y-4">
                <div>
                  <label className="block font-semibold text-[#AAA6BC] light:text-[#625D74] mb-1">Select Doctor</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033] focus:outline-hidden focus:ring-1 focus:ring-[#8B5CF6]"
                  >
                    <option value="">-- Select Outpatient Specialist --</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} • {d.department_name} ({d.room_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#AAA6BC] light:text-[#625D74] mb-1">Appointment Date</label>
                    <input
                      type="date"
                      value={apptDate}
                      onChange={(e) => setApptDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#AAA6BC] light:text-[#625D74] mb-1">Preferred Time</label>
                    <select
                      value={apptTime}
                      onChange={(e) => setApptTime(e.target.value)}
                      className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
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
                  <label className="block font-semibold text-[#AAA6BC] light:text-[#625D74] mb-1">Consultation Type</label>
                  <select
                    value={apptType}
                    onChange={(e) => setApptType(e.target.value)}
                    className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
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
                    className="px-4 py-2 rounded-xl text-[#AAA6BC] hover:bg-[#222233] light:hover:bg-[#F0EFF7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] light:bg-[#6D28D9] light:hover:bg-[#5B21B6] text-white font-semibold disabled:opacity-50"
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
