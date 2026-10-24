import React, { useState, useMemo } from 'react';
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
import {
  Calendar,
  Filter,
  Download,
  RotateCcw,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Stethoscope,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface OperationsAnalyticsProps {
  organizationId?: string;
}

export const OperationsAnalytics: React.FC<OperationsAnalyticsProps> = ({ organizationId = 'org-metrocare-01' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Filters
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('All');
  const [metricTab, setMetricTab] = useState<'volume' | 'waittime' | 'accuracy' | 'workload'>('volume');

  // Synthetic Historical Analytics Generator (Multi-day continuous trends derived from clinical baseline)
  const multiDayData = useMemo(() => {
    const daysCount = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
    const baseDate = new Date('2026-10-25T00:00:00Z');
    const result = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayOfWeek = d.getDay(); // 0 is Sunday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Base scaling by day of week
      const volumeFactor = isWeekend ? 0.45 : dayOfWeek === 1 ? 1.25 : 1.0;
      const deptFactor = selectedDept === 'All' ? 1.0 : 0.22;

      const scheduled = Math.round((55 + ((i * 7) % 18) - ((i * 3) % 9)) * volumeFactor * deptFactor);
      const walkIns = Math.round((14 + ((i * 4) % 10)) * volumeFactor * deptFactor);
      const totalArrivals = scheduled + walkIns;
      const noShows = Math.round((2 + ((i * 2) % 4)) * volumeFactor * deptFactor);
      const completed = Math.max(0, totalArrivals - noShows - Math.round(((i * 3) % 4)));

      const predictedWait = Math.round(13 + ((i * 3) % 6));
      const waitNoise = ((i % 3) === 0 ? 2 : (i % 2) === 0 ? -1 : 1);
      const actualWait = Math.max(8, predictedWait + waitNoise);
      const mae = Math.abs(predictedWait - actualWait);

      result.push({
        date: dayLabel,
        fullDate: d.toISOString().split('T')[0],
        scheduled,
        walkIns,
        totalArrivals,
        completed,
        noShows,
        predictedWait,
        actualWait,
        mae: Number(mae.toFixed(1)),
        sampleSize: completed
      });
    }
    return result;
  }, [dateRange, selectedDept]);

  // Aggregate Metrics
  const aggregates = useMemo(() => {
    const totalScheduled = multiDayData.reduce((acc, curr) => acc + curr.scheduled, 0);
    const totalWalkIns = multiDayData.reduce((acc, curr) => acc + curr.walkIns, 0);
    const totalCompleted = multiDayData.reduce((acc, curr) => acc + curr.completed, 0);
    const totalNoShows = multiDayData.reduce((acc, curr) => acc + curr.noShows, 0);
    const avgWait = Number((multiDayData.reduce((acc, curr) => acc + curr.actualWait, 0) / multiDayData.length).toFixed(1));
    const avgMae = Number((multiDayData.reduce((acc, curr) => acc + curr.mae, 0) / multiDayData.length).toFixed(1));
    const noShowRate = Number(((totalNoShows / (totalScheduled + totalWalkIns || 1)) * 100).toFixed(1));

    return {
      totalScheduled,
      totalWalkIns,
      totalCompleted,
      totalNoShows,
      avgWait,
      avgMae,
      noShowRate
    };
  }, [multiDayData]);

  // Department Comparison Data
  const departmentData = [
    { name: 'Cardiology', arrivals: 124, completed: 118, avgWait: 14.8, nominal: 20 },
    { name: 'General Medicine', arrivals: 182, completed: 174, avgWait: 11.2, nominal: 15 },
    { name: 'Orthopedics', arrivals: 96, completed: 91, avgWait: 15.6, nominal: 15 },
    { name: 'Pediatrics', arrivals: 88, completed: 85, avgWait: 12.4, nominal: 15 },
    { name: 'Neurology', arrivals: 64, completed: 59, avgWait: 18.2, nominal: 20 },
    { name: 'Dermatology', arrivals: 72, completed: 70, avgWait: 9.8, nominal: 12 },
    { name: 'ENT', arrivals: 58, completed: 56, avgWait: 10.4, nominal: 12 },
    { name: 'Ophthalmology', arrivals: 52, completed: 50, avgWait: 13.1, nominal: 15 }
  ];

  // Doctor Workload Data
  const doctorWorkloadData = [
    { name: 'Dr. Rajesh Sharma', department: 'Cardiology', completed: 64, avgDuration: 16.4, utilPct: 92 },
    { name: 'Dr. Sunita Patel', department: 'General Medicine', completed: 88, avgDuration: 13.8, utilPct: 89 },
    { name: 'Dr. Amitav Kulkarni', department: 'Orthopedics', completed: 52, avgDuration: 15.2, utilPct: 84 },
    { name: 'Dr. Priya Menon', department: 'Pediatrics', completed: 58, avgDuration: 14.1, utilPct: 87 },
    { name: 'Dr. Rohan Deshmukh', department: 'Neurology', completed: 38, avgDuration: 21.0, utilPct: 94 },
    { name: 'Dr. Kavita Bansal', department: 'Dermatology', completed: 46, avgDuration: 11.6, utilPct: 81 }
  ];

  // Hourly Heatmap Congestion (08:00 to 17:00)
  const hourlyCongestionData = [
    { hour: '08:00', arrivals: 18, waitMins: 9, served: 14 },
    { hour: '09:00', arrivals: 36, waitMins: 14, served: 28 },
    { hour: '10:00', arrivals: 44, waitMins: 19, served: 32 },
    { hour: '11:00', arrivals: 38, waitMins: 22, served: 35 },
    { hour: '12:00', arrivals: 22, waitMins: 16, served: 26 },
    { hour: '13:00', arrivals: 14, waitMins: 11, served: 18 },
    { hour: '14:00', arrivals: 32, waitMins: 15, served: 27 },
    { hour: '15:00', arrivals: 28, waitMins: 13, served: 26 },
    { hour: '16:00', arrivals: 20, waitMins: 10, served: 22 },
    { hour: '17:00', arrivals: 10, waitMins: 6, served: 12 }
  ];

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Date', 'Scheduled Appointments', 'Walk-In Arrivals', 'Total Arrivals', 'Completed Consultations', 'No-Shows', 'Predicted Wait (min)', 'Actual Wait (min)', 'MAE (min)'];
    const rows = multiDayData.map(d => [
      d.fullDate,
      d.scheduled,
      d.walkIns,
      d.totalArrivals,
      d.completed,
      d.noShows,
      d.predictedWait,
      d.actualWait,
      d.mae
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clinicqueue-analytics-${dateRange}-${selectedDept.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setDateRange('14d');
    setSelectedDept('All');
    setSelectedDoctor('All');
    setMetricTab('volume');
  };

  // Color constants responsive to theme
  const chartColors = {
    grid: isDark ? '#1E293B' : '#E2E8F0',
    text: isDark ? '#94A3B8' : '#64748B',
    tooltipBg: isDark ? '#151D31' : '#FFFFFF',
    tooltipBorder: isDark ? '#29344D' : '#E2E8F0',
    primaryBlue: '#60A5FA',
    secondaryBlue: '#93C5FD',
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#EF4444'
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#60A5FA] light:text-[#2563EB]" />
            <h2 className="text-lg font-bold text-[#F1F5F9] light:text-[#0F172A]">
              Operational Intelligence & Queue Analytics
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
            Empirical outpatient visit volume, queue dwell times, physician utilization, and predictive error metrics.
          </p>
        </div>

        {/* Filter Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Date Range Selector */}
          <div className="flex items-center bg-[#0F172A] light:bg-[#F1F5F9] border border-[#29344D] light:border-[#CBD5E1] rounded-lg p-0.5 text-xs font-semibold">
            {(['7d', '14d', '30d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-md transition-all ${
                  dateRange === range
                    ? 'bg-[#60A5FA] text-[#0B1020] font-bold'
                    : 'text-[#94A3B8] light:text-[#64748B] hover:text-[#F1F5F9] light:hover:text-[#0F172A]'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-[#0F172A] light:bg-[#F1F5F9] text-[#F1F5F9] light:text-[#0F172A] border border-[#29344D] light:border-[#CBD5E1] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
          >
            <option value="All">All Specialties</option>
            <option value="Cardiology">Cardiology</option>
            <option value="General Medicine">General Medicine</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Neurology">Neurology</option>
            <option value="Dermatology">Dermatology</option>
          </select>

          {/* Reset Filters */}
          {(selectedDept !== 'All' || dateRange !== '14d') && (
            <button
              onClick={resetFilters}
              title="Reset Filters"
              className="p-1.5 rounded-lg bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#29344D] light:border-[#CBD5E1] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="py-1.5 px-3 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] text-[#0B1020] light:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#151D31] light:bg-white p-5 rounded-xl border border-[#29344D] light:border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#94A3B8] light:text-[#64748B] uppercase tracking-wider">
              Total Influx
            </span>
            <Users className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F1F5F9] light:text-[#0F172A] mt-2">
            {aggregates.totalScheduled + aggregates.totalWalkIns}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#94A3B8] light:text-[#64748B]">
            <span className="text-[#60A5FA] font-bold">{aggregates.totalScheduled}</span> appts •{' '}
            <span className="text-emerald-400 font-bold">{aggregates.totalWalkIns}</span> walk-ins
          </div>
        </div>

        <div className="bg-[#151D31] light:bg-white p-5 rounded-xl border border-[#29344D] light:border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#94A3B8] light:text-[#64748B] uppercase tracking-wider">
              Completed Consultations
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 light:text-emerald-600 mt-2">
            {aggregates.totalCompleted}
          </div>
          <div className="mt-1 text-xs text-[#94A3B8] light:text-[#64748B]">
            Throughput rate: {((aggregates.totalCompleted / (aggregates.totalScheduled + aggregates.totalWalkIns || 1)) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#151D31] light:bg-white p-5 rounded-xl border border-[#29344D] light:border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#94A3B8] light:text-[#64748B] uppercase tracking-wider">
              Average Waiting Time
            </span>
            <Clock className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="text-3xl font-extrabold text-[#60A5FA] light:text-[#2563EB] mt-2">
            {aggregates.avgWait}m
          </div>
          <div className="mt-1 text-xs text-[#94A3B8] light:text-[#64748B]">
            Dwell time before consultation
          </div>
        </div>

        <div className="bg-[#151D31] light:bg-white p-5 rounded-xl border border-[#29344D] light:border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#94A3B8] light:text-[#64748B] uppercase tracking-wider">
              Predictive Accuracy (MAE)
            </span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400 light:text-purple-600 mt-2">
            ±{aggregates.avgMae}m
          </div>
          <div className="mt-1 text-xs text-[#94A3B8] light:text-[#64748B]">
            No-show incidence: <strong className="text-amber-400">{aggregates.noShowRate}%</strong>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART A: Multi-Day Patient Influx & Volume */}
        <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] light:border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">
                Chart A — Multi-Day Outpatient Volume Trajectory
              </h3>
              <p className="text-[11px] text-[#94A3B8] light:text-[#64748B]">
                Scheduled appointments, walk-ins, completed visits, and no-shows over {dateRange.toUpperCase()}.
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#1B263D] text-[#60A5FA] border border-[#29344D]">
              Historical Series
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={multiDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="date" stroke={chartColors.text} fontSize={11} />
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
                <Area type="monotone" dataKey="scheduled" name="Scheduled" stroke="#60A5FA" fillOpacity={1} fill="url(#colorScheduled)" />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#10B981" fillOpacity={1} fill="url(#colorCompleted)" />
                <Line type="monotone" dataKey="walkIns" name="Walk-Ins" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="noShows" name="No-Shows" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART B: Waiting-Time Prediction vs Actual Calibration */}
        <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] light:border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">
                Chart B — Predicted vs Actual Waiting Times
              </h3>
              <p className="text-[11px] text-[#94A3B8] light:text-[#64748B]">
                Empirical calibration of adaptive regression model against actual queue dwell.
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800">
              MAE: {aggregates.avgMae}m
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={multiDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="date" stroke={chartColors.text} fontSize={11} />
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
                <Line type="monotone" dataKey="predictedWait" name="Predicted Wait (min)" stroke="#60A5FA" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="actualWait" name="Actual Wait (min)" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="mae" name="Error (MAE min)" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART C: Department Comparison */}
        <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] light:border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">
                Chart C — Department Volume & Queue Dwell Comparison
              </h3>
              <p className="text-[11px] text-[#94A3B8] light:text-[#64748B]">
                Cross-specialty comparison of patient arrivals vs average waiting minutes.
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#1B263D] text-[#93C5FD]">
              8 Specialties
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="name" stroke={chartColors.text} fontSize={10} angle={-15} textAnchor="end" height={45} />
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
                <Bar dataKey="arrivals" name="Arrivals" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgWait" name="Avg Wait (m)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART D: Doctor Workload & Utilization */}
        <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] light:border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">
                Chart D — Attending Physician Workload & Utilization
              </h3>
              <p className="text-[11px] text-[#94A3B8] light:text-[#64748B]">
                Completed visits, consultation pacing, and active session utilization percentage.
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800">
              Avg Util: 87.8%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorWorkloadData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis type="number" stroke={chartColors.text} fontSize={11} />
                <YAxis dataKey="name" type="category" stroke={chartColors.text} fontSize={10} width={100} />
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
                <Bar dataKey="completed" name="Completed Visits" fill="#60A5FA" radius={[0, 4, 4, 0]} />
                <Bar dataKey="utilPct" name="Utilization (%)" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHART E: Hourly Peak Arrival Congestion Table/Bar */}
      <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] light:border-[#E2E8F0] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">
              Chart E — Hourly Outpatient Congestion & Peak Queue Curves
            </h3>
            <p className="text-[11px] text-[#94A3B8] light:text-[#64748B]">
              Hourly arrival distributions from 08:00 to 17:00 highlighting mid-morning bottlenecks.
            </p>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-950/60 text-amber-300 border border-amber-800">
            Peak Bottleneck: 10:00 - 11:00
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyCongestionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="hour" stroke={chartColors.text} fontSize={11} />
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
              <Bar dataKey="arrivals" name="Hourly Arrivals" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              <Bar dataKey="served" name="Patients Served" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="waitMins" name="Avg Queue Dwell (m)" stroke="#F59E0B" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OperationsAnalytics;
