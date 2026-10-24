import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { NotificationItem } from '../types';
import {
  Activity,
  Bell,
  Check,
  ChevronDown,
  Layers,
  LogOut,
  Hospital,
  Clock,
  Sparkles,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  Compass
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // Ignored if offline
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // 10s auto-refresh
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

  const getRoleDashboardLink = () => {
    switch (role) {
      case 'receptionist':
        return '/reception';
      case 'doctor':
        return '/doctor';
      case 'hospital_admin':
        return '/admin';
      case 'platform_admin':
        return '/platform';
      default:
        return '/patient';
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-9 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-navy-900 flex items-center gap-1.5">
                  Clinic<span className="text-brand-600">Queue</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    2026
                  </span>
                </span>
                <p className="text-[10px] text-slate-500 font-medium">Predictable Outpatient Queue Manager</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to={getRoleDashboardLink()}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === getRoleDashboardLink()
                    ? 'text-brand-700 bg-brand-50/80 font-semibold'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
              >
                My Dashboard
              </Link>
              <Link
                to="/queue-board"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/queue-board'
                    ? 'text-brand-700 bg-brand-50/80 font-semibold'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
              >
                Live Queue
              </Link>
              <Link
                to="/hospitals"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/hospitals'
                    ? 'text-brand-700 bg-brand-50/80 font-semibold'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
              >
                Hospital Directory
              </Link>
              <Link
                to="/demo-centre"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/demo-centre'
                    ? 'text-brand-700 bg-brand-50/80 font-semibold'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Demo Centre</span>
              </Link>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Live Polling Status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Adaptive Engine Live</span>
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-navy-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 font-semibold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 my-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div key={n._id} className={`py-2.5 px-2 rounded-lg ${n.is_read ? '' : 'bg-slate-50/80'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-navy-900">{n.title}</h4>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name ? user.name.slice(0, 2) : 'CQ'}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-semibold text-navy-900 leading-tight">
                    {user?.name || 'Guest User'}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">
                    {role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-semibold text-navy-900">{user?.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                    {user?.organization_name && (
                      <div className="text-[10px] text-brand-700 font-medium mt-1 truncate">
                        {user.organization_name}
                      </div>
                    )}
                  </div>

                  <Link
                    to={getRoleDashboardLink()}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>Role Dashboard</span>
                  </Link>

                  <Link
                    to="/prescriptions"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Activity className="w-4 h-4 text-[#0b6e6e]" />
                    <span>Digital Prescriptions</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#0b6e6e]" />
                    <span>Health Profile & Insurance</span>
                  </Link>

                  <Link
                    to="/demo-centre"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>Demo Centre</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      navigate('/');
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
