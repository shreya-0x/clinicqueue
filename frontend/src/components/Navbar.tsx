import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  UserCheck,
  Stethoscope,
  Building2,
  ShieldCheck,
  Sun,
  Moon,
  FileText,
  CreditCard
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const getRoleDashboardLink = () => {
    switch (role) {
      case 'receptionist':
        return '/reception';
      case 'doctor':
        return '/doctor';
      default:
        return '/patient';
    }
  };

  return (
    <nav className="bg-[#15151F] light:bg-white border-b border-[#343347] light:border-[#DDD9E9] sticky top-9 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#F4F2FA] light:text-[#242033] flex items-center gap-1.5">
                  Clinic<span className="text-[#8B5CF6] light:text-[#6D28D9]">Queue</span>
                </span>
                <p className="text-[10px] text-[#AAA6BC] light:text-[#625D74] font-medium">Predictable Outpatient Queue Manager</p>
              </div>
            </Link>

            {/* Portals Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/patient"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/patient'
                    ? 'text-white bg-[#8B5CF6] light:bg-[#6D28D9]'
                    : 'text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Patient Portal</span>
              </Link>

              <Link
                to="/reception"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/reception'
                    ? 'text-white bg-[#8B5CF6] light:bg-[#6D28D9]'
                    : 'text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Receptionist Portal</span>
              </Link>

              <Link
                to="/doctor"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/doctor'
                    ? 'text-white bg-[#8B5CF6] light:bg-[#6D28D9]'
                    : 'text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7]'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor Portal</span>
              </Link>

              <Link
                to="/queue-board"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/queue-board'
                    ? 'text-white bg-[#8B5CF6] light:bg-[#6D28D9]'
                    : 'text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Live Board</span>
              </Link>

              <Link
                to="/hospitals"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/hospitals'
                    ? 'text-white bg-[#8B5CF6] light:bg-[#6D28D9]'
                    : 'text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7]'
                }`}
              >
                <Hospital className="w-3.5 h-3.5" />
                <span>Clinics</span>
              </Link>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Live Engine Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#AAA6BC] light:text-[#625D74] bg-[#1B1B28] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium">Predictive Engine Active</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-[#A78BFA]" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-xl text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1B1B28] light:bg-white rounded-2xl shadow-2xl border border-[#343347] light:border-[#DDD9E9] p-4 z-50 animate-fade-in text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#343347] light:border-[#DDD9E9]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F4F2FA] light:text-[#242033]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#A78BFA] light:text-[#6D28D9] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Check className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#343347] light:divide-[#DDD9E9] my-2">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-center py-6">No operational notifications.</p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div key={n._id} className={`py-2.5 px-2 rounded-lg transition-colors ${n.is_read ? '' : 'bg-[#222233]/60 light:bg-[#F0EFF7]/60'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-[#F4F2FA] light:text-[#242033]">{n.title}</h4>
                            <span className="text-[10px] text-[#817C95] light:text-[#777188]">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[#AAA6BC] light:text-[#625D74] mt-0.5 leading-relaxed text-[11px]">{n.message}</p>
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
                className="flex items-center gap-2.5 p-1.5 rounded-xl border border-[#343347] light:border-[#DDD9E9] hover:bg-[#222233] light:hover:bg-[#F0EFF7] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name ? user.name.slice(0, 2) : 'CQ'}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-semibold text-[#F4F2FA] light:text-[#242033] leading-tight">
                    {user?.name || 'Clinic User'}
                  </div>
                  <div className="text-[10px] text-[#AAA6BC] light:text-[#625D74] uppercase tracking-wide font-medium">
                    {role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#AAA6BC] light:text-[#625D74]" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1B1B28] light:bg-white rounded-2xl shadow-2xl border border-[#343347] light:border-[#DDD9E9] p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-[#343347] light:border-[#DDD9E9] mb-1">
                    <div className="font-semibold text-[#F4F2FA] light:text-[#242033]">{user?.name}</div>
                    <div className="text-[11px] text-[#AAA6BC] light:text-[#625D74] truncate">{user?.email}</div>
                    {user?.organization_name && (
                      <div className="text-[10px] text-[#A78BFA] light:text-[#6D28D9] font-medium mt-1 truncate">
                        {user.organization_name}
                      </div>
                    )}
                  </div>

                  <Link
                    to={getRoleDashboardLink()}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 font-medium text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7] rounded-lg transition-colors"
                  >
                    <Layers className="w-4 h-4 text-[#8B5CF6]" />
                    <span>My Portal Dashboard</span>
                  </Link>

                  <Link
                    to="/prescriptions"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 font-medium text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7] rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#8B5CF6]" />
                    <span>Digital Prescriptions</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 font-medium text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#222233] light:hover:bg-[#F0EFF7] rounded-lg transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-[#8B5CF6]" />
                    <span>Insurance & Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      navigate('/');
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 font-medium text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
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
