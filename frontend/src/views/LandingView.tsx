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
  Compass,
  LineChart,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Zap,
  Sliders,
  ChevronRight,
  Database
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole } = useAuth();

  const handleRoleJump = async (role: Role, route: string) => {
    await switchRole(role);
    navigate(route);
  };

  const featureCards = [
    {
      icon: Brain,
      title: 'Adaptive Wait-Time Prediction Engine',
      desc: 'Replaces naive static slot multiplying with dynamic regression. Factors in active consultation progress, doctor historical pacing, break buffers, and case complexity.',
      badge: 'Explainable AI'
    },
    {
      icon: Sliders,
      title: 'Clinic-Day Digital Twin & Simulator',
      desc: 'Simulate virtual operational scenarios—demand surges, unannounced doctor delays, walk-in volume spikes—with before-and-after throughput comparisons.',
      badge: 'Decision Support'
    },
    {
      icon: Zap,
      title: 'Real-Time Queue Orchestration',
      desc: 'Live state transitions from check-in to consultation completion with duplicate check-in prevention, automated backlog updates, and authorized priority flags.',
      badge: 'Zero Double-Count'
    },
    {
      icon: LineChart,
      title: 'Audited Prediction Accuracy (MAE)',
      desc: 'Transparent real-world evaluation metrics comparing ClinicQueue Adaptive model vs fixed-slot baseline with Mean Absolute Error and sample distribution.',
      badge: 'Empirical Verification'
    }
  ];

  const rolePills: Array<{ id: Role; label: string; name: string; desc: string; icon: any; route: string }> = [
    {
      id: 'patient',
      label: 'Patient Portal',
      name: 'Rohan Mehta',
      desc: 'Track live queue position (#2), view predicted wait time with plain-language explanations, browse doctors, and book appointments.',
      icon: Users,
      route: '/patient'
    },
    {
      id: 'receptionist',
      label: 'Reception Desk',
      name: 'Ananya Sen',
      desc: 'Live check-in board, walk-in registration, duplicate prevention, priority flags (elderly/mobility), and congestion monitoring.',
      icon: Building2,
      route: '/reception'
    },
    {
      id: 'doctor',
      label: 'Doctor Console',
      name: 'Dr. Rajesh Sharma (Cardiology)',
      desc: 'One-click call-in, active consultation room, break timers, emergency delay reporting, and consultation duration recording.',
      icon: Stethoscope,
      route: '/doctor'
    },
    {
      id: 'hospital_admin',
      label: 'Hospital Administrator',
      name: 'Col. Dr. Saxena (MetroCare Apex)',
      desc: 'Operational analytics, doctor utilization %, Digital Twin clinic-day simulator, and prediction MAE evaluation dashboard.',
      icon: ShieldCheck,
      route: '/admin'
    },
    {
      id: 'platform_admin',
      label: 'Platform Administrator',
      name: 'National Healthcare Directory',
      desc: 'Multi-hospital directory (8 seeded facilities), hospital onboarding, aggregate analytics, and system health controls.',
      icon: Compass,
      route: '/platform'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-white via-brand-50/20 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-200 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>National-Level Hackathon Edition | Innovators Conclave 2026</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
              Predictable Outpatient <br />
              <span className="text-brand-600">Queue Operations & Delay Management</span>
            </h1>

            <p className="mt-5 text-lg text-slate-600 leading-relaxed font-normal">
              ClinicQueue replaces chaotic, unpredictable waiting rooms with a transparent, adaptive orchestration platform.
              Calculates calibrated waiting predictions with plain-language explanations, empowers staff with live queue control,
              and enables hospital leadership to test operational interventions with a clinic Digital Twin.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleRoleJump('patient', '/patient')}
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm flex items-center gap-2 transition-all hover:gap-3"
              >
                <span>Launch Live Experience</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/demo-centre')}
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-navy-900 font-semibold text-sm border border-slate-300 shadow-2xs flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Self-Guided Demo Centre</span>
              </button>

              <button
                onClick={() => navigate('/queue-board')}
                className="px-4 py-3 rounded-xl text-slate-600 hover:text-navy-900 text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Live Public Queue Board</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Minute Recommended Exploration Walkthrough */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-navy-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-navy-800">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-brand-400">Judges' Evaluation Guide</span>
                <h2 className="text-2xl font-bold mt-1">Recommended 5-Minute Product Journey</h2>
                <p className="text-sm text-slate-300 mt-1">
                  Test the complete end-to-end loop: Patient check-in → Doctor consultation → Real-time queue update → Hospital analytics.
                </p>
              </div>

              <button
                onClick={() => navigate('/demo-centre')}
                className="px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-navy-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
              >
                <span>Open Guided Walkthrough</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-navy-800/80 p-4 rounded-xl border border-navy-700/60">
                <span className="text-brand-400 font-bold text-xs">Step 1 • Patient</span>
                <h3 className="text-sm font-semibold mt-1">Check In & View Prediction</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Open Rohan Mehta's appointment, observe queue position (#2) and plain-language delay breakdown.
                </p>
              </div>

              <div className="bg-navy-800/80 p-4 rounded-xl border border-navy-700/60">
                <span className="text-brand-400 font-bold text-xs">Step 2 • Doctor</span>
                <h3 className="text-sm font-semibold mt-1">Complete Active Visit</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Switch to Dr. Sharma, complete the ongoing consultation with clinical notes, and call Rohan Mehta.
                </p>
              </div>

              <div className="bg-navy-800/80 p-4 rounded-xl border border-navy-700/60">
                <span className="text-brand-400 font-bold text-xs">Step 3 • Real-Time Loop</span>
                <h3 className="text-sm font-semibold mt-1">Verify Queue Recalculation</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Return to Patient screen: wait time updates to 0m and status shows "In Consultation".
                </p>
              </div>

              <div className="bg-navy-800/80 p-4 rounded-xl border border-navy-700/60">
                <span className="text-brand-400 font-bold text-xs">Step 4 • Admin Twin</span>
                <h3 className="text-sm font-semibold mt-1">Run Surge Simulator</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Open Hospital Admin to test the Digital Twin surge scenario and compare prediction accuracy vs baseline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Jump Directory */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">Explore Pre-Seeded User Personas</h2>
            <p className="text-sm text-slate-600 mt-2">
              Every role has an authentic, fully functional interface with server-side authorization and coherent healthcare records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolePills.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60">
                        {p.label}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-navy-900">{p.name}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{p.desc}</p>
                  </div>

                  <button
                    onClick={() => handleRoleJump(p.id, p.route)}
                    className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-brand-600 text-slate-700 hover:text-white font-semibold text-xs border border-slate-200 hover:border-brand-600 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Launch {p.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Differentiators & Technical Capabilities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-600">Architectural Innovations</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-1">Beyond Basic Online Booking</h2>
            <p className="text-sm text-slate-600 mt-2">
              Engineered to model the real unpredictability of clinic environments with mathematical rigor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featureCards.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex gap-4 p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-navy-900">{feat.title}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{feat.desc}</p>
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
