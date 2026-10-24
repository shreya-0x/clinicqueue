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
  FileText
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
  const [delayReason, setDelayReason] = useState('Emergency ward consultation');

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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Doctor Header & Availability Bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 mb-1">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Clinician Console</span>
            </div>
            <h1 className="text-2xl font-bold text-navy-900">
              {doctorProfile?.name || 'Dr. Rajesh Sharma'} • {doctorProfile?.department_name || 'Cardiology'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Room 101 • Qualifications: {doctorProfile?.qualifications || 'MD, DM (Cardiology), AIIMS'} • Historical Median: 18m
            </p>
          </div>

          {/* Operational Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggleBreak}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                doctorProfile?.is_on_break
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{doctorProfile?.is_on_break ? 'On Break (Resume Clinic)' : 'Take Break (20m)'}</span>
            </button>

            <button
              onClick={() => setShowDelayModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Report Delay</span>
            </button>
          </div>
        </div>

        {/* Doctor Reported Delay Banner */}
        {Number(doctorProfile?.reported_delay_minutes || 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Active delay reported: <strong>+{doctorProfile?.reported_delay_minutes} minutes</strong> ({doctorProfile?.delay_reason || 'Emergency round'}). Patient predictions automatically adjusted.
              </span>
            </div>
            <button
              onClick={async () => {
                await api.reportDoctorDelay(docId, 0, '');
                fetchData();
              }}
              className="text-xs text-amber-800 underline font-semibold"
            >
              Clear Delay
            </button>
          </div>
        )}

        {/* Active Consultation Room */}
        <div className="bg-white rounded-2xl border border-brand-200 p-6 shadow-xs mb-8 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${activeConsult ? 'bg-purple-600 animate-ping' : 'bg-slate-300'}`} />
              <h2 className="text-lg font-bold text-navy-900">Current Consultation Room</h2>
            </div>

            {activeConsult && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                In Progress
              </span>
            )}
          </div>

          {activeConsult ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Patient Details</div>
                <div className="text-xl font-bold text-navy-900 mt-1">{activeConsult.patient_name}</div>
                <div className="text-xs text-slate-500 mt-0.5">Specialty: {activeConsult.department_name}</div>
                {activeConsult.notes && (
                  <div className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {activeConsult.notes}
                  </div>
                )}
              </div>

              <div className="text-center md:border-x border-slate-100 py-2">
                <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Elapsed Consultation Time</div>
                <div className="text-3xl font-extrabold text-navy-900 mt-1">{elapsedMinutes}m</div>
                <p className="text-[11px] text-slate-500 mt-1">Target Duration: ~18 mins</p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Consultation</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-navy-900">No Patient Currently in Consultation</h3>
              <p className="text-xs text-slate-500 mt-1">
                Call the next eligible waiting patient from the queue below to begin examination.
              </p>
            </div>
          )}
        </div>

        {/* Assigned Outpatient Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900">Assigned Waiting Queue</h2>
              <p className="text-xs text-slate-500">
                Patients eligible for consultation, sorted by clinical priority flags and arrival order.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
              {waitingPatients.length} Waiting
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Queue Pos</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Visit Type</th>
                  <th className="py-3 px-4">Priority Flags</th>
                  <th className="py-3 px-4">Predicted Wait</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No patients currently waiting in this doctor's queue.
                    </td>
                  </tr>
                ) : (
                  waitingPatients.map((p, idx) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-brand-700">#{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-navy-900">{p.patient_name}</td>
                      <td className="py-3.5 px-4 capitalize text-slate-600">{p.appointment_type.replace('_', ' ')}</td>
                      <td className="py-3.5 px-4">
                        {p.priority_flags?.length ? (
                          <div className="flex gap-1 flex-wrap">
                            {p.priority_flags.map((f, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-navy-900">
                        {p.predicted_wait_minutes || 14}m
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleStartConsultation(p.appointment_id)}
                          disabled={actionLoading || Boolean(activeConsult)}
                          className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ml-auto"
                          title={activeConsult ? 'Finish active consultation first' : 'Call into room'}
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Consultation</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900">Recent Completed Consultations</h2>
              <p className="text-xs text-slate-500">Historical duration logs recorded for prediction calibration.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Completed At</th>
                  <th className="py-3 px-4">Actual Duration</th>
                  <th className="py-3 px-4">Clinical Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.slice(0, 10).map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-navy-900">{h.patient_name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {h.completed_at ? new Date(h.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-navy-900">{h.duration_minutes || 18}m</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{h.notes || 'Vitals checked.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Complete Consultation Modal */}
        {showCompleteModal && activeConsult && (
          <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-navy-900">Complete Consultation</h3>
                <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteConsultation} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient</label>
                  <div className="font-bold text-sm text-navy-900">{activeConsult.patient_name}</div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Actual Consultation Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-navy-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Recorded duration feeds back into the adaptive prediction calibration engine.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Non-Sensitive Operational & Clinical Notes
                  </label>
                  <textarea
                    rows={3}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="e.g. ECG normal, prescribed beta-blockers, follow-up in 2 weeks..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-navy-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Finalize & Update Queue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Delay Modal */}
        {showDelayModal && (
          <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-navy-900">Report Operational Delay</h3>
                <button onClick={() => setShowDelayModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleReportDelay} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delay Duration</label>
                  <select
                    value={delayMins}
                    onChange={(e) => setDelayMins(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-navy-900"
                  >
                    <option value={10}>+10 Minutes</option>
                    <option value={15}>+15 Minutes</option>
                    <option value={20}>+20 Minutes</option>
                    <option value={30}>+30 Minutes</option>
                    <option value={45}>+45 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Delay</label>
                  <input
                    type="text"
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-navy-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDelayModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs"
                  >
                    Broadcast Delay to Waiting Queue
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
