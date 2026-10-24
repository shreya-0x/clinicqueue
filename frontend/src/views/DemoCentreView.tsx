import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { api } from '../api';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Users,
  Building2,
  Stethoscope,
  ShieldCheck,
  Compass,
  Clock,
  Sliders,
  LineChart,
  Brain,
  Database,
  ExternalLink
} from 'lucide-react';

export const DemoCentreView: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole, storageInfo, refreshUser } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [resetting, setResetting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((s) => s !== stepNum) : [...prev, stepNum]
    );
  };

  const steps = [
    {
      num: 1,
      role: 'patient' as Role,
      route: '/patient',
      title: 'Inspect Patient Live Queue & Adaptive Estimate',
      desc: 'Open Rohan Mehta’s dashboard. View his checked-in appointment (#2 in queue) with Dr. Rajesh Sharma. Notice the predicted wait (~14m) and the plain-language calculation reasons.',
      targetLabel: 'Open Patient Portal'
    },
    {
      num: 2,
      role: 'receptionist' as Role,
      route: '/reception',
      title: 'Receptionist Queue Board & Intake',
      desc: 'Open reception desk. Observe today’s active queue for MetroCare Apex. Test registering a walk-in or checking in a waiting patient with priority flags (Elderly, Mobility).',
      targetLabel: 'Open Reception Desk'
    },
    {
      num: 3,
      role: 'doctor' as Role,
      route: '/doctor',
      title: 'Doctor Active Consultation Room',
      desc: 'Switch to Dr. Rajesh Sharma. View patient P-0002 currently in consultation. Click "Complete Consultation" with clinical notes, then call Rohan Mehta to start his visit.',
      targetLabel: 'Open Doctor Console'
    },
    {
      num: 4,
      role: 'patient' as Role,
      route: '/patient',
      title: 'Observe Real-Time Queue Recalculation',
      desc: 'Return to Rohan Mehta’s view. Notice his status has seamlessly transitioned to "In Consultation" and wait time updated to 0m without page reload.',
      targetLabel: 'Verify Patient State'
    },
    {
      num: 5,
      role: 'hospital_admin' as Role,
      route: '/admin',
      title: 'Hospital Operational Analytics',
      desc: 'Review hospital KPIs derived from actual synthetic appointments: Average wait time, doctor utilization rate, volume by department, and hourly congestion curve.',
      targetLabel: 'View Admin Analytics'
    },
    {
      num: 6,
      role: 'hospital_admin' as Role,
      route: '/admin?tab=simulator',
      title: 'Clinic-Day Digital Twin (Simulator)',
      desc: 'Test operational interventions: Run the "High-Demand Surge" or "Doctor Delay" scenario. Adjust walk-in rates and view before-and-after wait time curves.',
      targetLabel: 'Launch Simulator'
    },
    {
      num: 7,
      role: 'hospital_admin' as Role,
      route: '/admin?tab=evaluation',
      title: 'Prediction Accuracy Evaluation (MAE)',
      desc: 'Inspect empirical evaluation comparing ClinicQueue’s Adaptive Engine vs the Fixed Slot Baseline across historical completed consultations.',
      targetLabel: 'View Model Evaluation'
    },
    {
      num: 8,
      role: 'platform_admin' as Role,
      route: '/platform',
      title: 'National Platform Multi-Hospital Directory',
      desc: 'Browse all 8 seeded hospitals across India (Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, etc.), test hospital onboarding and system status.',
      targetLabel: 'Open Platform Admin'
    }
  ];

  const handleExecuteStep = async (step: typeof steps[0]) => {
    await switchRole(step.role);
    if (!completedSteps.includes(step.num)) {
      setCompletedSteps((prev) => [...prev, step.num]);
    }
    navigate(step.route);
  };

  const handleReset = async () => {
    if (!confirm('Reset demo state to initial seed baseline?')) return;
    setResetting(true);
    try {
      await api.resetDemoData();
      await refreshUser();
      setCompletedSteps([1]);
      setStatusMsg('Demo database reset to clean baseline.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Self-Guided Evaluation Centre</span>
              </div>
              <h1 className="text-3xl font-bold text-navy-900">Explore ClinicQueue Autonomously</h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                This guided workflow walks you through every major operational capability in under 5 minutes without needing a live presenter.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Resetting...' : 'Reset Demo Dataset'}</span>
              </button>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-brand-600" />
                <span>{storageInfo?.is_atlas ? 'MongoDB Atlas Cluster' : 'Local Embedded Storage'}</span>
              </div>
            </div>
          </div>

          {statusMsg && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Verification Progress</span>
              <span>{completedSteps.length} of {steps.length} Steps Completed</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 8-Step Verification Journey */}
        <div className="space-y-4">
          {steps.map((st) => {
            const isCompleted = completedSteps.includes(st.num);
            return (
              <div
                key={st.num}
                className={`bg-white rounded-2xl p-6 border transition-all ${
                  isCompleted ? 'border-brand-200 bg-brand-50/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleStep(st.num)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isCompleted
                          ? 'bg-brand-600 text-white'
                          : 'border-2 border-slate-300 hover:border-brand-500 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-brand-700 uppercase tracking-wide">
                          Step {st.num} • {st.role.replace('_', ' ')}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-navy-900 mt-1">{st.title}</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-2xl">{st.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecuteStep(st)}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <span>{st.targetLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
