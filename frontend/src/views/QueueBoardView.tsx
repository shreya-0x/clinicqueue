import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { QueueEntry, Doctor } from '../types';
import { Activity, Clock, CheckCircle2, UserCheck, Stethoscope, RefreshCw, ArrowLeft } from 'lucide-react';

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
    const interval = setInterval(fetchBoard, 5000); // 5s fast polling for waiting room display
    return () => clearInterval(interval);
  }, []);

  const inConsultationEntries = queue.filter((q) => q.status === 'in_consultation');
  const waitingEntries = queue.filter((q) => q.status === 'checked_in' || q.status === 'waiting');

  return (
    <div className="min-h-screen bg-[#0B1020] light:bg-[#F8FAFC] text-[#F1F5F9] light:text-[#0F172A] p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-150">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Board Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-[#29344D] light:border-[#E2E8F0] gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] text-[#60A5FA] light:text-[#2563EB] hover:scale-105 transition-transform"
              title="Return to Portal Selection"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                  MetroCare Apex • Outpatient Live Queue Board
                </h1>
              </div>
              <p className="text-xs text-[#94A3B8] light:text-[#475569]">
                Privacy-Protected Waiting Area Display • Auto Refresh: {lastRefreshed.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="bg-[#151D31] light:bg-white px-3 py-1.5 rounded-lg border border-[#29344D] light:border-[#E2E8F0] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{inConsultationEntries.length} In Session</span>
            </div>
            <div className="bg-[#151D31] light:bg-white px-3 py-1.5 rounded-lg border border-[#29344D] light:border-[#E2E8F0] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
              <span>{waitingEntries.length} In Queue</span>
            </div>
          </div>
        </div>

        {/* Board Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* NOW SERVING (In Consultation) */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] light:border-[#E2E8F0] mb-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base font-bold uppercase tracking-wider text-emerald-400">
                  Now Serving (In Room)
                </h2>
              </div>
              <span className="text-xs text-[#94A3B8] font-mono">Active Sessions</span>
            </div>

            {inConsultationEntries.length === 0 ? (
              <div className="py-16 text-center text-[#64748B]">
                <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No active consultations in progress at this moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inConsultationEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 rounded-xl bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-black text-emerald-400">
                          QUEUE #{entry.queue_position}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800 uppercase font-bold">
                          In Room
                        </span>
                      </div>
                      <p className="text-xs text-[#F1F5F9] light:text-[#0F172A] font-semibold mt-1">
                        Patient: {entry.patient_name.split(' ')[0]} *** (Privacy Masked)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-[#F1F5F9] light:text-[#0F172A] block">
                        Dr. {entry.doctor_name}
                      </span>
                      <span className="text-[10px] text-[#60A5FA] font-medium">
                        {entry.department_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UP NEXT (Waiting in Line) */}
          <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] light:border-[#E2E8F0] mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#60A5FA]" />
                <h2 className="text-base font-bold uppercase tracking-wider text-[#60A5FA]">
                  Next In Queue
                </h2>
              </div>
              <span className="text-xs text-[#94A3B8] font-mono">Estimated Call Time</span>
            </div>

            {waitingEntries.length === 0 ? (
              <div className="py-16 text-center text-[#64748B]">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Queue is clear. No patients currently waiting.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {waitingEntries.map((entry, idx) => (
                  <div
                    key={entry._id}
                    className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] text-[#60A5FA] light:text-[#2563EB] font-mono font-bold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-[#F1F5F9] light:text-[#0F172A] block">
                          Patient: {entry.patient_name.split(' ')[0]} ***
                        </span>
                        <span className="text-[10px] text-[#94A3B8] light:text-[#64748B]">
                          Dr. {entry.doctor_name} ({entry.department_name})
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#60A5FA] block">
                        ~{entry.predicted_wait_minutes || (idx + 1) * 14}m wait
                      </span>
                      <span className="text-[9px] text-[#64748B] uppercase">Estimated</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueBoardView;