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
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Exactly three enterprise portal cards
  const portals = [
    {
      id: 'patient',
      roleName: 'Patient',
      subtitle: 'Personal Outpatient Journey',
      desc: 'Check in for appointments, track your real-time queue position with explainable waiting-time estimates, view prescriptions, and manage visit records.',
      icon: UserCheck,
      route: '/login/patient',
      highlights: ['Live Queue Position & Wait Time', 'Appointment Check-In & Booking', 'Digital Prescriptions & Records'],
      gradient: 'from-[#8B5CF6]/20 via-[#7C3AED]/10 to-transparent',
      borderColor: 'hover:border-[#8B5CF6]',
      buttonClass: 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white',
      badgeColor: 'bg-[#8B5CF6]/15 text-[#A78BFA] light:bg-[#EDE9FE] light:text-[#6D28D9]'
    },
    {
      id: 'doctor',
      roleName: 'Doctor',
      subtitle: 'Clinical Workflow & Consultations',
      desc: 'Manage your assigned outpatient schedule, call next patients, log consultation durations with operational notes, and broadcast availability in real time.',
      icon: Stethoscope,
      route: '/login/doctor',
      highlights: ['Assigned Daily Queue', 'Live Consultation Timer & Notes', 'Pacing & Delay Reporting'],
      gradient: 'from-[#7C3AED]/20 via-[#6D28D9]/10 to-transparent',
      borderColor: 'hover:border-[#7C3AED]',
      buttonClass: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
      badgeColor: 'bg-[#7C3AED]/15 text-[#C4B5FD] light:bg-[#F3E8FF] light:text-[#7E22CE]'
    },
    {
      id: 'receptionist',
      roleName: 'Receptionist',
      subtitle: 'Front Desk & Clinic Operations',
      desc: 'Orchestrate clinic-wide patient check-ins, register walk-in patients, monitor waiting room congestion, inspect analytics, and run the Digital Twin simulator.',
      icon: Building2,
      route: '/login/receptionist',
      highlights: ['Queue Desk & Walk-In Intake', 'Waiting Room Congestion Tracking', 'Operational Simulator & Analytics'],
      gradient: 'from-[#6D28D9]/20 via-[#5B21B6]/10 to-transparent',
      borderColor: 'hover:border-[#6D28D9]',
      buttonClass: 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white',
      badgeColor: 'bg-[#6D28D9]/15 text-[#DDD6FE] light:bg-[#EDE9FE] light:text-[#5B21B6]'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] transition-colors duration-200">
      {/* Top Header with Brand and Theme Switcher */}
      <header className="border-b border-[#343347] light:border-[#DDD9E9] bg-[#15151F]/80 light:bg-white/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Product Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shadow-[#8B5CF6]/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#F4F2FA] light:text-[#242033]">
                ClinicQueue
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-[#8B5CF6] light:text-[#6D28D9] font-medium px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 light:bg-[#EDE9FE]">
                Predictable Outpatient Operations
              </span>
            </div>
          </div>

          {/* Theme Preference Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light theme"
              className="p-2.5 rounded-xl border border-[#343347] light:border-[#DDD9E9] bg-[#1B1B28] light:bg-[#F0EFF7] text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] hover:border-[#8B5CF6] transition-all focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FBBF24]" /> : <Moon className="w-4 h-4 text-[#6D28D9]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] border border-[#343347] light:border-[#DDD9E9] mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Smarter Outpatient Operations</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            A clearer view of your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED]">
              outpatient waiting time.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#AAA6BC] light:text-[#625D74] leading-relaxed max-w-2xl mx-auto">
            Appointments and queues, coordinated. Select your role portal below to access specialized clinical workflows, real-time queues, and predictive insights.
          </p>
        </div>

        {/* Exactly Three Prominent Role Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto w-full">
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
                className={`group relative bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#8B5CF6]/5 ${portal.borderColor} hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent cursor-pointer`}
                onClick={() => navigate(portal.route)}
                role="button"
                aria-label={`Enter ${portal.roleName} Portal`}
              >
                {/* Background ambient glow on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${portal.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                <div className="relative z-10">
                  {/* Card Icon & Role Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#29213D] light:bg-[#EDE9FE] border border-[#343347] light:border-[#DDD9E9] flex items-center justify-center text-[#A78BFA] light:text-[#6D28D9] group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${portal.badgeColor}`}>
                      {portal.subtitle}
                    </span>
                  </div>

                  {/* Card Heading */}
                  <h2 className="text-2xl font-bold text-[#F4F2FA] light:text-[#242033] tracking-tight group-hover:text-[#A78BFA] light:group-hover:text-[#6D28D9] transition-colors">
                    {portal.roleName}
                  </h2>

                  {/* Concise Description */}
                  <p className="mt-3 text-sm text-[#AAA6BC] light:text-[#625D74] leading-relaxed">
                    {portal.desc}
                  </p>

                  {/* Feature Highlights */}
                  <div className="mt-6 pt-5 border-t border-[#29293A] light:border-[#EAE7F1] space-y-2.5">
                    {portal.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#AAA6BC] light:text-[#625D74]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] light:bg-[#6D28D9]" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prominent Action Button */}
                <div className="relative z-10 mt-8 pt-4">
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${portal.buttonClass} group-hover:gap-3`}
                  >
                    <span>Enter {portal.roleName} Portal</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Clean Uncluttered Footer */}
      <footer className="border-t border-[#343347] light:border-[#DDD9E9] bg-[#15151F] light:bg-white py-6 text-xs text-[#817C95] light:text-[#777188] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F4F2FA] light:text-[#242033]">ClinicQueue</span>
            <span>• Predictable Outpatient Queue Manager</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Adaptive Wait-Time Prediction</span>
            <span>•</span>
            <span>Live Queue Orchestration</span>
            <span>•</span>
            <span>Clinic-Day Simulator</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;