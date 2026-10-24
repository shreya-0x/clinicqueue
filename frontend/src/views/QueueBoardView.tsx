import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { QueueEntry, Doctor } from '../types';
import { Activity, Clock, CheckCircle2, UserCheck, Stethoscope, RefreshCw, Volume2 } from 'lucide-react';

export const QueueBoardView: React.FC = () => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchBoard = async () => {
    try {
      const [queueRes, docsRes] = await Promise.all([
        api.getQueue({ organization_id: 'org-metrocare-01' }),
        api.getDoctors({ organization_id: 'org-metrocare-01' })
      ]);
      setQueue(queueRes.queue || []);
      setDoctors(docsRes.doctors || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 5000); // 5s fast polling for TV board
    return () => clearInterval(interval);
  }, []);

  const inConsultationEntries = queue.filter((q) => q.status === 'in_consultation');
  const waitingEntries = queue.filter((q) => q.status === 'checked_in' || q.status === 'waiting');

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Top Board Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 text-slate-950 flex items-center justify-center font-black">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h1 className="text-2xl font-black tracking-tight uppercase">
                  MetroCare Apex • Outpatient Live Queue Board
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Real-Time Waiting Room Display • Automatic Refresh: {lastRefreshed.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
              <span className="text-brand-400 font-bold">{inConsultationEntries.length}</span>
              <span className="text-slate-300">Rooms Active</span>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">{waitingEntries.length}</span>
              <span className="text-slate-300">Patients Waiting</span>
            </div>
          </div>
        </div>

        {/* Current In-Consultation Rooms Grid */}
        <div className="mb-10">
          <div className="text-xs uppercase font-extrabold text-brand-400 tracking-wider mb-4 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" />
            <span>Currently Serving (Proceed to Room)</span>
          </div>

          {inConsultationEntries.length === 0 ? (
            <div className="bg-slate-800/60 rounded-2xl p-8 text-center text-slate-500 border border-slate-800">
              Doctors are currently preparing for the next consultation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inConsultationEntries.map((c) => (
                <div
                  key={c._id}
                  className="bg-gradient-to-br from-brand-950 to-slate-800 rounded-2xl p-6 border-2 border-brand-500 shadow-xl relative overflow-hidden animate-pulse"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-brand-300 tracking-wider">
                        Room 101 • {c.department_name}
                      </span>
                      <h3 className="text-xl font-black text-white mt-1">{c.patient_name}</h3>
                      <p className="text-xs text-brand-200 mt-0.5">{c.doctor_name}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-brand-400 text-slate-950 uppercase tracking-wide">
                      In Room
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next in Line Queue Table */}
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-4">
            <h2 className="text-lg font-extrabold text-white">Upcoming Queue Order</h2>
            <span className="text-xs text-slate-400">Position dynamically calibrated by Adaptive Engine</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Queue Pos</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Assigned Doctor</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Priority Status</th>
                  <th className="py-3 px-4 text-right">Estimated Wait</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {waitingEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Waiting queue is clear.
                    </td>
                  </tr>
                ) : (
                  waitingEntries.map((w, idx) => (
                    <tr key={w._id} className="hover:bg-slate-700/40 transition-colors">
                      <td className="py-4 px-4 font-black text-brand-400 text-lg">#{idx + 1}</td>
                      <td className="py-4 px-4 font-bold text-white text-base">{w.patient_name}</td>
                      <td className="py-4 px-4 text-slate-300 font-medium">{w.doctor_name}</td>
                      <td className="py-4 px-4 text-slate-400">{w.department_name}</td>
                      <td className="py-4 px-4">
                        {w.priority_flags?.length ? (
                          <div className="flex gap-1">
                            {w.priority_flags.map((f, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Standard</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-emerald-400 text-lg">
                        ~{w.predicted_wait_minutes || 14}m
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
