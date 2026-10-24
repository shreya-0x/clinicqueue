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
  Check,
  UserCheck,
  BellRing,
  ArrowRight,
  ShieldAlert
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
    called_at,
    consultation_started_at,
    consultation_completed_at,
    consultation_duration_minutes,
    live_prediction
  } = appointment;

  // Stages definition (6-stage clinical lifecycle)
  // 1: Confirmed -> 2: Checked In -> 3: Waiting in Queue -> 4: Patient Called -> 5: In Consultation -> 6: Consultation Completed
  const getStageIndex = (): number => {
    switch (status) {
      case 'completed':
        return 6;
      case 'in_consultation':
        return 5;
      case 'called':
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
  const isNoShow = status === 'no_show';
  const isTerminal = isCancelled || isNoShow;

  const stages = [
    {
      num: 1,
      title: 'Appointment Confirmed',
      desc: `Scheduled for ${scheduled_time}`,
      timestamp: appointment.created_at ? new Date(appointment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 1 && !isTerminal,
      isCurrent: stageIndex === 1 && !isTerminal
    },
    {
      num: 2,
      title: 'Arrival Checked In',
      desc: check_in_time ? 'Arrival verified at reception desk' : 'Ready to check in on arrival',
      timestamp: check_in_time ? new Date(check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 2 && !isTerminal,
      isCurrent: stageIndex === 2 && !isTerminal
    },
    {
      num: 3,
      title: 'Waiting in Queue',
      desc: live_prediction
        ? `Queue Position #${live_prediction.queue_position || 2} • ~${live_prediction.estimated_wait_minutes || 14}m wait`
        : 'In outpatient waiting lobby',
      isDone: stageIndex >= 3 && !isTerminal,
      isCurrent: stageIndex === 3 && !isTerminal
    },
    {
      num: 4,
      title: 'Patient Called',
      desc: status === 'called' ? 'Proceed immediately to Consulting Room' : 'Physician ready for consultation',
      timestamp: called_at ? new Date(called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 4 && !isTerminal,
      isCurrent: stageIndex === 4 && !isTerminal
    },
    {
      num: 5,
      title: 'In Consultation',
      desc: consultation_started_at
        ? `In session with ${doctor_name}`
        : 'Active consultation with physician',
      timestamp: consultation_started_at ? new Date(consultation_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 5 && !isTerminal,
      isCurrent: stageIndex === 5 && !isTerminal
    },
    {
      num: 6,
      title: 'Consultation Completed',
      desc: consultation_completed_at
        ? `Duration: ${consultation_duration_minutes || 16}m • Rx Issued`
        : 'Visit concluded & follow-up issued',
      timestamp: consultation_completed_at ? new Date(consultation_completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isDone: stageIndex >= 6 && !isTerminal,
      isCurrent: stageIndex === 6 && !isTerminal
    }
  ];

  const getStatusBadge = () => {
    if (isCancelled) {
      return { text: 'Cancelled', bg: 'bg-red-950/60 text-red-300 border-red-800' };
    }
    if (isNoShow) {
      return { text: 'Flagged No-Show', bg: 'bg-rose-950/60 text-rose-300 border-rose-800' };
    }
    switch (status) {
      case 'completed':
        return { text: 'Completed', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' };
      case 'in_consultation':
        return { text: 'In Consultation', bg: 'bg-[#1B263D] text-[#60A5FA] border-[#60A5FA] animate-pulse' };
      case 'called':
        return { text: 'Now Calling You', bg: 'bg-amber-950/80 text-amber-300 border-amber-600 animate-bounce' };
      case 'waiting':
        return { text: 'Waiting in Queue', bg: 'bg-[#151D31] text-[#60A5FA] border-[#29344D]' };
      case 'checked_in':
        return { text: 'Checked In', bg: 'bg-blue-950/60 text-blue-300 border-blue-800' };
      case 'booked':
      default:
        return { text: 'Confirmed', bg: 'bg-[#0F172A] text-[#94A3B8] border-[#29344D]' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="space-y-6">
      {/* Terminal Warning Banner if Cancelled or No-Show */}
      {isCancelled && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-3">
          <XCircle className="w-5 h-5 shrink-0 text-red-400" />
          <div>
            <strong className="block font-bold">This visit has been cancelled</strong>
            <span>Your appointment has been cancelled. Please book a new consultation or contact the clinic reception.</span>
          </div>
        </div>
      )}

      {isNoShow && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
          <div>
            <strong className="block font-bold">Visit flagged as No-Show</strong>
            <span>Patient did not report to the waiting lobby during the scheduled consultation window.</span>
          </div>
        </div>
      )}

      {/* Hero Status & Primary Visit Details Card */}
      <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1E293B] light:border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#0F172A] light:bg-[#F1F5F9] text-[#60A5FA] light:text-[#2563EB] font-bold border border-[#29344D] light:border-[#CBD5E1]">
                {booking_reference}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${badge.bg}`}>
                {badge.text}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#F1F5F9] light:text-[#0F172A]">
              Live Outpatient Visit Tracker
            </h2>
            <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
              Real-time synchronization with clinic reception and attending physician.
            </p>
          </div>

          {/* Action: Check In if booked */}
          {status === 'booked' && onCheckIn && (
            <button
              onClick={() => onCheckIn(_id)}
              disabled={checkInLoading}
              className="py-2 px-4 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] light:hover:bg-[#1D4ED8] disabled:opacity-50 text-[#0B1020] light:text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
              <span>{checkInLoading ? 'Verifying Arrival...' : 'Check In to Clinic'}</span>
            </button>
          )}

          {/* Urgent Action Banner if Called */}
          {status === 'called' && (
            <div className="px-4 py-2 rounded-lg bg-amber-500 text-[#0B1020] font-bold text-xs flex items-center gap-2 animate-bounce">
              <BellRing className="w-4 h-4" />
              <span>Proceed to Consulting Room</span>
            </div>
          )}
        </div>

        {/* Visit Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0]">
            <span className="text-[10px] text-[#94A3B8] light:text-[#64748B] uppercase font-bold block mb-1">
              Physician & Department
            </span>
            <div className="font-bold text-[#F1F5F9] light:text-[#0F172A]">{doctor_name}</div>
            <div className="text-[#60A5FA] light:text-[#2563EB] text-[11px] font-medium">{department_name}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0]">
            <span className="text-[10px] text-[#94A3B8] light:text-[#64748B] uppercase font-bold block mb-1">
              Date & Scheduled Time
            </span>
            <div className="font-bold text-[#F1F5F9] light:text-[#0F172A]">{appointment_date}</div>
            <div className="text-[#94A3B8] light:text-[#475569] text-[11px]">{scheduled_time}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0]">
            <span className="text-[10px] text-[#94A3B8] light:text-[#64748B] uppercase font-bold block mb-1">
              Live Queue Position
            </span>
            <div className="text-xl font-extrabold text-[#60A5FA] light:text-[#2563EB]">
              {status === 'waiting' || status === 'checked_in' || status === 'called' ? `#${live_prediction?.queue_position || 2}` : status === 'in_consultation' ? 'In Session' : 'Concluded'}
            </div>
            <div className="text-[10px] text-[#94A3B8] light:text-[#64748B]">
              {status === 'waiting' ? '1 patient ahead' : status === 'called' ? 'Next in line' : 'Queue clear'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0]">
            <span className="text-[10px] text-[#94A3B8] light:text-[#64748B] uppercase font-bold block mb-1">
              Estimated Wait Time
            </span>
            <div className="text-xl font-extrabold text-emerald-400 light:text-emerald-600">
              {status === 'waiting' || status === 'checked_in' ? `~${live_prediction?.estimated_wait_minutes || 14}m` : status === 'called' ? 'Now' : status === 'in_consultation' ? '0m' : 'Done'}
            </div>
            <div className="text-[10px] text-[#94A3B8] light:text-[#64748B]">
              Adaptive pacing (1.02x)
            </div>
          </div>
        </div>
      </div>

      {/* 6-Stage Timeline Stepper */}
      <div className="bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 shadow-sm">
        <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A] mb-5">
          Outpatient Care Stages & Verification
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {stages.map((stg) => (
            <div
              key={stg.num}
              className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                stg.isCurrent
                  ? 'bg-[#1B263D] border-[#60A5FA] ring-1 ring-[#60A5FA]/40 shadow-xs'
                  : stg.isDone
                  ? 'bg-[#0F172A]/70 light:bg-[#F8FAFC] border-emerald-800/80 text-emerald-300'
                  : 'bg-[#0F172A]/40 light:bg-[#F1F5F9] border-[#29344D] light:border-[#E2E8F0] text-[#64748B]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      stg.isDone
                        ? 'bg-emerald-500 text-white'
                        : stg.isCurrent
                        ? 'bg-[#60A5FA] text-[#0B1020]'
                        : 'bg-[#1E293B] light:bg-[#E2E8F0] text-[#94A3B8] light:text-[#64748B]'
                    }`}
                  >
                    {stg.isDone ? <Check className="w-3.5 h-3.5" /> : stg.num}
                  </span>
                  {stg.timestamp && (
                    <span className="font-mono text-[10px] text-[#94A3B8] light:text-[#64748B]">
                      {stg.timestamp}
                    </span>
                  )}
                </div>

                <div className="font-bold text-[#F1F5F9] light:text-[#0F172A] text-xs">
                  {stg.title}
                </div>
                <div className="text-[11px] text-[#94A3B8] light:text-[#64748B] mt-1 leading-relaxed">
                  {stg.desc}
                </div>
              </div>

              {stg.isCurrent && (
                <div className="mt-3 pt-2 border-t border-[#29344D] light:border-[#CBD5E1] text-[10px] font-bold text-[#60A5FA] light:text-[#2563EB] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-ping" />
                  <span>Current State</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientTracker;
