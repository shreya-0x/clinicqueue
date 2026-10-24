import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Activity,
  ArrowRight,
  Building2,
  Moon,
  Stethoscope,
  Sun,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Exactly three enterprise portal cards
  const portals = [
    {
      id: 'patient',
      roleName: 'Patient Portal',
      subtitle: 'Personal Outpatient Journey',
      desc: 'Check in for scheduled appointments, monitor real-time queue position with explainable waiting-time estimates, view prescriptions, and manage visit records.',
      icon: UserCheck,
      route: '/login/patient',
      actionText: 'Enter Patient Portal',
      features: ['Appointment Check-in & Booking', 'Live Queue Position & Wait Times', 'Digital Prescriptions & Records'],
      accentColor: '#60A5FA'
    },
    {
      id: 'doctor',
      roleName: 'Doctor Portal',
      subtitle: 'Clinical Workflow & Consultations',
      desc: 'Manage your assigned outpatient schedule, call next patients, record consultation durations with operational notes, and broadcast availability in real time.',
      icon: Stethoscope,
      route: '/login/doctor',
      actionText: 'Enter Doctor Portal',
      features: ['Assigned Daily Schedule', 'Live Consultation Timer & Notes', 'Pacing & Delay Reporting'],
      accentColor: '#93C5FD'
    },
    {
      id: 'receptionist',
      roleName: 'Receptionist Portal',
      subtitle: 'Front Desk & Operations Desk',
      desc: 'Orchestrate clinic arrivals, register walk-in patients, manage congestion, inspect operational metrics, and run the Digital Twin simulator.',
      icon: Building2,
      route: '/login/receptionist',
      actionText: 'Enter Receptionist Portal',
      features: ['Queue Desk & Walk-In Intake', 'Doctor Availability & Congestion', 'Operational Simulator & Analytics'],
      accentColor: '#3B82F6'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0B1020] light:bg-[#F8FAFC] text-[#F1F5F9] light:text-[#0F172A] transition-colors duration-150">
      {/* Compact Top Header */}
      <header className="border-b border-[#29344D] light:border-[#E2E8F0] bg-[#0F172A] light:bg-white h-14 shrink-0 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Brand & Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] flex items-center justify-center text-[#60A5FA] light:text-[#2563EB]">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#F1F5F9] light:text-[#0F172A]">
                ClinicQueue
              </span>
              <span className="hidden sm:inline-block text-[11px] text-[#94A3B8] light:text-[#64748B] font-medium border-l border-[#29344D] light:border-[#CBD5E1] pl-2">
                Intelligent Outpatient Queue Management
              </span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="p-2 rounded-lg border border-[#29344D] light:border-[#E2E8F0] bg-[#151D31] light:bg-[#F1F5F9] text-[#94A3B8] light:text-[#475569] hover:text-[#F1F5F9] light:hover:text-[#0F172A] hover:border-[#60A5FA] transition-all focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FBBF24]" /> : <Moon className="w-4 h-4 text-[#2563EB]" />}
          </button>
        </div>
      </header>

      {/* Main Centered Content (fits 1366x768 without forced scroll) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-center">
        {/* Headline & Supporting Sentence */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#151D31] light:bg-[#EFF6FF] text-[#60A5FA] light:text-[#2563EB] border border-[#29344D] light:border-[#BFDBFE] mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Smarter Outpatient Operations</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#F1F5F9] light:text-[#0F172A] leading-tight">
            Intelligent Outpatient Appointment & Queue Management
          </h1>

          <p className="mt-2.5 text-xs sm:text-sm text-[#94A3B8] light:text-[#475569] leading-relaxed max-w-xl mx-auto">
            Select your clinical portal below to access coordinated appointment scheduling, live queue tracking, and explainable waiting-time estimates.
          </p>
        </div>

        {/* Exactly Three Prominent Role Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 w-full">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(portal.route);
                  }
                }}
                onClick={() => navigate(portal.route)}
                role="button"
                aria-label={portal.actionText}
                className="group relative bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:border-[#60A5FA] light:hover:border-[#3B82F6] hover:bg-[#1B263D] light:hover:bg-[#F8FAFC] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#60A5FA] cursor-pointer"
              >
                <div>
                  {/* Icon & Subtitle Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-lg bg-[#0F172A] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#DBEAFE] flex items-center justify-center text-[#60A5FA] light:text-[#2563EB] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#0F172A] light:bg-[#F1F5F9] text-[#93C5FD] light:text-[#2563EB] border border-[#29344D] light:border-[#E2E8F0]">
                      {portal.subtitle}
                    </span>
                  </div>

                  {/* Card Title */}
                  <h2 className="text-lg font-bold text-[#F1F5F9] light:text-[#0F172A] group-hover:text-[#60A5FA] light:group-hover:text-[#2563EB] transition-colors">
                    {portal.roleName}
                  </h2>

                  {/* Description */}
                  <p className="mt-2 text-xs text-[#94A3B8] light:text-[#475569] leading-relaxed">
                    {portal.desc}
                  </p>

                  {/* Key Features List */}
                  <div className="mt-4 pt-3.5 border-t border-[#1E293B] light:border-[#E2E8F0] space-y-1.5">
                    {portal.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-[#94A3B8] light:text-[#475569]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] light:bg-[#2563EB] shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="mt-5 pt-3">
                  <button
                    type="button"
                    tabIndex={-1}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] text-[#0B1020] light:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs group-hover:gap-2.5"
                  >
                    <span>{portal.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Clean Uncluttered Footer */}
      <footer className="border-t border-[#29344D] light:border-[#E2E8F0] bg-[#0F172A] light:bg-white py-3.5 text-xs text-[#64748B] light:text-[#64748B] shrink-0 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-[#F1F5F9] light:text-[#0F172A]">ClinicQueue</span>
            <span>• Intelligent Outpatient Operations & Queue Analytics</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Explainable Wait Predictions</span>
            <span>•</span>
            <span>Live Multi-Role Orchestration</span>
            <span>•</span>
            <span>Operational Simulation</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;