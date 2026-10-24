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
    const interval = setInterval(fetchBoard, 5000); // 5s fast polling for TV display board
    return () => clearInterval(interval);
  }, []);

  const inConsultationEntries = queue.filter((q) => q.status === 'in_consultation');
  const waitingEntries = queue.filter((q) => q.status === 'checked_in' || q.status === 'waiting');

  return (
    <div className="min-h-screen bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] p-4 sm:p-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Top Board Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#343347] light:border-[#DDD9E9] gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center font-black shadow-md">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h1 className="text-2xl font-black tracking-tight uppercase">
                  MetroCare Apex • Outpatient Live Queue Board
                </h1>
              </div>
              <p className="text-xs text-[#AAA6BC] light:text-[#625D74]">
                Public Waiting Display • Auto Refresh: {lastRefreshed.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="bg-[#1B1B28] light:bg-white px-3 py-1.5 rounded-xl border border-[#343347] light:border-[#DDD9E9] flex items-center gap-2">
              <span className="text-[#A78BFA] font-bold">{inConsultationEntries.length}</span>
              <span className="text-[#AAA6BC] light:text-[#625D74]">Rooms In Progress</span>
            </div>
            <div className="bg-[#1B1B28] light:bg-white px-3 py-1.5 rounded-xl border border-[#343347] light:border-[#DDD9E9] flex items-center gap-2">
              <span className="text-emerald-400 font-bold">{waitingEntries.length}</span>
              <span className="text-[#AAA6BC] light:text-[#625D74]">Patients Waiting</span>
            </div>
          </div>
        </div>

        {/* Current In-Consultation Rooms Grid */}
        <div className="mb-10">
          <div className="text-xs uppercase font-extrabold text-[#A78BFA] tracking-wider mb-4 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" />
            <span>Now In Consultation (Proceed to Assigned Room)</span>
          </div>

          {inConsultationEntries.length === 0 ? (
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-8 text-center text-[#817C95] border border-[#343347] light:border-[#DDD9E9]">
              Physicians are currently reviewing charts or sanitizing rooms for the next consultation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inConsultationEntries.map((c) => (
                <div
                  key={c._id}
                  className="bg-gradient-to-br from-[#29213D] to-[#1B1B28] rounded-2xl p-6 border-2 border-[#8B5CF6] shadow-xl relative overflow-hidden animate-pulse"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#A78BFA] tracking-wider">
                        Room 101 • {c.department_name}
                      </span>
                      <h3 className="text-xl font-black text-[#F4F2FA] mt-1">{c.patient_name}</h3>
                      <p className="text-xs text-[#AAA6BC] mt-0.5">Dr. {c.doctor_name}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#8B5CF6] text-white uppercase tracking-wide">
                      In Room
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiting Queue Table */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1] mb-4">
            <h2 className="text-lg font-bold text-[#F4F2FA] light:text-[#242033]">Upcoming Queue Numbers</h2>
            <span className="text-xs text-[#AAA6BC] light:text-[#625D74]">Calibrated Adaptive Estimates</span>
          </div>

          {waitingEntries.length === 0 ? (
            <p className="text-center py-8 text-[#817C95] text-xs">Waiting area is clear. No active tickets.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {waitingEntries.map((w, idx) => (
                <div
                  key={w._id}
                  className="p-4 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-[#A78BFA] light:text-[#6D28D9]">
                      #{w.queue_position || idx + 1}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#817C95] bg-[#1B1B28] light:bg-white px-2 py-0.5 rounded">
                      Ref: {w.appointment_id.slice(-4).toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="font-bold text-sm text-[#F4F2FA] light:text-[#242033]">{w.patient_name}</div>
                    <div className="text-xs text-[#AAA6BC] light:text-[#625D74]">Dr. {w.doctor_name}</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#343347] light:border-[#DDD9E9] flex items-center justify-between text-xs font-semibold text-[#8B5CF6]">
                    <span>Estimated Wait:</span>
                    <span>~{w.predicted_wait_minutes || 14}m</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
