import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { PredictionEvaluation, SimulationResult, AuditLog } from '../types';
import {
  ShieldCheck,
  LineChart as LineChartIcon,
  Sliders,
  Award,
  FileText,
  Clock,
  TrendingDown,
  Users,
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Database
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';

export const AdminView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Tabs: 'analytics' | 'simulator' | 'evaluation' | 'audit'
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState<'analytics' | 'simulator' | 'evaluation' | 'audit'>(
    (queryTab as any) || 'analytics'
  );

  // Analytics data
  const [analytics, setAnalytics] = useState<any>(null);

  // Prediction evaluation data
  const [evaluation, setEvaluation] = useState<PredictionEvaluation | null>(null);

  // Digital Twin Simulator state
  const [presets, setPresets] = useState<Record<string, any>>({});
  const [selectedPreset, setSelectedPreset] = useState<string>('normal_day');
  const [simParams, setSimParams] = useState({
    num_appointments: 30,
    walk_in_rate_pct: 15,
    duration_variance_pct: 20,
    num_doctors: 2,
    base_consultation_minutes: 15,
    break_duration_minutes: 30,
    late_arrival_rate_pct: 10,
    no_show_rate_pct: 8,
    doctor_delay_minutes: 0
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, evalRes, presetsRes, auditRes] = await Promise.all([
        api.getAnalyticsDashboard(user?.organization_id || 'org-metrocare-01'),
        api.getPredictionEvaluation(user?.organization_id || 'org-metrocare-01'),
        api.getSimulationPresets(),
        api.getAuditLogs()
      ]);
      setAnalytics(analyticsRes);
      setEvaluation(evalRes.evaluation || null);
      setPresets(presetsRes.presets || {});
      setAuditLogs(auditRes.audit_logs || []);

      // Run initial simulation with normal_day
      const initialSim = await api.runSimulation({ scenario: 'normal_day' });
      setSimulationResult(initialSim.simulation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const p = presets[presetKey];
    if (p && p.params) {
      setSimParams(p.params);
    }
  };

  const handleRunSimulation = async () => {
    setSimRunning(true);
    try {
      const res = await api.runSimulation({
        scenario: selectedPreset,
        parameters: simParams,
        seed: Math.floor(Math.random() * 1000)
      });
      setSimulationResult(res.simulation);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-6 border border-[#343347] light:border-[#DDD9E9] shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hospital Operations & Strategy</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              MetroCare Apex Hospital • Leadership Console
            </h1>
            <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-0.5">
              Multi-department outpatient analytics, Digital Twin simulation, and empirical prediction accuracy validation.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-[#222233] light:bg-slate-100 p-1 rounded-xl border border-[#343347] light:border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Overview & Analytics
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeTab === 'simulator'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-brand-600" />
              <span>Digital Twin Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeTab === 'evaluation'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Model Evaluation</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'audit'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Audit Trail
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Outpatient Volume</div>
                <div className="text-3xl font-extrabold text-navy-900 mt-2">{analytics.kpis.total_appointments}</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">
                  {analytics.kpis.completed_consultations} Completed
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Wait Time</div>
                <div className="text-3xl font-extrabold text-navy-900 mt-2">{analytics.kpis.average_wait_minutes}m</div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Median: {analytics.kpis.median_wait_minutes}m
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doctor Utilization</div>
                <div className="text-3xl font-extrabold text-brand-700 mt-2">{analytics.kpis.doctor_utilization_pct}%</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Target range: 80% - 90%</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No-Show & Cancellation</div>
                <div className="text-3xl font-extrabold text-amber-600 mt-2">{analytics.kpis.no_show_rate_pct}%</div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Cancellations: {analytics.kpis.cancellation_rate_pct}%
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Distribution */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-navy-900 mb-1">Appointment Volume by Department</h3>
                <p className="text-xs text-slate-500 mb-6">Patient intake across top medical specialties.</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.by_department}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={40} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Congestion Curve by Hour */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-navy-900 mb-1">Queue Congestion by Hour of Day</h3>
                <p className="text-xs text-slate-500 mb-6">Average waiting patients and delay curve from 09:00 to 17:00.</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.hourly_congestion}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="avg_wait" name="Avg Wait (mins)" stroke="#0d9488" fill="#ccfbf1" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="patients" name="Patients Waiting" stroke="#1e293b" fill="#cbd5e1" fillOpacity={0.3} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIGITAL TWIN SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-8 animate-fade-in">
            {/* Scenario Chooser */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 mb-1">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Discrete Event Digital Twin</span>
                  </div>
                  <h2 className="text-lg font-bold text-navy-900">Virtual Clinic-Day Simulator</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Test operational interventions deterministically. Observe the cascading impact of surge walk-ins and doctor delays.
                  </p>
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={simRunning}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Play className={`w-3.5 h-3.5 ${simRunning ? 'animate-spin' : ''}`} />
                  <span>{simRunning ? 'Simulating Day...' : 'Execute Simulation'}</span>
                </button>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                {Object.entries(presets).map(([k, p]: any) => (
                  <button
                    key={k}
                    onClick={() => handlePresetSelect(k)}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      selectedPreset === k
                        ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-navy-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter Adjustment Sliders */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-navy-900 mb-4">Adjust Clinic Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Scheduled Appointments</span>
                    <span className="font-bold text-brand-700">{simParams.num_appointments}</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    value={simParams.num_appointments}
                    onChange={(e) => setSimParams({ ...simParams, num_appointments: Number(e.target.value) })}
                    className="w-full accent-brand-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Walk-In Surge Rate</span>
                    <span className="font-bold text-brand-700">{simParams.walk_in_rate_pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={simParams.walk_in_rate_pct}
                    onChange={(e) => setSimParams({ ...simParams, walk_in_rate_pct: Number(e.target.value) })}
                    className="w-full accent-brand-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Doctors on Duty</span>
                    <span className="font-bold text-brand-700">{simParams.num_doctors} Doctors</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={simParams.num_doctors}
                    onChange={(e) => setSimParams({ ...simParams, num_doctors: Number(e.target.value) })}
                    className="w-full accent-brand-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Doctor Emergency Delay</span>
                    <span className="font-bold text-amber-700">+{simParams.doctor_delay_minutes} mins</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={simParams.doctor_delay_minutes}
                    onChange={(e) => setSimParams({ ...simParams, doctor_delay_minutes: Number(e.target.value) })}
                    className="w-full accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Duration Variance</span>
                    <span className="font-bold text-brand-700">±{simParams.duration_variance_pct}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={simParams.duration_variance_pct}
                    onChange={(e) => setSimParams({ ...simParams, duration_variance_pct: Number(e.target.value) })}
                    className="w-full accent-brand-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Doctor Break Duration</span>
                    <span className="font-bold text-brand-700">{simParams.break_duration_minutes}m</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="5"
                    value={simParams.break_duration_minutes}
                    onChange={(e) => setSimParams({ ...simParams, break_duration_minutes: Number(e.target.value) })}
                    className="w-full accent-brand-600"
                  />
                </div>
              </div>
            </div>

            {/* Simulation Results Comparison */}
            {simulationResult && (
              <div className="bg-white rounded-2xl p-6 border border-brand-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 uppercase tracking-wide border border-brand-200">
                      Simulation Run Output
                    </span>
                    <h3 className="text-base font-bold text-navy-900 mt-1">Virtual Clinic Day Outcomes</h3>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Patients Served</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {simulationResult.results.patients_served} of {simulationResult.results.total_demand}
                    </div>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Average Wait</div>
                    <div className="text-2xl font-extrabold text-navy-900 mt-1">
                      {simulationResult.results.average_wait_minutes}m
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Median: {simulationResult.results.median_wait_minutes}m
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Max Wait Observed</div>
                    <div className="text-2xl font-extrabold text-amber-700 mt-1">
                      {simulationResult.results.max_wait_minutes}m
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      90th Percentile: {simulationResult.results.p90_wait_minutes}m
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Backlog (Unserved)</div>
                    <div className="text-2xl font-extrabold text-red-600 mt-1">
                      {simulationResult.results.unserved_backlog}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Remaining at 17:00</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Doctor Utilization</div>
                    <div className="text-2xl font-extrabold text-brand-700 mt-1">
                      {simulationResult.results.doctor_utilization_pct}%
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Active consult time</div>
                  </div>
                </div>

                {/* Hourly Congestion Timeline in Simulation */}
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulationResult.results.hourly_congestion}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="waiting" name="Waiting Queue Backlog" stroke="#0d9488" fill="#ccfbf1" fillOpacity={0.7} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MODEL EVALUATION */}
        {activeTab === 'evaluation' && evaluation && (
          <div className="space-y-8 animate-fade-in">
            {/* Model Comparison Banner */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs uppercase font-bold text-brand-600">Empirical Verification</span>
                  <h2 className="text-xl font-bold text-navy-900 mt-1">
                    Prediction Engine vs Fixed-Slot Baseline
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Calculated over {evaluation.sample_size} historical completed consultations with known check-in and start outcomes.
                  </p>
                </div>

                <div className="px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center shrink-0">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">MAE Improvement</div>
                  <div className="text-2xl font-extrabold text-emerald-900">
                    +{evaluation.improvement_pct}%
                  </div>
                </div>
              </div>

              {/* Head-to-Head Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-brand-900">ClinicQueue Adaptive Engine</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-600 text-white">Proposed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">Mean Absolute Error (MAE)</div>
                      <div className="text-3xl font-extrabold text-navy-900 mt-1">
                        {evaluation.adaptive_model.mae}m
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">Median Absolute Error</div>
                      <div className="text-3xl font-extrabold text-navy-900 mt-1">
                        {evaluation.adaptive_model.median_ae}m
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Uses remaining active consultation time, doctor-specific pacing medians, break buffers, and case weighting.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-700">Fixed-Slot Baseline (Queue Pos * 15m)</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">Baseline</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">Mean Absolute Error (MAE)</div>
                      <div className="text-3xl font-extrabold text-slate-600 mt-1">
                        {evaluation.baseline_model.mae}m
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">Median Absolute Error</div>
                      <div className="text-3xl font-extrabold text-slate-600 mt-1">
                        {evaluation.baseline_model.median_ae}m
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Traditional static estimation assuming uniform fixed appointment slots with zero delay awareness.
                  </p>
                </div>
              </div>
            </div>

            {/* Department Breakdown Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-navy-900 mb-1">Accuracy Breakdown by Specialty</h3>
              <p className="text-xs text-slate-500 mb-4">Sample size and MAE per department across historical evaluations.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Evaluated Samples</th>
                      <th className="py-3 px-4">Adaptive MAE</th>
                      <th className="py-3 px-4">Median Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evaluation.by_department.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-semibold text-navy-900">{d.department}</td>
                        <td className="py-3.5 px-4 text-slate-600">{d.samples} completed visits</td>
                        <td className="py-3.5 px-4 font-bold text-brand-700">{d.mae} mins</td>
                        <td className="py-3.5 px-4 text-slate-600">{d.median_ae} mins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-fade-in">
            <h3 className="text-sm font-bold text-navy-900 mb-1">Hospital Operational & Security Audit Trail</h3>
            <p className="text-xs text-slate-500 mb-4">
              Cryptographically timestamped audit log of all check-ins, consultations, priority overrides, and delays.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Actor ID</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.slice(0, 15).map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-navy-900 uppercase">{log.action}</td>
                      <td className="py-3 px-4 text-slate-700">{log.entity_type}</td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{log.user_id}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-sm">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
