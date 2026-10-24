import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Consultation, QueueEntry, Doctor } from '../types';
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  AlertTriangle,
  Play,
  Check,
  UserCheck,
  History,
  Activity,
  X,
  FileText,
  User,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export const DoctorView: React.FC = () => {
  const { user } = useAuth();
  const [activeConsult, setActiveConsult] = useState<Consultation | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [history, setHistory] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  // Complete consultation modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [customDuration, setCustomDuration] = useState<number>(18);
  const [actionLoading, setActionLoading] = useState(false);

  // Delay reporting modal
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMins, setDelayMins] = useState(15);
  const [delayReason, setDelayReason] = useState('Emergency clinical consultation');

  // Elapsed timer simulation for active consultation
  const [elapsedMinutes, setElapsedMinutes] = useState(8);

  const docId = user?.doctor_id || 'doc-mc-01';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activeRes, queueRes, docRes, histRes] = await Promise.all([
        api.getActiveConsultation(),
        api.getQueue({ doctor_id: docId }),
        api.getDoctor(docId),
        api.getConsultationHistory()
      ]);
      setActiveConsult(activeRes.consultation || null);
      setQueue(queueRes.queue || []);
      setDoctorProfile(docRes.doctor || null);
      setHistory(histRes.consultations || []);

      if (activeRes.consultation?.started_at) {
        const start = new Date(activeRes.consultation.started_at).getTime();
        const now = Date.now();
        const mins = Math.max(1, Math.round((now - start) / 60000));
        setElapsedMinutes(mins);
        setCustomDuration(mins);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStartConsultation = async (apptId: string) => {
    setActionLoading(true);
    try {
      await api.startConsultation(apptId);
      await fetchData();
    } catch (err: any) {
      alert(`Start consultation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsult) return;
    setActionLoading(true);
    try {
      await api.completeConsultation(activeConsult._id, clinicalNotes, Number(customDuration));
      setShowCompleteModal(false);
      setClinicalNotes('');
      await fetchData();
    } catch (err: any) {
      alert(`Failed to complete: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBreak = async () => {
    if (!doctorProfile) return;
    const nextState = !doctorProfile.is_on_break;
    try {
      await api.setDoctorBreak(docId, nextState, 20);
      await fetchData();
    } catch (err: any) {
      alert(`Break update failed: ${err.message}`);
    }
  };

  const handleReportDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.reportDoctorDelay(docId, Number(delayMins), delayReason);
      setShowDelayModal(false);
      await fetchData();
    } catch (err: any) {
      alert(`Delay report failed: ${err.message}`);
    }
  };

  const waitingPatients = queue.filter((q) => q.status === 'checked_in' || q.status === 'waiting');

  return (
    <div className="min-h-screen bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Doctor Header & Availability Bar */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-6 border border-[#343347] light:border-[#DDD9E9] shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] mb-1">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {doctorProfile?.name || 'Dr. Rajesh Sharma'} • {doctorProfile?.department_name || 'Cardiology'}
            </h1>
            <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-0.5">
              Room 101 • Qualifications: {doctorProfile?.qualifications || 'MD, DM (Cardiology), AIIMS'} • Pacing Benchmark: 18m / visit
            </p>
          </div>

          {/* Operational Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggleBreak}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                doctorProfile?.is_on_break
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-[#222233] light:bg-white hover:bg-[#29213D] text-[#F4F2FA] light:text-[#242033] border-[#343347] light:border-[#DDD9E9]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{doctorProfile?.is_on_break ? 'On Break (Resume Clinic)' : 'Take Break (20m)'}</span>
            </button>

            <button
              onClick={() => setShowDelayModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#222233] light:bg-white hover:bg-[#29213D] text-[#F4F2FA] light:text-[#242033] border border-[#343347] light:border-[#DDD9E9] flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Report Delay</span>
            </button>
          </div>
        </div>

        {/* Doctor Reported Delay Banner */}
        {Number(doctorProfile?.reported_delay_minutes || 0) > 0 && (
          <div className="bg-amber-950/40 border border-amber-700/60 text-amber-300 rounded-2xl p-4 mb-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Active delay reported: <strong>+{doctorProfile?.reported_delay_minutes} minutes</strong> ({doctorProfile?.delay_reason || 'Emergency round'}). Patient queue predictions automatically updated.
              </span>
            </div>
            <button
              onClick={async () => {
                await api.reportDoctorDelay(docId, 0, '');
                fetchData();
              }}
              className="text-amber-200 underline font-semibold"
            >
              Clear Delay
            </button>
          </div>
        )}

        {/* Active Consultation Room */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs mb-8 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1] mb-6">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${activeConsult ? 'bg-[#8B5CF6] animate-ping' : 'bg-[#817C95]'}`} />
              <h2 className="text-lg font-bold text-[#F4F2FA] light:text-[#242033]">Live Consultation Room</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              activeConsult
                ? 'bg-[#29213D] text-[#A78BFA] border border-[#8B5CF6]'
                : 'bg-[#222233] text-[#817C95]'
            }`}>
              {activeConsult ? 'Consultation In Progress' : 'Room Vacant'}
            </span>
          </div>

          {activeConsult ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A78BFA] tracking-wider">Current Patient</span>
                <h3 className="text-2xl font-extrabold text-[#F4F2FA] light:text-[#242033] mt-0.5">
                  {activeConsult.patient_name}
                </h3>
                <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-1">
                  Started at: {new Date(activeConsult.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Outpatient Cardiology Review
                </p>
              </div>

              {/* Timer & Complete Action */}
              <div className="flex items-center gap-4">
                <div className="bg-[#222233] light:bg-[#F0EFF7] px-4 py-3 rounded-xl border border-[#343347] light:border-[#DDD9E9] text-center">
                  <div className="text-[10px] uppercase font-bold text-[#817C95]">Elapsed Time</div>
                  <div className="text-2xl font-mono font-extrabold text-[#A78BFA] light:text-[#6D28D9]">
                    ~{elapsedMinutes}m
                  </div>
                </div>

                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Complete Consultation</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[#817C95]">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <h3 className="font-bold text-sm text-[#F4F2FA] light:text-[#242033]">Room is Currently Ready</h3>
              <p className="text-xs mt-1">Select the next eligible patient in the queue below to begin consultation.</p>
            </div>
          )}
        </div>

        {/* Assigned Daily Queue */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1] mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#F4F2FA] light:text-[#242033]">Assigned Waiting Queue</h2>
              <p className="text-xs text-[#AAA6BC] light:text-[#625D74]">
                Patients checked in and waiting for Dr. {doctorProfile?.name || 'Sharma'}.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#A78BFA]">
              {waitingPatients.length} Waiting
            </span>
          </div>

          {waitingPatients.length === 0 ? (
            <div className="py-8 text-center text-[#817C95] text-xs">
              No patients currently waiting in your assigned queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#222233] light:bg-[#F0EFF7] text-[#817C95] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Arrival Time</th>
                    <th className="py-3 px-4">Estimated Wait</th>
                    <th className="py-3 px-4">Priority Flags</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#29293A] light:divide-[#EAE7F1]">
                  {waitingPatients.map((p, idx) => (
                    <tr key={p._id} className="hover:bg-[#222233]/40 light:hover:bg-[#F0EFF7]/40">
                      <td className="py-3.5 px-4 font-extrabold text-[#A78BFA]">#{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#F4F2FA] light:text-[#242033]">{p.patient_name}</td>
                      <td className="py-3.5 px-4 text-[#AAA6BC]">
                        {p.check_in_time ? new Date(p.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30'}
                      </td>
                      <td className="py-3.5 px-4 text-[#AAA6BC]">
                        ~{p.predicted_wait_minutes || 14}m
                      </td>
                      <td className="py-3.5 px-4">
                        {p.priority_flags && p.priority_flags.length > 0 ? (
                          <div className="flex gap-1">
                            {p.priority_flags.map((flg, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#29213D] text-[#A78BFA] border border-[#343347] uppercase">
                                {flg}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#817C95] text-[11px]">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleStartConsultation(p.appointment_id)}
                          disabled={actionLoading || activeConsult !== null}
                          className="px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 ml-auto disabled:opacity-40"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Call In Patient</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Doctor Consultation History & Personal Analytics */}
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1] mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#F4F2FA] light:text-[#242033]">Personal Consultation History</h2>
              <p className="text-xs text-[#AAA6BC] light:text-[#625D74]">
                Completed visits, clinical duration records, and operational timestamps.
              </p>
            </div>
            <span className="text-xs text-[#817C95]">
              {history.length} Completed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#222233] light:bg-[#F0EFF7] text-[#817C95] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4">Completed At</th>
                  <th className="py-3 px-4">Recorded Duration</th>
                  <th className="py-3 px-4">Operational Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29293A] light:divide-[#EAE7F1]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#817C95]">
                      No completed consultations recorded in this session.
                    </td>
                  </tr>
                ) : (
                  history.slice(0, 10).map((h) => (
                    <tr key={h._id} className="hover:bg-[#222233]/40 light:hover:bg-[#F0EFF7]/40">
                      <td className="py-3.5 px-4 font-semibold text-[#F4F2FA] light:text-[#242033]">{h.patient_name}</td>
                      <td className="py-3.5 px-4 text-[#AAA6BC]">
                        {new Date(h.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-[#AAA6BC]">
                        {h.completed_at ? new Date(h.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#A78BFA]">
                        {h.duration_minutes || 18}m
                      </td>
                      <td className="py-3.5 px-4 text-[#AAA6BC] max-w-xs truncate">
                        {h.notes || 'Routine follow-up concluded.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Complete Consultation Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#343347] light:border-[#DDD9E9] text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1]">
                <h3 className="text-base font-bold text-[#F4F2FA] light:text-[#242033]">Conclude Outpatient Consultation</h3>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="p-1 rounded-lg text-[#817C95] hover:text-[#F4F2FA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteConsultation} className="mt-4 space-y-4">
                <div>
                  <label className="block font-semibold text-[#AAA6BC] mb-1">
                    Recorded Consultation Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                  />
                  <p className="text-[10px] text-[#817C95] mt-1">
                    Used to refine future adaptive wait-time prediction calibrations.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#AAA6BC] mb-1">
                    Non-Sensitive Operational Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. ECG review completed. Follow-up in 4 weeks."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2 rounded-xl text-[#AAA6BC] hover:bg-[#222233]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Finish & Release Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Delay Modal */}
        {showDelayModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1B1B28] light:bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#343347] light:border-[#DDD9E9] text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#29293A] light:border-[#EAE7F1]">
                <h3 className="text-base font-bold text-[#F4F2FA] light:text-[#242033]">Report Outpatient Clinic Delay</h3>
                <button
                  onClick={() => setShowDelayModal(false)}
                  className="p-1 rounded-lg text-[#817C95] hover:text-[#F4F2FA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleReportDelay} className="mt-4 space-y-4">
                <div>
                  <label className="block font-semibold text-[#AAA6BC] mb-1">
                    Expected Delay (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    step="5"
                    value={delayMins}
                    onChange={(e) => setDelayMins(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#AAA6BC] mb-1">
                    Reason for Delay
                  </label>
                  <input
                    type="text"
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    required
                    placeholder="e.g. Inpatient ICU emergency call"
                    className="w-full rounded-xl border border-[#343347] light:border-[#DDD9E9] p-2.5 bg-[#222233] light:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDelayModal(false)}
                    className="px-4 py-2 rounded-xl text-[#AAA6BC] hover:bg-[#222233]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                  >
                    Broadcast Delay Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
