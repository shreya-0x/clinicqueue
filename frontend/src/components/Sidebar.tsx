import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  Activity,
  Calendar,
  CalendarPlus,
  Clock,
  History,
  Bell,
  User,
  Settings,
  LogOut,
  Stethoscope,
  Users,
  CheckCircle2,
  FileText,
  Sliders,
  LineChart,
  Building2,
  Search,
  UserPlus,
  ShieldCheck,
  X,
  CreditCard,
  Layers,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, role, logout, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Role-specific vertical navigation links as specified
  const getNavItems = () => {
    if (role === 'doctor') {
      return [
        { label: 'Dashboard', path: '/doctor', icon: Activity, exact: true },
        { label: "Today's Schedule", path: '/doctor/schedule', icon: Calendar },
        { label: 'Waiting Queue', path: '/doctor/queue', icon: Clock },
        { label: 'Consultations', path: '/doctor/consultations', icon: Stethoscope },
        { label: 'Patient History', path: '/doctor/patients', icon: History },
        { label: 'Availability', path: '/doctor/availability', icon: CheckCircle2 },
        { label: 'Analytics', path: '/doctor/analytics', icon: LineChart },
        { label: 'Settings', path: '/doctor/settings', icon: Settings },
      ];
    }
    if (role === 'receptionist') {
      return [
        { label: 'Dashboard', path: '/reception', icon: Activity, exact: true },
        { label: 'Appointments', path: '/reception/appointments', icon: Calendar },
        { label: 'Patient Search', path: '/reception/patients', icon: Search },
        { label: 'Check-in / Walk-ins', path: '/reception/checkin', icon: UserPlus },
        { label: 'Live Queue', path: '/reception/queue', icon: Clock },
        { label: 'Doctor Availability', path: '/reception/doctors', icon: Stethoscope },
        { label: 'Analytics', path: '/reception/analytics', icon: LineChart },
        { label: 'Digital Twin', path: '/reception/simulator', icon: Sliders },
        { label: 'Settings', path: '/reception/settings', icon: Settings },
      ];
    }
    // Default: Patient navigation
    return [
      { label: 'Dashboard', path: '/patient', icon: Activity, exact: true },
      { label: 'Book Appointment', path: '/patient/book', icon: CalendarPlus },
      { label: 'My Appointments', path: '/patient/appointments', icon: Calendar },
      { label: 'Visit Tracker / Queue', path: '/patient/tracker', icon: Clock },
      { label: 'Consultation History', path: '/patient/history', icon: FileText },
      { label: 'Notifications', path: '/patient/notifications', icon: Bell },
      { label: 'Profile', path: '/patient/profile', icon: User },
      { label: 'Settings', path: '/patient/settings', icon: Settings },
    ];
  };

  const navItems = getNavItems();

  const getPortalBadge = () => {
    switch (role) {
      case 'doctor':
        return { label: 'Doctor Portal', color: 'text-[#93C5FD] bg-[#151D31] border-[#29344D]' };
      case 'receptionist':
        return { label: 'Receptionist Portal', color: 'text-[#60A5FA] bg-[#151D31] border-[#29344D]' };
      default:
        return { label: 'Patient Portal', color: 'text-[#60A5FA] bg-[#151D31] border-[#29344D]' };
    }
  };

  const portalBadge = getPortalBadge();

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleSwitchPortal = async (targetRole: Role, targetPath: string) => {
    await switchRole(targetRole);
    navigate(targetPath, { replace: true });
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 bg-[#0F172A] light:bg-white border-r border-[#29344D] light:border-[#E2E8F0] min-h-screen flex flex-col justify-between shrink-0 select-none transition-colors duration-150">
      {/* Top Branding & Portal Indicator */}
      <div>
        <div className="h-16 px-5 border-b border-[#29344D] light:border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] flex items-center justify-center text-[#60A5FA] light:text-[#2563EB]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-[#F1F5F9] light:text-[#0F172A] block leading-none">
                ClinicQueue
              </span>
              <span className="text-[10px] text-[#94A3B8] light:text-[#64748B] block mt-1 leading-none">
                Intelligent Operations
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151D31]"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Portal Role Indicator */}
        <div className="px-4 pt-4 pb-2">
          <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${portalBadge.color}`}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{portalBadge.label}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] light:text-[#64748B]">Active</span>
          </div>
        </div>

        {/* Vertical Left Navigation Items */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1B263D] light:bg-[#EFF6FF] text-[#60A5FA] light:text-[#2563EB] font-semibold border-l-2 border-[#60A5FA] light:border-[#2563EB] shadow-xs'
                    : 'text-[#94A3B8] light:text-[#475569] hover:bg-[#151D31] light:hover:bg-[#F1F5F9] hover:text-[#F1F5F9] light:hover:text-[#0F172A]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#60A5FA] light:text-[#2563EB]' : 'text-[#64748B]'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile & Switcher */}
      <div className="p-3 border-t border-[#29344D] light:border-[#E2E8F0] space-y-2">
        {/* Quick Portal Switcher for testing/evaluation */}
        <div className="bg-[#151D31] light:bg-[#F8FAFC] rounded-lg p-2 border border-[#29344D] light:border-[#E2E8F0]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5 px-1">
            Demo Portal Switch
          </span>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleSwitchPortal('patient', '/patient')}
              title="Switch to Patient Portal"
              className={`py-1 text-[10px] rounded font-semibold transition-colors ${
                role === 'patient'
                  ? 'bg-[#60A5FA] text-[#0B1020]'
                  : 'bg-[#0F172A] light:bg-white text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => handleSwitchPortal('doctor', '/doctor')}
              title="Switch to Doctor Portal"
              className={`py-1 text-[10px] rounded font-semibold transition-colors ${
                role === 'doctor'
                  ? 'bg-[#60A5FA] text-[#0B1020]'
                  : 'bg-[#0F172A] light:bg-white text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              Doctor
            </button>
            <button
              onClick={() => handleSwitchPortal('receptionist', '/reception')}
              title="Switch to Receptionist Portal"
              className={`py-1 text-[10px] rounded font-semibold transition-colors ${
                role === 'receptionist'
                  ? 'bg-[#60A5FA] text-[#0B1020]'
                  : 'bg-[#0F172A] light:bg-white text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              Reception
            </button>
          </div>
        </div>

        {/* User Card & Sign Out */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#151D31] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#60A5FA] text-[#0B1020] flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#F1F5F9] light:text-[#0F172A] block truncate leading-none">
                {user?.name || 'Authorized User'}
              </span>
              <span className="text-[10px] text-[#94A3B8] light:text-[#64748B] block truncate capitalize mt-1 leading-none">
                {user?.role || 'Patient'}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            title="Sign Out to Portal Selection"
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-red-400 hover:bg-red-950/20 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;