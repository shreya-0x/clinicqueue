import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Printer,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  Stethoscope,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export interface SimulationParams {
  num_doctors: number;
  num_appointments: number;
  walk_in_rate_pct: number;
  base_consultation_minutes: number;
  doctor_delay_minutes: number;
  staff_shortage_pct: number;
}

export const DigitalTwinSimulator: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const baselineParams: SimulationParams = {
    num_doctors: 2,
    num_appointments: 30,
    walk_in_rate_pct: 15,
    base_consultation_minutes: 15,
    doctor_delay_minutes: 0,
    staff_shortage_pct: 0
  };

  const [selectedPreset, setSelectedPreset] = useState<string>('normal_day');
  const [params, setParams] = useState<SimulationParams>({ ...baselineParams });
  const [simRunning, setSimRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);

  // Preset Configurations
  const presets = [
    {
      id: 'normal_day',
      label: 'Normal Operating Day',
      desc: 'Standard nominal outpatient scheduling',
      config: { num_doctors: 2, num_appointments: 30, walk_in_rate_pct: 15, base_consultation_minutes: 15, doctor_delay_minutes: 0, staff_shortage_pct: 0 }
    },
    {
      id: 'high_demand',
      label: 'High Demand Surge (+60%)',
      desc: '48 scheduled + 35% walk-in surge',
      config: { num_doctors: 2, num_appointments: 48, walk_in_rate_pct: 35, base_consultation_minutes: 15, doctor_delay_minutes: 0, staff_shortage_pct: 0 }
    },
    {
      id: 'staff_shortage',
      label: 'Staff Shortage',
      desc: 'Only 1 active doctor available on duty',
      config: { num_doctors: 1, num_appointments: 30, walk_in_rate_pct: 15, base_consultation_minutes: 15, doctor_delay_minutes: 0, staff_shortage_pct: 50 }
    },
    {
      id: 'complex_cases',
      label: 'Complex Diagnostic Cases',
      desc: '25-minute prolonged consultations',
      config: { num_doctors: 2, num_appointments: 30, walk_in_rate_pct: 15, base_consultation_minutes: 25, doctor_delay_minutes: 0, staff_shortage_pct: 0 }
    },
    {
      id: 'delayed_doctor',
      label: 'Doctor 45m Delay',
      desc: 'Emergency delayed arrival of primary physician',
      config: { num_doctors: 2, num_appointments: 30, walk_in_rate_pct: 15, base_consultation_minutes: 15, doctor_delay_minutes: 45, staff_shortage_pct: 0 }
    },
    {
      id: 'custom',
      label: 'Custom Simulation',
      desc: 'Freely adjust parameters using interactive sliders',
      config: { ...params }
    }
  ];

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = presets.find((p) => p.id === presetId);
    if (found && presetId !== 'custom') {
      setParams({ ...found.config });
    }
  };

  const handleResetBaseline = () => {
    setSelectedPreset('normal_day');
    setParams({ ...baselineParams });
  };

  // Run simulation engine (pure, isolated calculation)
  const runSimulation = () => {
    setSimRunning(true);
    setTimeout(() => {
      setSimRunning(false);
      setHasRun(true);
    }, 450);
  };

  // Mathematical Model for Baseline Metrics
  const baselineMetrics = useMemo(() => {
    const totalDemand = Math.round(baselineParams.num_appointments * (1 + baselineParams.walk_in_rate_pct / 100));
    const clinicHours = 7; // 09:00 to 16:00
    const totalDoctorMinutes = baselineParams.num_doctors * clinicHours * 60;
    const capacity = Math.floor(totalDoctorMinutes / baselineParams.base_consultation_minutes);
    const served = Math.min(totalDemand, capacity);
    const backlog = Math.max(0, totalDemand - served);
    const avgWait = 13.8;
    const medianWait = 12.0;
    const maxWait = 28.0;
    const peakQueue = 6;
    const utilPct = Math.min(98, Math.round(((served * baselineParams.base_consultation_minutes) / totalDoctorMinutes) * 100));

    return {
      totalDemand,
      served,
      backlog,
      avgWait,
      medianWait,
      maxWait,
      peakQueue,
      utilPct,
      noShows: 2
    };
  }, []);

  // Mathematical Model for Simulated Scenario Metrics
  const simMetrics = useMemo(() => {
    const totalDemand = Math.round(params.num_appointments * (1 + params.walk_in_rate_pct / 100));
    const clinicHours = 7;
    const effectiveDoctorMinutes = params.num_doctors * clinicHours * 60 - params.doctor_delay_minutes;
    const capacity = Math.max(1, Math.floor(effectiveDoctorMinutes / params.base_consultation_minutes));
    const served = Math.min(totalDemand, capacity);
    const backlog = Math.max(0, totalDemand - served);

    // Dwell multiplier based on congestion ratio
    const congestionRatio = totalDemand / Math.max(1, capacity);
    const delayPenalty = params.doctor_delay_minutes * 0.45;
    const avgWait = Math.round((baselineMetrics.avgWait * congestionRatio + delayPenalty) * 10) / 10;
    const medianWait = Math.round((avgWait * 0.88) * 10) / 10;
    const maxWait = Math.round((avgWait * 2.1) * 10) / 10;
    const peakQueue = Math.max(3, Math.round(baselineMetrics.peakQueue * congestionRatio + (params.doctor_delay_minutes > 0 ? 5 : 0)));
    const utilPct = Math.min(100, Math.round(((served * params.base_consultation_minutes) / Math.max(1, effectiveDoctorMinutes)) * 100));

    return {
      totalDemand,
      served,
      backlog,
      avgWait,
      medianWait,
      maxWait,
      peakQueue,
      utilPct,
      noShows: Math.round(totalDemand * 0.04)
    };
  }, [params, baselineMetrics]);

  // Hourly Queue Dynamics (Baseline vs Scenario trajectory)
  const hourlyQueueCurve = useMemo(() => {
    const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    const baseWave = [3, 6, 8, 5, 2, 6, 4, 1];

    const demandFactor = params.num_appointments / baselineParams.num_appointments;
    const doctorFactor = baselineParams.num_doctors / Math.max(1, params.num_doctors);
    const delayBoost = params.doctor_delay_minutes > 0 ? [5, 7, 5, 2, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0, 0];

    return hours.map((h, i) => {
      const baseVal = baseWave[i];
      const simVal = Math.max(0, Math.round(baseVal * demandFactor * doctorFactor + delayBoost[i]));
      const simWait = Math.round(simVal * (params.base_consultation_minutes / Math.max(1, params.num_doctors)));
      const baseWait = Math.round(baseVal * (baselineParams.base_consultation_minutes / baselineParams.num_doctors));

      return {
        time: h,
        baselineQueue: baseVal,
        simulatedQueue: simVal,
        baselineWait: baseWait,
        simulatedWait: simWait,
        hourlyArrivals: Math.round(simVal * 1.4 + 2)
      };
    });
  }, [params, baselineParams]);

  // Workload by simulated doctors
  const doctorWorkloadSim = useMemo(() => {
    const doctorsList = [
      { id: 1, name: 'Dr. Rajesh Sharma', specialty: 'Cardiology' },
      { id: 2, name: 'Dr. Sunita Patel', specialty: 'General Medicine' },
      { id: 3, name: 'Dr. Amitav Kulkarni', specialty: 'Orthopedics' },
      { id: 4, name: 'Dr. Priya Menon', specialty: 'Pediatrics' },
      { id: 5, name: 'Dr. Rohan Deshmukh', specialty: 'Neurology' },
      { id: 6, name: 'Dr. Kavita Bansal', specialty: 'Dermatology' }
    ];

    const activeDocs = doctorsList.slice(0, params.num_doctors);
    const perDocServed = Math.floor(simMetrics.served / Math.max(1, activeDocs.length));
    const remainder = simMetrics.served % Math.max(1, activeDocs.length);

    return activeDocs.map((doc, i) => {
      const patientCount = perDocServed + (i < remainder ? 1 : 0);
      return {
        name: doc.name,
        specialty: doc.specialty,
        patientsServed: patientCount,
        consultMinutes: patientCount * params.base_consultation_minutes,
        utilization: Math.min(100, Math.round(((patientCount * params.base_consultation_minutes) / (7 * 60)) * 100))
      };
    });
  }, [params, simMetrics]);

  // Actionable Insights based on results
  const operationalRecommendations = useMemo(() => {
    const list: string[] = [];

    if (simMetrics.backlog > 4) {
      list.push(`Critical Backlog Warning: ${simMetrics.backlog} patients will remain unserved at 16:00 closing. Deploy 1 roving relief clinician between 10:00 and 13:00.`);
    }
    if (params.doctor_delay_minutes >= 30) {
      list.push(`Delayed Start Impact: The ${params.doctor_delay_minutes}m delay causes morning queue dwell to spike to ${simMetrics.peakQueue} patients. Implement immediate SMS queue-holding notices.`);
    }
    if (simMetrics.avgWait > 24) {
      list.push(`Prolonged Dwell Time: Average waiting time (${simMetrics.avgWait}m) exceeds the 20-minute patient satisfaction threshold. Consider reassigning follow-up visits to express review slots.`);
    }
    if (params.base_consultation_minutes > 20) {
      list.push(`Extended Consultations: 25m consultations reduce single-physician throughput by 40%. Stagger scheduled check-in intervals from 15m to 25m.`);
    }
    if (list.length === 0) {
      list.push('Operational Efficiency Optimal: Pacing and clinician staffing comfortably absorb patient demand with sub-15 minute waiting times.');
    }

    return list;
  }, [simMetrics, params]);

  // Chart styling colors responsive to theme
  const chartColors = {
    grid: isDark ? '#1E293B' : '#E2E8F0',
    text: isDark ? '#94A3B8' : '#64748B',
    tooltipBg: isDark ? '#151D31' : '#FFFFFF',
    tooltipBorder: isDark ? '#29344D' : '#E2E8F0',
    primaryBlue: '#60A5FA',
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#EF4444'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Simulation Controls */}
      <div className="bg-[#151D31] light:bg-white rounded-xl p-6 border border-[#29344D] light:border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1E293B] light:border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#60A5FA] light:text-[#2563EB]" />
              <h2 className="text-lg font-bold text-[#F1F5F9] light:text-[#0F172A]">
                Digital Twin — Clinic-Day Operations Simulator
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
              Simulate operational scenarios (staffing shifts, walk-in surges, doctor delays) in isolated synthetic memory without modifying live records.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetBaseline}
              className="py-2 px-3 rounded-lg bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#F1F5F9] light:hover:text-[#0F172A] border border-[#29344D] light:border-[#CBD5E1] font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2 px-3 rounded-lg bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#F1F5F9] light:hover:text-[#0F172A] border border-[#29344D] light:border-[#CBD5E1] font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>

            <button
              onClick={runSimulation}
              disabled={simRunning}
              className="py-2 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] disabled:opacity-50 text-[#0B1020] light:text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-xs"
            >
              {simRunning ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset Scenarios Selector */}
        <div className="mt-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] light:text-[#64748B] block mb-2">
            Select Operational Preset Scenario
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3 rounded-xl text-left border text-xs transition-all ${
                  selectedPreset === preset.id
                    ? 'bg-[#1B263D] border-[#60A5FA] text-[#F1F5F9] shadow-xs'
                    : 'bg-[#0F172A] light:bg-[#F8FAFC] border-[#29344D] light:border-[#E2E8F0] text-[#94A3B8] hover:border-[#60A5FA]/60'
                }`}
              >
                <span className="font-bold block text-[#F1F5F9] light:text-[#0F172A] truncate">{preset.label}</span>
                <span className="text-[10px] text-[#94A3B8] light:text-[#64748B] block mt-1 leading-tight line-clamp-2">
                  {preset.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Parameter Control Sliders */}
        <div className="mt-6 pt-5 border-t border-[#1E293B] light:border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Available Doctors */}
          <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] light:text-[#64748B]">Active Physicians</span>
              <strong className="text-[#60A5FA] light:text-[#2563EB] font-bold">{params.num_doctors} on duty</strong>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={params.num_doctors}
              onChange={(e) => {
                setParams((p) => ({ ...p, num_doctors: Number(e.target.value) }));
                setSelectedPreset('custom');
              }}
              className="w-full accent-[#60A5FA]"
            />
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>1 doctor</span>
              <span>6 doctors</span>
            </div>
          </div>

          {/* 2. Appointments */}
          <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] light:text-[#64748B]">Scheduled Bookings</span>
              <strong className="text-[#60A5FA] light:text-[#2563EB] font-bold">{params.num_appointments} visits</strong>
            </div>
            <input
              type="range"
              min="15"
              max="70"
              step="5"
              value={params.num_appointments}
              onChange={(e) => {
                setParams((p) => ({ ...p, num_appointments: Number(e.target.value) }));
                setSelectedPreset('custom');
              }}
              className="w-full accent-[#60A5FA]"
            />
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>15 visits</span>
              <span>70 visits</span>
            </div>
          </div>

          {/* 3. Walk-in Rate */}
          <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] light:text-[#64748B]">Walk-in Surge Rate</span>
              <strong className="text-[#60A5FA] light:text-[#2563EB] font-bold">{params.walk_in_rate_pct}%</strong>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={params.walk_in_rate_pct}
              onChange={(e) => {
                setParams((p) => ({ ...p, walk_in_rate_pct: Number(e.target.value) }));
                setSelectedPreset('custom');
              }}
              className="w-full accent-[#60A5FA]"
            />
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>5% (Calm)</span>
              <span>50% (Heavy)</span>
            </div>
          </div>

          {/* 4. Consultation Duration */}
          <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] light:text-[#64748B]">Nominal Duration</span>
              <strong className="text-[#60A5FA] light:text-[#2563EB] font-bold">{params.base_consultation_minutes}m / visit</strong>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="5"
              value={params.base_consultation_minutes}
              onChange={(e) => {
                setParams((p) => ({ ...p, base_consultation_minutes: Number(e.target.value) }));
                setSelectedPreset('custom');
              }}
              className="w-full accent-[#60A5FA]"
            />
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>10m (Express)</span>
              <span>35m (Complex)</span>
            </div>
          </div>

          {/* 5. Doctor Delay */}
          <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] light:text-[#64748B]">Physician Delay</span>
              <strong className="text-amber-400 font-bold">{params.doctor_delay_minutes}m delay</strong>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="15"
              value={params.doctor_delay_minutes}
              onChange={(e) => {
                setParams((p) => ({ ...p, doctor_delay_minutes: Number(e.target.value) }));
                setSelectedPreset('custom');
              }}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>0m (On Time)</span>
              <span>90m (Critical)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Baseline vs Scenario Metric Comparison Table */}
      <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] light:border-[#E2E8F0]">
          <div>
            <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">
              Baseline vs Simulated Scenario Outcomes
            </h3>
            <p className="text-xs text-[#94A3B8] light:text-[#475569]">
              Rigorous comparative breakdown between standard operational baseline and current simulation parameters.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-[#1B263D] text-[#60A5FA] font-bold">
            Scenario: {presets.find(p => p.id === selectedPreset)?.label}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]">
                <th className="py-2.5 px-3 font-semibold">Operational Indicator</th>
                <th className="py-2.5 px-3 font-semibold text-center">Baseline Operational Value</th>
                <th className="py-2.5 px-3 font-semibold text-center">Simulated Scenario Outcome</th>
                <th className="py-2.5 px-3 font-semibold text-center">Variance / Delta</th>
                <th className="py-2.5 px-3 font-semibold text-right">Operational Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
              <tr>
                <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">Total Outpatient Demand</td>
                <td className="py-3 px-3 text-center font-mono">{baselineMetrics.totalDemand} patients</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-[#60A5FA]">{simMetrics.totalDemand} patients</td>
                <td className="py-3 px-3 text-center font-mono">
                  {simMetrics.totalDemand - baselineMetrics.totalDemand >= 0 ? `+${simMetrics.totalDemand - baselineMetrics.totalDemand}` : simMetrics.totalDemand - baselineMetrics.totalDemand}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-[11px] font-bold text-[#94A3B8]">
                    {simMetrics.totalDemand > baselineMetrics.totalDemand ? 'Surge Influx' : 'Baseline Demand'}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">Completed Consultations</td>
                <td className="py-3 px-3 text-center font-mono">{baselineMetrics.served} served</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{simMetrics.served} served</td>
                <td className="py-3 px-3 text-center font-mono">
                  {simMetrics.served - baselineMetrics.served >= 0 ? `+${simMetrics.served - baselineMetrics.served}` : simMetrics.served - baselineMetrics.served}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${simMetrics.served >= baselineMetrics.served ? 'bg-emerald-950/60 text-emerald-300' : 'bg-amber-950/60 text-amber-300'}`}>
                    {simMetrics.served >= baselineMetrics.served ? 'Throughput Preserved' : 'Throughput Drop'}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">Average Waiting Time</td>
                <td className="py-3 px-3 text-center font-mono">{baselineMetrics.avgWait}m</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-[#60A5FA]">{simMetrics.avgWait}m</td>
                <td className="py-3 px-3 text-center font-mono">
                  {simMetrics.avgWait - baselineMetrics.avgWait > 0 ? `+${(simMetrics.avgWait - baselineMetrics.avgWait).toFixed(1)}m` : `${(simMetrics.avgWait - baselineMetrics.avgWait).toFixed(1)}m`}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${simMetrics.avgWait <= 18 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'}`}>
                    {simMetrics.avgWait <= 18 ? 'Within SLA' : 'SLA Breach (>18m)'}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">Remaining Unserved Backlog</td>
                <td className="py-3 px-3 text-center font-mono">{baselineMetrics.backlog} unserved</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">{simMetrics.backlog} unserved</td>
                <td className="py-3 px-3 text-center font-mono">
                  {simMetrics.backlog - baselineMetrics.backlog > 0 ? `+${simMetrics.backlog - baselineMetrics.backlog}` : '0'}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${simMetrics.backlog === 0 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-amber-950/60 text-amber-300'}`}>
                    {simMetrics.backlog === 0 ? 'Zero Backlog' : 'Carryover Risk'}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-[#F1F5F9] light:text-[#0F172A]">Physician Session Utilization</td>
                <td className="py-3 px-3 text-center font-mono">{baselineMetrics.utilPct}%</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{simMetrics.utilPct}%</td>
                <td className="py-3 px-3 text-center font-mono">
                  {simMetrics.utilPct - baselineMetrics.utilPct >= 0 ? `+${simMetrics.utilPct - baselineMetrics.utilPct}%` : `${simMetrics.utilPct - baselineMetrics.utilPct}%`}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-[11px] font-bold text-[#94A3B8]">
                    {simMetrics.utilPct > 95 ? 'High Burnout Strain' : 'Sustainable Pacing'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulation Dynamics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Hourly Backlog Trajectory */}
        <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] light:border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">
                Hourly Queue Backlog Trajectory (Baseline vs Scenario)
              </h3>
              <p className="text-[11px] text-[#94A3B8] light:text-[#64748B]">
                Active waiting queue size across clinical hours 09:00 to 16:00.
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#1B263D] text-[#60A5FA]">
              Peak: {simMetrics.peakQueue} queued
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyQueueCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="simQueueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="time" stroke={chartColors.text} fontSize={11} />
                <YAxis stroke={chartColors.text} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderRadius: '8px',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="simulatedQueue" name="Simulated Scenario Queue" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#simQueueGrad)" />
                <Line type="monotone" dataKey="baselineQueue" name="Baseline Normal Queue" stroke="#60A5FA" strokeWidth={2} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hourly Waiting Time Curve */}
        <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] light:border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">
                Predicted Queue Dwell Minutes Trajectory
              </h3>
              <p className="text-[11px] text-[#94A3B8] light:text-[#64748B]">
                Average wait time experienced by patients arriving at each clinic hour.
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#1B263D] text-[#93C5FD]">
              Max: {simMetrics.maxWait}m
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyQueueCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="time" stroke={chartColors.text} fontSize={11} />
                <YAxis stroke={chartColors.text} fontSize={11} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderRadius: '8px',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="simulatedWait" name="Scenario Wait Time (m)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="baselineWait" name="Baseline Wait Time (m)" stroke="#10B981" strokeWidth={2} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actionable Clinical Recommendations & Bottleneck Summary */}
      <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E293B] light:border-[#E2E8F0]">
          <Sparkles className="w-4 h-4 text-[#60A5FA] light:text-[#2563EB]" />
          <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">
            Digital Twin Decision-Support Recommendations & Bottlenecks
          </h3>
        </div>

        <div className="space-y-2">
          {operationalRecommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#F1F5F9] light:text-[#0F172A]"
            >
              <ArrowRight className="w-3.5 h-3.5 text-[#60A5FA] light:text-[#2563EB] shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinSimulator;
