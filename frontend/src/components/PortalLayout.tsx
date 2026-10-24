import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api';
import { NotificationItem } from '../types';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Clock,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const PortalLayout: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/book')) return 'Book New Appointment';
    if (path.includes('/appointments')) return 'My Scheduled Appointments';
    if (path.includes('/tracker')) return 'Outpatient Visit Tracker & Queue';
    if (path.includes('/history')) return 'Consultation History & Records';
    if (path.includes('/notifications')) return 'Clinical Alerts & Notifications';
    if (path.includes('/profile')) return 'Personal Healthcare Profile';
    if (path.includes('/schedule')) return "Today's Clinical Schedule";
    if (path.includes('/queue')) return 'Live Queue Orchestration';
    if (path.includes('/consultations')) return 'Active Consultations & Room';
    if (path.includes('/patients')) return 'Patient Records & Search';
    if (path.includes('/availability')) return 'Physician Availability & Breaks';
    if (path.includes('/analytics')) return 'Predictive & Operational Analytics';
    if (path.includes('/simulator')) return 'Digital Twin Operational Simulator';
    if (path.includes('/checkin')) return 'Arrival Check-in & Walk-ins';
    if (path.includes('/doctors')) return 'Physician Roster & Availability';
    if (path.includes('/settings')) return 'System & Account Settings';
    if (path.includes('/queue-board')) return 'Public Waiting Room Display';

    if (role === 'doctor') return 'Doctor Clinical Dashboard';
    if (role === 'receptionist') return 'Receptionist Operations Desk';
    return 'Patient Outpatient Dashboard';
  };

  return (
    <div className="min-h-screen flex bg-[#0B1020] light:bg-[#F8FAFC] text-[#F1F5F9] light:text-[#0F172A] font-sans transition-colors duration-150">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-xs h-full bg-[#0F172A] shadow-2xl">
            <Sidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area to the Right */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Compact Top Header */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#29344D] light:border-[#E2E8F0] bg-[#0F172A] light:bg-white flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#94A3B8] light:text-[#475569] hover:bg-[#151D31] light:hover:bg-[#F1F5F9]"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-[#F1F5F9] light:text-[#0F172A] leading-tight">
                {getPageTitle()}
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5">
                <span>ClinicQueue</span>
                <ChevronRight className="w-3 h-3 text-[#64748B]" />
                <span className="capitalize">{role || 'Portal'}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions, Public Queue Link, Notifs, Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Public Queue Board Link */}
            <Link
              to="/queue-board"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#29344D] light:border-[#E2E8F0] bg-[#151D31] light:bg-[#F1F5F9] hover:border-[#60A5FA] text-[11px] font-medium text-[#94A3B8] light:text-[#475569] hover:text-[#F1F5F9] light:hover:text-[#0F172A] transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Public Board</span>
            </Link>

            {/* Live Engine Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#151D31] light:bg-[#F1F5F9] border border-[#29344D] light:border-[#E2E8F0] text-[10px] text-[#94A3B8] light:text-[#64748B]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Synced</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-lg text-[#94A3B8] light:text-[#475569] hover:bg-[#151D31] light:hover:bg-[#F1F5F9] relative transition-colors"
                title="Clinical Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#60A5FA] ring-2 ring-[#0F172A] light:ring-white" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-[#151D31] light:bg-white rounded-xl shadow-xl border border-[#29344D] light:border-[#E2E8F0] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#1E293B] light:border-[#E2E8F0] flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#F1F5F9] light:text-[#0F172A]">
                      Clinical Updates
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#60A5FA] light:text-[#2563EB] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-[#64748B]">
                        No active clinical alerts.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n._id}
                          className={`px-4 py-2.5 text-xs ${
                            n.is_read ? 'opacity-70' : 'bg-[#1B263D]/40 light:bg-[#EFF6FF]'
                          }`}
                        >
                          <p className="font-semibold text-[#F1F5F9] light:text-[#0F172A]">{n.title}</p>
                          <p className="text-[#94A3B8] light:text-[#475569] mt-0.5 text-[11px] leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg border border-[#29344D] light:border-[#E2E8F0] bg-[#151D31] light:bg-[#F1F5F9] text-[#94A3B8] light:text-[#475569] hover:text-[#F1F5F9] light:hover:text-[#0F172A] transition-colors"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FBBF24]" /> : <Moon className="w-4 h-4 text-[#2563EB]" />}
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#29344D] light:border-[#E2E8F0]">
              <div className="w-7 h-7 rounded-lg bg-[#60A5FA] text-[#0B1020] flex items-center justify-center text-xs font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <span className="text-xs font-semibold text-[#F1F5F9] light:text-[#0F172A] block leading-none">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] text-[#94A3B8] light:text-[#64748B] block capitalize mt-0.5 leading-none">
                  {user?.role || 'Patient'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

        {/* Compact Professional Footer */}
        <footer className="border-t border-[#29344D] light:border-[#E2E8F0] bg-[#0F172A] light:bg-white py-3.5 px-6 text-xs text-[#64748B] light:text-[#64748B] shrink-0 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-[#F1F5F9] light:text-[#0F172A]">ClinicQueue</span>
              <span>• Intelligent Outpatient Operations & Queue Analytics</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Adaptive Prediction Engine</span>
              <span>•</span>
              <span>Clinic-Day Digital Twin</span>
              <span>•</span>
              <span>Synchronized Multi-Role Queue</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PortalLayout;