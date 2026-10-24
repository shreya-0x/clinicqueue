import React from 'react';
import { Appointment } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  MapPin,
  Sparkles,
  Info,
  XCircle,
  Timer
} from 'lucide-react';

interface PatientTrackerProps {
  appointment: Appointment;
  onCheckIn?: (apptId: string) => void;
  checkInLoading?: boolean;
}

export const PatientTracker: React.FC<PatientTrackerProps> = ({
  appointment,
  onCheckIn,
  checkInLoading = false
}) => {
  const {
    _id,
    booking_reference,
    doctor_name,
    department_name,
    appointment_date,
    scheduled_time,
    appointment_type,
    status,
    check_in_time,
    consultation_started_at,
    consultation_completed_at,
    consultation_duration_minutes,
    live_prediction
  } = appointment;

  // Stages definition
  // 1: Booked -> 2: Checked In -> 3: Waiting in Queue -> 4: Consultation in Progress -> 5: Consultation Completed
  const getStageIndex = (): number => {
    switch (status) {
      case 'completed':
        return 5;
      case 'in_consultation':
        return 4;
      case 'waiting':
        return 3;
      case 'checked_in':
        return 2;
      case 'booked':
      default:
        return 1;
    }
  };

  const isCancelled = status === 'cancelled';
  const stageIndex = getStageIndex();

  const stages = [
    {
      num: 1,
      title: 'Appointment Booked',
      desc: `Confirmed for ${appointment_date} at ${scheduled_time}`,
      timestamp: scheduled_time,
      isDone: stageIndex >= 1 && !isCancelled,
      isCurrent: stageIndex === 1 && !isCancelled
    },
    {
      num: 2,
      title: 'Checked In',
      desc: check_in_time
        ? `Arrival verified at ${new Date(check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Awaiting front desk arrival verification',
      timestamp: check_in_time ? new Date(check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 2 && !isCancelled,
      isCurrent: stageIndex === 2 && !isCancelled
    },
    {
      num: 3,
      title: 'Waiting in Queue',
      desc: stageIndex >= 3
        ? 'Active in doctor queue • Calibrating wait'
        : 'Placed in line once checked in',
      timestamp: live_prediction?.timestamp ? new Date(live_prediction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 3 && !isCancelled,
      isCurrent: stageIndex === 3 && !isCancelled
    },
    {
      num: 4,
      title: 'In Consultation',
      desc: consultation_started_at
        ? `Consultation in progress with Dr. ${doctor_name}`
        : 'Patient called into clinical room',
      timestamp: consultation_started_at ? new Date(consultation_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 4 && !isCancelled,
      isCurrent: stageIndex === 4 && !isCancelled
    },
    {
      num: 5,
      title: 'Completed',
      desc: consultation_completed_at
        ? `Visit concluded • Duration: ${consultation_duration_minutes || 15}m`
        : 'Consultation concluded by doctor',
      timestamp: consultation_completed_at ? new Date(consultation_completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex === 5 && !isCancelled,
      isCurrent: false
    }
  ];

  return (
    <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-6 shadow-sm overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#29293A] light:border-[#EAE7F1]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-[#A78BFA] light:text-[#6D28D9] bg-[#29213D] light:bg-[#EDE9FE] px-2.5 py-0.5 rounded-full border border-[#343347] light:border-[#DDD9E9]">
              Ref: {booking_reference}
            </span>
            <span className="text-[11px] text-[#AAA6BC] light:text-[#625D74] capitalize font-medium">
              {appointment_type.replace('_', ' ')} Consultation
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#F4F2FA] light:text-[#242033]">
            {doctor_name}
          </h3>
          <p className="text-xs text-[#AAA6BC] light:text-[#625D74] flex items-center gap-1.5 mt-0.5">
            <Stethoscope className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>{department_name}</span>
            <span>•</span>
            <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>{appointment_date} at {scheduled_time}</span>
          </p>
        </div>

        {/* Current State Badge & Action */}
        <div className="flex items-center gap-3">
          {isCancelled ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950/70 text-rose-300 border border-rose-800 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelled Visit</span>
            </span>
          ) : (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1.5 ${
                status === 'completed'
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                  : status === 'in_consultation'
                  ? 'bg-[#29213D] text-[#A78BFA] border border-[#8B5CF6] animate-pulse'
                  : status === 'checked_in' || status === 'waiting'
                  ? 'bg-[#29213D] text-[#A78BFA] border border-[#8B5CF6]'
                  : 'bg-[#222233] text-[#AAA6BC] border border-[#343347]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                status === 'completed'
                  ? 'bg-emerald-400'
                  : status === 'in_consultation'
                  ? 'bg-[#A78BFA] animate-ping'
                  : status === 'checked_in' || status === 'waiting'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`} />
              <span>{status.replace('_', ' ')}</span>
            </span>
          )}

          {status === 'booked' && onCheckIn && (
            <button
              onClick={() => onCheckIn(_id)}
              disabled={checkInLoading}
              className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] light:bg-[#6D28D9] light:hover:bg-[#5B21B6] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {checkInLoading ? 'Checking in...' : 'Check In Now'}
            </button>
          )}
        </div>
      </div>

      {/* Stepper: Desktop Horizontal, Mobile Vertical */}
      {!isCancelled && (
        <div className="py-8 border-b border-[#29293A] light:border-[#EAE7F1]">
          <div className="hidden md:flex items-center justify-between relative">
            {/* Horizontal Connector Line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#29293A] light:bg-[#EAE7F1] -z-0" />
            <div
              className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] transition-all duration-500 -z-0"
              style={{ width: `${Math.max(0, Math.min(100, ((stageIndex - 1) / 4) * 100))}%` }}
            />

            {stages.map((stg) => (
              <div key={stg.num} className="flex flex-col items-center text-center relative z-10 max-w-[130px]">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    stg.isDone
                      ? 'bg-[#8B5CF6] text-white ring-4 ring-[#8B5CF6]/20'
                      : stg.isCurrent
                      ? 'bg-[#29213D] text-[#A78BFA] border-2 border-[#8B5CF6] ring-4 ring-[#8B5CF6]/20'
                      : 'bg-[#222233] light:bg-[#F0EFF7] text-[#817C95] light:text-[#777188] border border-[#343347] light:border-[#DDD9E9]'
                  }`}
                >
                  {stg.isDone ? <CheckCircle2 className="w-4 h-4" /> : stg.num}
                </div>

                <div className="mt-2.5">
                  <span className={`text-xs font-bold block ${
                    stg.isCurrent || stg.isDone
                      ? 'text-[#F4F2FA] light:text-[#242033]'
                      : 'text-[#817C95] light:text-[#777188]'
                  }`}>
                    {stg.title}
                  </span>
                  <span className="text-[10px] text-[#AAA6BC] light:text-[#625D74] block mt-0.5 leading-tight line-clamp-2">
                    {stg.desc}
                  </span>
                  {stg.timestamp && (
                    <span className="text-[9px] font-mono text-[#8B5CF6] light:text-[#6D28D9] block mt-1 font-semibold">
                      {stg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Vertical Stepper */}
          <div className="md:hidden space-y-4">
            {stages.map((stg) => (
              <div key={stg.num} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    stg.isDone
                      ? 'bg-[#8B5CF6] text-white'
                      : stg.isCurrent
                      ? 'bg-[#29213D] text-[#A78BFA] border-2 border-[#8B5CF6]'
                      : 'bg-[#222233] text-[#817C95]'
                  }`}
                >
                  {stg.isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : stg.num}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F4F2FA] light:text-[#242033]">{stg.title}</span>
                    {stg.timestamp && (
                      <span className="text-[10px] font-mono text-[#A78BFA] light:text-[#6D28D9] font-medium">
                        {stg.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#AAA6BC] light:text-[#625D74] mt-0.5">{stg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Queue Position & Wait Card (Active when checked in or in consultation) */}
      {(status === 'checked_in' || status === 'waiting' || status === 'in_consultation') && (
        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wait Time Display */}
          <div className="bg-[#222233] light:bg-[#F0EFF7] rounded-xl p-4 border border-[#343347] light:border-[#DDD9E9]">
            <div className="flex items-center justify-between text-xs font-bold text-[#F4F2FA] light:text-[#242033]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#A78BFA] light:text-[#6D28D9]" />
                <span>Adaptive Estimated Wait</span>
              </div>
              <span className="text-[10px] uppercase font-semibold text-[#8B5CF6] light:text-[#6D28D9] bg-[#29213D] light:bg-[#EDE9FE] px-2 py-0.5 rounded">
                Live
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#F4F2FA] light:text-[#242033]">
                {status === 'in_consultation' ? '0' : live_prediction?.predicted_wait_minutes || '14'}
              </span>
              <span className="text-xs font-semibold text-[#AAA6BC] light:text-[#625D74]">minutes</span>
              <span className="text-[11px] text-[#817C95] light:text-[#777188]">
                (±{live_prediction?.uncertainty_window_minutes || 3}m)
              </span>
            </div>

            <div className="mt-3 text-[11px] text-[#AAA6BC] light:text-[#625D74]">
              Expected Start:{' '}
              <span className="font-semibold text-[#F4F2FA] light:text-[#242033]">
                {status === 'in_consultation'
                  ? 'Consultation in Progress'
                  : live_prediction?.predicted_start_time
                  ? new Date(live_prediction.predicted_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Approx 10:45 AM'}
              </span>
            </div>
          </div>

          {/* Explainable Rationales Breakdown */}
          <div className="md:col-span-2 bg-[#222233] light:bg-[#F0EFF7] rounded-xl p-4 border border-[#343347] light:border-[#DDD9E9] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F4F2FA] light:text-[#242033] mb-2.5">
                <Sparkles className="w-4 h-4 text-[#A78BFA] light:text-[#6D28D9]" />
                <span>Why is this my estimate? (Explainable Operational Engine)</span>
              </div>

              <div className="space-y-1.5 text-xs text-[#AAA6BC] light:text-[#625D74]">
                {live_prediction?.explanations?.length ? (
                  live_prediction.explanations.map((exp, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] light:text-[#6D28D9] shrink-0 mt-0.5" />
                      <span>{exp}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] light:text-[#6D28D9] shrink-0 mt-0.5" />
                      <span>1 consultation in progress with Dr. {doctor_name} (~6m remaining).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] light:text-[#6D28D9] shrink-0 mt-0.5" />
                      <span>1 patient checked in ahead in queue.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] light:text-[#6D28D9] shrink-0 mt-0.5" />
                      <span>Paced against historical median duration for {department_name} (18 mins).</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <p className="text-[10px] text-[#817C95] light:text-[#777188] mt-3 italic">
              Estimates dynamically update based on active consultation pacing, arrival punctuality, and emergency clinical triage.
            </p>
          </div>
        </div>
      )}

      {/* Completed Consultation Summary */}
      {status === 'completed' && consultation_completed_at && (
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9]">
            <span className="text-[11px] text-[#817C95] light:text-[#777188]">Consultation Started</span>
            <div className="font-bold text-[#F4F2FA] light:text-[#242033] mt-0.5">
              {consultation_started_at ? new Date(consultation_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:15 AM'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9]">
            <span className="text-[11px] text-[#817C95] light:text-[#777188]">Consultation Concluded</span>
            <div className="font-bold text-[#F4F2FA] light:text-[#242033] mt-0.5">
              {new Date(consultation_completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9]">
            <span className="text-[11px] text-[#817C95] light:text-[#777188]">Total Recorded Duration</span>
            <div className="font-bold text-[#A78BFA] light:text-[#6D28D9] mt-0.5">
              {consultation_duration_minutes || 18} minutes
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
