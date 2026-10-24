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
  Timer,
  Check
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

  const stageIndex = getStageIndex();
  const isCancelled = status === 'cancelled';

  const stages = [
    {
      num: 1,
      title: 'Appointment Booked',
      desc: `Scheduled for ${scheduled_time}`,
      timestamp: appointment.created_at ? new Date(appointment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 1 && !isCancelled,
      isCurrent: stageIndex === 1 && !isCancelled
    },
    {
      num: 2,
      title: 'Checked In',
      desc: check_in_time ? 'Arrival verified at reception desk' : 'Ready to check in on arrival',
      timestamp: check_in_time ? new Date(check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 2 && !isCancelled,
      isCurrent: stageIndex === 2 && !isCancelled
    },
    {
      num: 3,
      title: 'Waiting in Queue',
      desc: live_prediction
        ? `Queue #${live_prediction.queue_position} • ~${live_prediction.estimated_wait_minutes}m wait`
        : 'In waiting area',
      isDone: stageIndex >= 3 && !isCancelled,
      isCurrent: stageIndex === 3 && !isCancelled
    },
    {
      num: 4,
      title: 'In Consultation',
      desc: consultation_started_at
        ? `In session with ${doctor_name}`
        : 'Consultation with physician',
      timestamp: consultation_started_at ? new Date(consultation_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 4 && !isCancelled,
      isCurrent: stageIndex === 4 && !isCancelled
    },
    {
      num: 5,
      title: 'Completed',
      desc: consultation_completed_at
        ? `Visit concluded • Duration: ${consultation_duration_minutes || 15}m`
        : 'Consultation concluded by physician',
      timestamp: consultation_completed_at ? new Date(consultation_completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex === 5 && !isCancelled,
      isCurrent: false
    }
  ];

  return (
    <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-5 sm:p-6 shadow-sm overflow-hidden transition-colors">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-[#1E293B] light:border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-[#60A5FA] light:text-[#2563EB] bg-[#0F172A] light:bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#29344D] light:border-[#BFDBFE]">
              Ref: {booking_reference}
            </span>
            <span className="text-[11px] text-[#94A3B8] light:text-[#475569] capitalize font-medium">
              {appointment_type.replace('_', ' ')} Consultation
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#F1F5F9] light:text-[#0F172A]">
            {doctor_name}
          </h3>
          <p className="text-xs text-[#94A3B8] light:text-[#475569] flex items-center gap-1.5 mt-0.5">
            <Stethoscope className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>{department_name}</span>
            <span>•</span>
            <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>{appointment_date} at {scheduled_time}</span>
          </p>
        </div>

        {/* Current State Badge & Action */}
        <div className="flex items-center gap-2.5">
          {isCancelled ? (
            <span className="px-3 py-1 rounded-md text-xs font-bold bg-red-950/60 text-red-300 border border-red-800 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelled Visit</span>
            </span>
          ) : (
            <span
              className={`px-3 py-1 rounded-md text-xs font-bold capitalize flex items-center gap-1.5 ${
                status === 'completed'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : status === 'in_consultation'
                  ? 'bg-[#1B263D] text-[#60A5FA] border border-[#60A5FA] animate-pulse'
                  : status === 'waiting' || status === 'checked_in'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                  : 'bg-[#0F172A] light:bg-[#F1F5F9] text-[#94A3B8] light:text-[#475569] border border-[#29344D] light:border-[#E2E8F0]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{status.replace('_', ' ')}</span>
            </span>
          )}

          {/* Check-In CTA Button if Booked */}
          {status === 'booked' && onCheckIn && (
            <button
              onClick={() => onCheckIn(_id)}
              disabled={checkInLoading}
              className="px-3.5 py-1.5 rounded-md bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] disabled:opacity-50 text-[#0B1020] light:text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {checkInLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Check In Now</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 5-Stage Visual Stepper Timeline */}
      <div className="py-6">
        <div className="relative">
          {/* Progress Bar Line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#1E293B] light:bg-[#E2E8F0] -z-0">
            <div
              className="h-full bg-[#60A5FA] light:bg-[#2563EB] transition-all duration-500"
              style={{
                width: isCancelled
                  ? '0%'
                  : stageIndex === 1
                  ? '10%'
                  : stageIndex === 2
                  ? '32%'
                  : stageIndex === 3
                  ? '55%'
                  : stageIndex === 4
                  ? '78%'
                  : '100%'
              }}
            />
          </div>

          {/* Stepper Nodes */}
          <div className="grid grid-cols-5 gap-2 relative z-10">
            {stages.map((st) => (
              <div key={st.num} className="flex flex-col items-center text-center">
                {/* Node Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    st.isDone
                      ? 'bg-[#60A5FA] light:bg-[#2563EB] text-[#0B1020] light:text-white ring-4 ring-[#0B1020] light:ring-white shadow-xs'
                      : st.isCurrent
                      ? 'bg-[#151D31] light:bg-white text-[#60A5FA] light:text-[#2563EB] border-2 border-[#60A5FA] light:border-[#2563EB] ring-4 ring-[#60A5FA]/20'
                      : 'bg-[#0F172A] light:bg-[#F1F5F9] text-[#64748B] border border-[#29344D] light:border-[#CBD5E1]'
                  }`}
                >
                  {st.isDone ? <Check className="w-4 h-4 stroke-[3]" /> : st.num}
                </div>

                {/* Node Title */}
                <span
                  className={`mt-2 text-xs font-bold tracking-tight ${
                    st.isCurrent
                      ? 'text-[#60A5FA] light:text-[#2563EB]'
                      : st.isDone
                      ? 'text-[#F1F5F9] light:text-[#0F172A]'
                      : 'text-[#64748B]'
                  }`}
                >
                  {st.title}
                </span>

                {/* Node Description & Timestamp */}
                <span className="text-[10px] text-[#94A3B8] light:text-[#64748B] mt-0.5 max-w-[120px] leading-tight hidden sm:block">
                  {st.desc}
                </span>

                {st.timestamp && (
                  <span className="text-[9px] font-mono font-semibold text-[#60A5FA] light:text-[#2563EB] mt-0.5">
                    {st.timestamp}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Wait-Time & Prediction Intelligence Panel */}
      {(status === 'checked_in' || status === 'waiting') && live_prediction && (
        <div className="mt-2 p-4 rounded-xl bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#151D31] light:bg-[#EFF6FF] border border-[#29344D] light:border-[#BFDBFE] flex flex-col items-center justify-center shrink-0">
              <span className="text-[9px] font-bold uppercase text-[#94A3B8] light:text-[#64748B] leading-none">Queue</span>
              <span className="text-xl font-extrabold text-[#60A5FA] light:text-[#2563EB] leading-tight">
                #{live_prediction.queue_position}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F1F5F9] light:text-[#0F172A]">
                  Estimated Wait: ~{live_prediction.estimated_wait_minutes} Minutes
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#151D31] light:bg-[#EFF6FF] text-[#60A5FA] light:text-[#2563EB] border border-[#29344D] light:border-[#BFDBFE] font-semibold">
                  Confidence: {Math.round((live_prediction.confidence_score || 0.88) * 100)}%
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
                Expected Call Time:{' '}
                <strong className="text-[#F1F5F9] light:text-[#0F172A]">
                  {new Date(live_prediction.estimated_consultation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </strong>
              </p>
            </div>
          </div>

          {/* Explainable Factor Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#94A3B8] light:text-[#475569]">
            <span className="px-2.5 py-1 rounded-md bg-[#151D31] light:bg-white border border-[#29344D] light:border-[#E2E8F0]">
              {live_prediction.factors?.patients_ahead || 0} Patients Ahead
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#151D31] light:bg-white border border-[#29344D] light:border-[#E2E8F0]">
              Doctor Pacing: {live_prediction.factors?.doctor_pacing_factor || 1.0}x
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTracker;