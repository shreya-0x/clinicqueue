import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api';
import { NotificationItem, Role } from '../types';
import {
  Activity,
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Hospital,
  Clock,
  UserCheck,
  Stethoscope,
  Building2,
  Sun,
  Moon,
  FileText,
  CreditCard,
  User,
  Sliders,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const PortalNavbar: React.FC = () => {
  const { user, role, logout, switchRole } = useAuth();
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
      // Non-blocking
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

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleSwitchToPortal = async (targetRole: Role, path: string) => {
    setShowProfileMenu(false);
    await switchRole(targetRole);
    navigate(path, { replace: true });
  };

  // Define role-specific navigation links
  const getNavLinks = () => {
    if (role === 'patient') {
      return [
        { label: 'My Appointments & Queue', path: '/patient', icon: UserCheck },
        { label: 'Prescriptions', path: '/prescriptions', icon: FileText },
        { label: 'Health Card & Profile', path: '/profile', icon: CreditCard },
        { label: 'Public Queue Board', path: '/queue-board', icon: Clock }
      ];
    }
    if (role === 'doctor') {
      return [
        { label: 'Clinical Queue & Consultations', path: '/doctor', icon: Stethoscope },
        { label: 'Public Queue Board', path: '/queue-board', icon: Clock }
      ];
    }
    if (role === 'receptionist') {
      return [
        { label: 'Queue Desk & Operations', path: '/reception', icon: Building2 },
        { label: 'Public Queue Board', path: '/queue-board', icon: Clock },
        { label: 'Clinic Directory', path: '/hospitals', icon: Hospital }
      ];
    }
    return [
      { label: 'Dashboard', path: '/patient', icon: UserCheck },
      { label: 'Public Queue Board', path: '/queue-board', icon: Clock }
    ];
  };

  const getPortalInfo = () => {
    switch (role) {
      case 'doctor':
        return {
          title: 'Doctor Portal',
          homePath: '/doctor',
          badgeColor: 'bg-[#7C3AED]/15 text-[#C4B5FD] light:bg-[#F3E8FF] light:text-[#7E22CE]'
        };
      case 'receptionist':
        return {
          title: 'Receptionist Portal',
          homePath: '/reception',
          badgeColor: 'bg-[#6D28D9]/15 text-[#DDD6FE] light:bg-[#EDE9FE] light:text-[#5B21B6]'
        };
      default:
        return {
          title: 'Patient Portal',
          homePath: '/patient',
          badgeColor: 'bg-[#8B5CF6]/15 text-[#A78BFA] light:bg-[#EDE9FE] light:text-[#6D28D9]'
        };
    }
  };

  const portalInfo = getPortalInfo();
  const navLinks = getNavLinks();

  return (
    <nav className="bg-[#15151F] light:bg-white border-b border-[#343347] light:border-[#DDD9E9] sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Portal Badge */}
          <div className="flex items-center gap-6">
            <Link to={portalInfo.homePath} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shadow-[#8B5CF6]/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-[#F4F2FA] light:text-[#242033]">
                  ClinicQueue
                </span>
                <span className="text-[10px] text-[#817C95] light:text-[#777188] hidden sm:block -mt-0.5">
                  Predictable Operations
                </span>
              </div>
            </Link>

            {/* Current Active Portal Pill */}
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${portalInfo.badgeColor} border border-[#343347] light:border-[#DDD9E9] flex items-center gap-1.5`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{portalInfo.title}</span>
            </div>

            {/* Portal-Specific Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] font-semibold'
                        : 'text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#1B1B28] light:hover:bg-[#F0EFF7]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Actions: Notifications, Theme, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Live Synchronized Engine Status Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[#1B1B28] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] text-[#AAA6BC] light:text-[#625D74]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Live Engine</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#1B1B28] light:hover:bg-[#F0EFF7] border border-transparent hover:border-[#343347] light:hover:border-[#DDD9E9] transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FBBF24]" /> : <Moon className="w-4 h-4 text-[#6D28D9]" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-xl text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:bg-[#1B1B28] light:hover:bg-[#F0EFF7] relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#8B5CF6] ring-2 ring-[#15151F] light:ring-white" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1B1B28] light:bg-white rounded-2xl shadow-xl border border-[#343347] light:border-[#DDD9E9] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#29293A] light:border-[#EAE7F1] flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#F4F2FA] light:text-[#242033]">
                      Clinical Updates
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#8B5CF6] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#29293A] light:divide-[#EAE7F1]">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-[#817C95] light:text-[#777188]">
                        No updates at this time.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n._id}
                          className={`px-4 py-3 text-xs ${
                            n.is_read ? 'opacity-70' : 'bg-[#29213D]/20 light:bg-[#EDE9FE]/30'
                          }`}
                        >
                          <p className="font-semibold text-[#F4F2FA] light:text-[#242033]">{n.title}</p>
                          <p className="text-[#AAA6BC] light:text-[#625D74] mt-0.5 text-[11px] leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#343347] light:border-[#DDD9E9] bg-[#1B1B28] light:bg-[#F0EFF7] hover:border-[#8B5CF6] transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-[#F4F2FA] light:text-[#242033] leading-none">
                    {user?.name?.split(' ')[0] || 'User'}
                  </div>
                  <div className="text-[10px] text-[#817C95] light:text-[#777188] capitalize leading-none mt-1">
                    {user?.role || 'Guest'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#817C95]" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1B1B28] light:bg-white rounded-2xl shadow-xl border border-[#343347] light:border-[#DDD9E9] py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-[#29293A] light:border-[#EAE7F1]">
                    <div className="font-semibold text-xs text-[#F4F2FA] light:text-[#242033]">
                      {user?.name || 'Authenticated User'}
                    </div>
                    <div className="text-[11px] text-[#817C95] light:text-[#777188] truncate mt-0.5">
                      {user?.email || 'user@clinicqueue.demo'}
                    </div>
                    <div className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9]">
                      Role: {user?.role || 'Patient'}
                    </div>
                  </div>

                  {/* Switch to other portals for easy demo exploration */}
                  <div className="px-3 py-2 border-b border-[#29293A] light:border-[#EAE7F1]">
                    <div className="text-[10px] uppercase font-bold text-[#817C95] light:text-[#777188] px-2 mb-1">
                      Switch Role Portal
                    </div>
                    <button
                      onClick={() => handleSwitchToPortal('patient', '/patient')}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        role === 'patient'
                          ? 'bg-[#8B5CF6]/20 text-[#A78BFA] font-semibold'
                          : 'text-[#AAA6BC] light:text-[#625D74] hover:bg-[#222233] light:hover:bg-[#F0EFF7]'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Patient Portal (Rohan)</span>
                    </button>
                    <button
                      onClick={() => handleSwitchToPortal('doctor', '/doctor')}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        role === 'doctor'
                          ? 'bg-[#7C3AED]/20 text-[#C4B5FD] font-semibold'
                          : 'text-[#AAA6BC] light:text-[#625D74] hover:bg-[#222233] light:hover:bg-[#F0EFF7]'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Doctor Portal (Dr. Sharma)</span>
                    </button>
                    <button
                      onClick={() => handleSwitchToPortal('receptionist', '/reception')}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        role === 'receptionist'
                          ? 'bg-[#6D28D9]/20 text-[#DDD6FE] font-semibold'
                          : 'text-[#AAA6BC] light:text-[#625D74] hover:bg-[#222233] light:hover:bg-[#F0EFF7]'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Receptionist Portal (Ananya)</span>
                    </button>
                  </div>

                  {/* Sign Out / Exit Portal */}
                  <div className="p-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 light:text-rose-600 light:hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Exit Portal & Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-[#29293A] light:border-[#EAE7F1]">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] font-semibold'
                    : 'text-[#AAA6BC] light:text-[#625D74]'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default PortalNavbar;