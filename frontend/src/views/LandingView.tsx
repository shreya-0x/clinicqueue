import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  Activity,
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  Clock,
  LineChart,
  ShieldCheck,
  Stethoscope,
  Users,
  Zap,
  Sliders,
  ChevronRight,
  Layers,
  HeartPulse,
  UserCheck,
  FileText
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole } = useAuth();

  const handleRoleJump = async (role: Role, route: string) => {
    await switchRole(role);
    navigate(route);
  };

  // Exactly three enterprise portals as specified
  const portals = [
    {
      id: 'patient' as Role,
      title: 'Patient Portal',
      subtitle: 'Personalized outpatient visit journey',
      desc: 'Browse medical departments and specialists, book appointments, check in digitally upon arrival, and track your live queue position with explainable waiting-time estimates.',
      icon: UserCheck,
      route: '/patient',
      action: 'Enter Patient Portal',
      accent: 'from-[#8B5CF6] to-[#7C3AED]',
      features: ['Live Queue Position & Wait Time', 'Appointment Booking & Check-In', 'Digital Prescriptions & Records', 'Cashless Health Card & Profile']
    },
    {
      id: 'receptionist' as Role,
      title: 'Receptionist Portal',
      subtitle: 'Clinic-wide operations & orchestration',
      desc: 'Coordinate daily schedules, register walk-in patients, manage arrivals, monitor congestion in real time, explore clinic-wide analytics, and test operational interventions with the Digital Twin simulator.',
      icon: Building2,
      route: '/reception',
      action: 'Enter Receptionist Portal',
      accent: 'from-[#6D28D9] to-[#8B5CF6]',
      features: ['Daily Schedule & Queue Desk', 'Walk-in Registration & Check-In', 'Operational Clinic Analytics', 'Digital Twin Clinic Simulator']
    },
    {
      id: 'doctor' as Role,
      title: 'Doctor Portal',
      subtitle: 'Clinical workflow & consultation management',
      desc: 'Review assigned appointments, call patients into consultation, record consultation durations and non-sensitive operational notes, manage breaks, and report unexpected delays.',
      icon: Stethoscope,
      route: '/doctor',
      action: 'Enter Doctor Portal',
      accent: 'from-[#7C3AED] to-[#5B21B6]',
      features: ['Assigned Daily Queue', 'Live Consultation Timer', 'Clinical Notes & Duration Logs', 'Availability & Delay Reporting']
    }
  ];

  const capabilities = [
    {
      icon: Brain,
      title: 'Adaptive Wait-Time Prediction Engine',
      desc: 'Replaces rigid static slots with dynamic regression. Factors in active consultation elapsed duration, doctor-specific pacing, scheduled breaks, and complexity weighting.',
      badge: 'Explainable AI'
    },
    {
      icon: Sliders,
      title: 'Clinic-Day Digital Twin (Simulator)',
      desc: 'Simulate virtual clinic days—demand surges, doctor emergency delays, walk-in volume spikes—with before-and-after throughput and backlog comparisons in strict data isolation.',
      badge: 'Decision Support'
    },
    {
      icon: Zap,
      title: 'Synchronized Queue Orchestration',
      desc: 'Real-time state transitions from check-in to consultation completion with duplicate check-in prevention, automated backlog updates, and authorized priority flags.',
      badge: 'Zero Double-Count'
    },
    {
      icon: LineChart,
      title: 'Empirical Prediction Evaluation (MAE)',
      desc: 'Transparent operational evaluation metrics comparing the adaptive model vs fixed-slot baseline with Mean Absolute Error and sample distribution.',
      badge: 'Empirical Accuracy'
    }
  ];

  return (
    <div className="min-h-screen bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-[#343347] light:border-[#DDD9E9]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#8B5CF6]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] border border-[#343347] light:border-[#DDD9E9] mb-6 animate-fade-in">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Smarter Outpatient Operations</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              A clearer view of your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED]">
                outpatient waiting time.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#AAA6BC] light:text-[#625D74] leading-relaxed font-normal">
              Appointments and queues, coordinated. ClinicQueue transforms unpredictable waiting rooms into a transparent,
              measurable, and actively managed process with explainable predictions, live multi-role orchestration, and clinic-day simulation.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleRoleJump('patient', '/patient')}
                className="px-6 py-3.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] light:bg-[#6D28D9] light:hover:bg-[#5B21B6] text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all hover:gap-3"
              >
                <span>Launch Patient Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/queue-board')}
                className="px-5 py-3.5 rounded-xl bg-[#1B1B28] hover:bg-[#222233] light:bg-white light:hover:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033] font-semibold text-sm border border-[#343347] light:border-[#DDD9E9] flex items-center gap-2 transition-colors"
              >
                <Clock className="w-4 h-4 text-[#8B5CF6]" />
                <span>Live Public Queue Board</span>
              </button>

              <button
                onClick={() => navigate('/hospitals')}
                className="px-4 py-3.5 rounded-xl text-[#AAA6BC] light:text-[#625D74] hover:text-[#F4F2FA] light:hover:text-[#242033] text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>Clinic Directory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Exactly Three Normal User-Facing Portals */}
      <section className="py-16 border-b border-[#343347] light:border-[#DDD9E9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dedicated Role Portals</h2>
            <p className="mt-2 text-xs sm:text-sm text-[#AAA6BC] light:text-[#625D74]">
              Select a portal below to access role-specific workflows, real-time data permissions, and synchronized operational tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <div
                  key={portal.id}
                  className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-sm hover:border-[#8B5CF6] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#29213D] to-[#222233] light:from-[#EDE9FE] light:to-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] flex items-center justify-center text-[#A78BFA] light:text-[#6D28D9] mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-[#F4F2FA] light:text-[#242033]">{portal.title}</h3>
                    <p className="text-xs text-[#8B5CF6] light:text-[#6D28D9] font-medium mt-0.5">{portal.subtitle}</p>
                    <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-3 leading-relaxed">
                      {portal.desc}
                    </p>

                    <div className="mt-5 pt-4 border-t border-[#29293A] light:border-[#EAE7F1] space-y-2">
                      {portal.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#AAA6BC] light:text-[#625D74]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] light:text-[#6D28D9] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4">
                    <button
                      onClick={() => handleRoleJump(portal.id, portal.route)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#29213D] hover:bg-[#8B5CF6] light:bg-[#EDE9FE] light:hover:bg-[#6D28D9] text-[#A78BFA] hover:text-white light:text-[#6D28D9] light:hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <span>{portal.action}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Predictive Insights for Better Clinic Operations</h2>
            <p className="mt-2 text-xs sm:text-sm text-[#AAA6BC] light:text-[#625D74]">
              Built for outpatient clinics and hospital leadership to measure, explain, and manage operational flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#29213D] light:bg-[#EDE9FE] flex items-center justify-center text-[#A78BFA] light:text-[#6D28D9]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#222233] light:bg-[#F0EFF7] text-[#A78BFA] light:text-[#6D28D9]">
                        {c.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#F4F2FA] light:text-[#242033] mb-2">{c.title}</h3>
                    <p className="text-xs text-[#AAA6BC] light:text-[#625D74] leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
