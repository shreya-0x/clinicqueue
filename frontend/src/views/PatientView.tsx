import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
  Filter,
  Bell,
  Settings,
  CalendarPlus,
  ArrowRight
} from 'lucide-react';

export const PatientView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'today' | 'past' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking state
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [apptDate, setApptDate] = useState('2026-10-25');
  const [apptTime, setApptTime] = useState('11:00');
  const [apptType, setApptType] = useState('standard');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check-in state
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
      setBookingMsg({ type: 'error', text: 'Please select a physician.' });
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
      }, 1200);
    } catch (err: any) {
      setBookingMsg({ type: 'error', text: err.message || 'Booking failed.' });
    } finally {
      setBookingLoading(false);
    }
  };

  // Derived counts
  const upcomingCount = appointments.filter((a) => a.status === 'booked').length;
  const awaitingCheckInCount = appointments.filter((a) => a.status === 'booked' && a.appointment_date === '2026-10-25').length;
  const inProgressCount = appointments.filter((a) => a.status === 'in_consultation' || a.status === 'checked_in' || a.status === 'waiting').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'upcoming' && a.status !== 'booked') return false;
    if (filterStatus === 'today' && a.appointment_date !== '2026-10-25') return false;
    if (filterStatus === 'past' && a.status !== 'completed') return false;
    if (filterStatus === 'cancelled' && a.status !== 'cancelled') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.doctor_name.toLowerCase().includes(q) ||
        a.department_name.toLowerCase().includes(q) ||
        a.booking_reference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedAppt = appointments.find((a) => a._id === selectedApptId) || appointments[0];
  const nextAppt = appointments.find((a) => a.status === 'booked' || a.status === 'checked_in' || a.status === 'waiting' || a.status === 'in_consultation');

  const departments = ['All', ...Array.from(new Set(doctors.map((d) => d.department_name)))];
  const filteredDoctors = doctors.filter((doc) => {
    if (selectedDeptFilter !== 'All' && doc.department_name !== selectedDeptFilter) return false;
    return true;
  });

  // Determine active view mode based on pathname
  const path = location.pathname;
  const isBookView = path === '/patient/book';
  const isAppointmentsView = path === '/patient/appointments';
  const isTrackerView = path === '/patient/tracker';
  const isHistoryView = path === '/patient/history';
  const isNotificationsView = path === '/patient/notifications';
  const isProfileView = path === '/patient/profile' || path === '/profile';
  const isSettingsView = path === '/patient/settings';

  if (isProfileView) {
    return <ProfileView />;
  }

  if (isHistoryView) {
    return <PrescriptionsView />;
  }

  return (
    <div className="space-y-6">
      {/* 1. BOOK APPOINTMENT VIEW */}
      {isBookView && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F9] light:text-[#0F172A]">
                  Outpatient Doctor Directory & Booking
                </h2>
                <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                  Select a clinical specialty or physician to schedule an upcoming consultation.
                </p>
              </div>

              {/* Department Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedDeptFilter === dept
                        ? 'bg-[#60A5FA] text-[#0B1020]'
                        : 'bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#29344D] light:border-[#E2E8F0]'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 rounded-xl bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] flex flex-col justify-between hover:border-[#60A5FA] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] flex items-center justify-center text-[#60A5FA] light:text-[#2563EB] font-bold">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                        {doc.is_available ? 'Available' : 'On Leave'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">{doc.name}</h3>
                    <p className="text-xs text-[#60A5FA] light:text-[#2563EB] font-medium">{doc.department_name}</p>
                    <p className="text-[11px] text-[#94A3B8] light:text-[#475569] mt-1">{doc.qualifications}</p>
                    <div className="mt-3 pt-2.5 border-t border-[#1E293B] light:border-[#E2E8F0] flex items-center justify-between text-xs text-[#94A3B8] light:text-[#475569]">
                      <span>Consultation Fee</span>
                      <strong className="text-[#F1F5F9] light:text-[#0F172A]">₹{doc.consultation_fee || 800}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDocId(doc._id);
                      setShowBookModal(true);
                    }}
                    className="mt-4 w-full py-2 px-3 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] text-[#0B1020] light:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Book Appointment</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. VISIT TRACKER VIEW */}
      {isTrackerView && (
        <div className="space-y-6 animate-fade-in">
          {selectedAppt ? (
            <PatientTracker
              appointment={selectedAppt}
              onCheckIn={handleCheckIn}
              checkInLoading={checkInLoading}
            />
          ) : (
            <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-12 text-center">
              <Clock className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">No Active Visit In Progress</h3>
              <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-1 max-w-sm mx-auto">
                You do not currently have an active outpatient queue entry. Book a consultation or view your scheduled visits.
              </p>
              <button
                onClick={() => navigate('/patient/book')}
                className="mt-4 px-4 py-2 rounded-lg bg-[#60A5FA] text-[#0B1020] font-semibold text-xs"
              >
                Schedule Appointment
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. NOTIFICATIONS VIEW */}
      {isNotificationsView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] light:border-[#E2E8F0]">
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">Clinical Alerts & Notifications</h2>
              <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                Real-time queue announcements, check-in updates, and prescription issuances.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] text-[#60A5FA] font-semibold">
              Live Feed
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#F1F5F9] light:text-[#0F172A]">Appointment Confirmed</p>
                <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                  Your appointment with Dr. Rajesh Sharma has been registered for October 25, 2026.
                </p>
                <span className="text-[10px] text-[#64748B] mt-1 block">Today at 09:15 AM</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#F1F5F9] light:text-[#0F172A]">Queue Position Update</p>
                <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                  Your estimated consultation time is dynamically updated to ~14 minutes based on active physician pacing.
                </p>
                <span className="text-[10px] text-[#64748B] mt-1 block">Today at 10:30 AM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SETTINGS VIEW */}
      {isSettingsView && (
        <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A]">Patient Account & Queue Preferences</h2>
            <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
              Manage clinical communication preferences and accessibility settings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-2">
              <span className="text-xs font-bold text-[#F1F5F9] light:text-[#0F172A] block">SMS & Notification Reminders</span>
              <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                Receive instant SMS notifications when you are 3 patients away in the queue.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-[#29344D] text-[#60A5FA] focus:ring-0" />
                <span className="text-xs text-[#F1F5F9] light:text-[#0F172A]">Enable Priority SMS Reminders</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-2">
              <span className="text-xs font-bold text-[#F1F5F9] light:text-[#0F172A]">Queue Estimation Preference</span>
              <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                Display granular breakdown factors (doctor pacing, remaining break duration).
              </p>
              <div className="pt-2 flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-[#29344D] text-[#60A5FA] focus:ring-0" />
                <span className="text-xs text-[#F1F5F9] light:text-[#0F172A]">Show Explainable AI Metrics</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MY APPOINTMENTS VIEW OR PRIMARY DASHBOARD */}
      {(!isBookView && !isTrackerView && !isNotificationsView && !isSettingsView) && (
        <div className="space-y-6">
          {/* Welcome & Next Upcoming Banner */}
          {nextAppt && (
            <div className="p-5 rounded-xl bg-[#151D31] light:bg-white border border-[#29344D] light:border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#0F172A] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] flex items-center justify-center text-[#60A5FA] light:text-[#2563EB] shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1B263D] light:bg-[#EFF6FF] text-[#60A5FA] light:text-[#2563EB]">
                      Next Visit
                    </span>
                    <span className="text-xs text-[#94A3B8] light:text-[#475569]">
                      {nextAppt.appointment_date} at {nextAppt.scheduled_time}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#F1F5F9] light:text-[#0F172A] mt-0.5">
                    {nextAppt.doctor_name} • {nextAppt.department_name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setSelectedApptId(nextAppt._id);
                    navigate('/patient/tracker');
                  }}
                  className="flex-1 sm:flex-initial py-2 px-3.5 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] text-[#0B1020] light:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Live Visit Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#94A3B8] light:text-[#64748B] uppercase tracking-wider">
                Upcoming
              </span>
              <div className="text-2xl font-bold text-[#F1F5F9] light:text-[#0F172A] mt-1">{upcomingCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Scheduled appointments</p>
            </div>

            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-amber-400 light:text-amber-600 uppercase tracking-wider">
                Check-in Ready
              </span>
              <div className="text-2xl font-bold text-amber-400 light:text-amber-600 mt-1">{awaitingCheckInCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Visits scheduled today</p>
            </div>

            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#60A5FA] light:text-[#2563EB] uppercase tracking-wider">
                In Queue / Active
              </span>
              <div className="text-2xl font-bold text-[#60A5FA] light:text-[#2563EB] mt-1">{inProgressCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Live outpatient visits</p>
            </div>

            <div className="bg-[#151D31] light:bg-white rounded-xl p-4 border border-[#29344D] light:border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-emerald-400 light:text-emerald-600 uppercase tracking-wider">
                Concluded
              </span>
              <div className="text-2xl font-bold text-emerald-400 light:text-emerald-600 mt-1">{completedCount}</div>
              <p className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">Completed consultations</p>
            </div>
          </div>

          {/* Active Visit Tracker Section */}
          {selectedAppt && (
            <PatientTracker
              appointment={selectedAppt}
              onCheckIn={handleCheckIn}
              checkInLoading={checkInLoading}
            />
          )}

          {/* Scheduled Appointments Table */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">All Scheduled Appointments</h3>
                <p className="text-xs text-[#94A3B8] light:text-[#475569]">Select a visit to view live status or check in.</p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search doctor or ref..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
                  />
                </div>

                <button
                  onClick={() => navigate('/patient/book')}
                  className="px-3 py-1.5 rounded-lg bg-[#60A5FA] text-[#0B1020] font-semibold text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                    <th className="py-2.5 px-3 font-semibold">Reference</th>
                    <th className="py-2.5 px-3 font-semibold">Physician & Specialty</th>
                    <th className="py-2.5 px-3 font-semibold">Scheduled Date & Time</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#64748B]">
                        No appointments found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appt) => {
                      const isSelected = appt._id === selectedApptId;
                      return (
                        <tr
                          key={appt._id}
                          className={`hover:bg-[#1B263D]/40 light:hover:bg-[#F8FAFC] transition-colors ${
                            isSelected ? 'bg-[#1B263D]/60 light:bg-[#EFF6FF]' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-semibold text-[#60A5FA] light:text-[#2563EB]">
                            {appt.booking_reference}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-[#F1F5F9] light:text-[#0F172A] block">{appt.doctor_name}</span>
                            <span className="text-[11px] text-[#94A3B8] light:text-[#64748B]">{appt.department_name}</span>
                          </td>
                          <td className="py-3 px-3 text-[#94A3B8] light:text-[#475569]">
                            {appt.appointment_date} at {appt.scheduled_time}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                                appt.status === 'completed'
                                  ? 'bg-emerald-950/60 text-emerald-300'
                                  : appt.status === 'in_consultation'
                                  ? 'bg-[#1B263D] text-[#60A5FA]'
                                  : appt.status === 'checked_in' || appt.status === 'waiting'
                                  ? 'bg-amber-950/60 text-amber-300'
                                  : 'bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8]'
                              }`}
                            >
                              {appt.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setSelectedApptId(appt._id)}
                              className="text-xs font-semibold text-[#60A5FA] light:text-[#2563EB] hover:underline"
                            >
                              Inspect Tracker
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
        </div>
      )}

      {/* Booking Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] light:border-[#E2E8F0]">
              <h3 className="font-bold text-base text-[#F1F5F9] light:text-[#0F172A]">Book Outpatient Consultation</h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingMsg && (
              <div
                className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  bookingMsg.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-800'
                    : 'bg-red-950/40 text-red-200 border border-red-800'
                }`}
              >
                {bookingMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{bookingMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">
                  Select Physician
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                >
                  <option value="">-- Choose Physician --</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.department_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Date</label>
                  <input
                    type="date"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] light:text-[#475569] mb-1">Time Slot</label>
                  <select
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs text-[#F1F5F9] light:text-[#0F172A]"
                  >
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full mt-3 py-2.5 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] disabled:opacity-50 text-[#0B1020] light:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {bookingLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4" />
                    <span>Confirm Consultation Booking</span>
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

export default PatientView;