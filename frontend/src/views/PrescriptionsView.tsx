import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Prescription } from '../types';
import {
  FileText,
  Pill,
  Printer,
  Calendar,
  User,
  Stethoscope,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const PrescriptionsView: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.getPrescriptions();
      const list = res.prescriptions || [];
      setPrescriptions(list);
      if (list.length > 0) {
        setSelectedRx(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#111118] light:bg-[#F7F7FB] text-[#F4F2FA] light:text-[#242033] transition-colors duration-200">
      {/* Header */}
      <div className="bg-[#1B1B28] light:bg-white rounded-2xl p-6 border border-[#343347] light:border-[#DDD9E9] shadow-xs mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#29213D] light:bg-[#EDE9FE] text-[#A78BFA] light:text-[#6D28D9] mb-1">
            <Pill className="w-3.5 h-3.5" />
            <span>Digital Clinical Records</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Outpatient Prescriptions (Rx)</h1>
          <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-0.5">
            Verified medical prescriptions, medication dosages, and follow-up guidance issued by your doctors.
          </p>
        </div>

        <button
          onClick={handlePrint}
          disabled={!selectedRx}
          className="px-4 py-2 rounded-xl bg-[#222233] light:bg-white border border-[#343347] light:border-[#DDD9E9] hover:bg-[#29213D] light:hover:bg-[#F0EFF7] text-[#F4F2FA] light:text-[#242033] font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Printer className="w-4 h-4 text-[#8B5CF6] light:text-[#6D28D9]" />
          <span>Print Prescription</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-12 text-center text-[#AAA6BC]">
          <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Loading clinical prescriptions...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] p-12 text-center text-[#AAA6BC]">
          <FileText className="w-12 h-12 text-[#817C95] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#F4F2FA] light:text-[#242033]">No Prescriptions on Record</h3>
          <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-1 max-w-md mx-auto">
            Prescriptions issued by your doctor after completed outpatient consultations will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar List of Prescriptions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#817C95] light:text-[#777188] px-1">
              Consultation Prescriptions ({prescriptions.length})
            </h3>
            {prescriptions.map((rx) => {
              const isSelected = selectedRx?._id === rx._id;
              return (
                <div
                  key={rx._id}
                  onClick={() => setSelectedRx(rx)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all text-left ${
                    isSelected
                      ? 'bg-[#1B1B28] light:bg-white border-[#8B5CF6] light:border-[#6D28D9] shadow-sm ring-1 ring-[#8B5CF6]'
                      : 'bg-[#1B1B28] light:bg-white border-[#343347] light:border-[#DDD9E9] hover:border-[#8B5CF6]/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-[#A78BFA] light:text-[#6D28D9]">{rx.rx_number}</span>
                    <span className="text-[11px] text-[#817C95] light:text-[#777188]">{rx.date}</span>
                  </div>
                  <div className="font-bold text-[#F4F2FA] light:text-[#242033] text-sm">{rx.doctor_name}</div>
                  <div className="text-xs text-[#AAA6BC] light:text-[#625D74]">{rx.department_name}</div>
                  <div className="mt-2 text-xs font-medium text-[#AAA6BC] light:text-[#625D74] line-clamp-1">
                    Impression: {rx.diagnosis}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#8B5CF6] light:text-[#6D28D9] font-semibold">
                    <Pill className="w-3 h-3" />
                    <span>{rx.medications?.length || 0} Prescribed Items</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Prescription View */}
          {selectedRx && (
            <div className="lg:col-span-2 bg-[#1B1B28] light:bg-white rounded-2xl border border-[#343347] light:border-[#DDD9E9] shadow-xs p-8 relative print:border-none print:shadow-none print:p-0">
              {/* Clinic Header */}
              <div className="border-b border-[#29293A] light:border-[#EAE7F1] pb-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                      <h2 className="text-xl font-bold text-[#F4F2FA] light:text-[#242033]">{selectedRx.organization_name}</h2>
                    </div>
                    <p className="text-xs text-[#AAA6BC] light:text-[#625D74] mt-0.5">
                      Department of {selectedRx.department_name} • Outpatient Clinic
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-[#A78BFA] light:text-[#6D28D9]">{selectedRx.rx_number}</div>
                    <div className="text-xs text-[#817C95] light:text-[#777188]">Date: {selectedRx.date}</div>
                  </div>
                </div>

                {/* Doctor & Patient Info Grid */}
                <div className="grid grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9] text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#817C95] light:text-[#777188]">Attending Physician</div>
                    <div className="font-bold text-[#F4F2FA] light:text-[#242033] text-sm mt-0.5">{selectedRx.doctor_name}</div>
                    <div className="text-[#AAA6BC] light:text-[#625D74]">{selectedRx.department_name}</div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#817C95] light:text-[#777188]">Patient Details</div>
                    <div className="font-bold text-[#F4F2FA] light:text-[#242033] text-sm mt-0.5">{selectedRx.patient_name}</div>
                    <div className="text-[#AAA6BC] light:text-[#625D74]">MRN: {user?.patient_profile?.mrn || 'CQ-MRN-00001'}</div>
                  </div>
                </div>
              </div>

              {/* Clinical Diagnosis */}
              <div className="mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#817C95] light:text-[#777188] mb-1">
                  Clinical Impression / Diagnosis
                </div>
                <div className="p-3.5 rounded-xl bg-[#29213D] light:bg-[#EDE9FE] border border-[#343347] light:border-[#DDD9E9] text-xs font-semibold text-[#A78BFA] light:text-[#6D28D9]">
                  {selectedRx.diagnosis}
                </div>
              </div>

              {/* Medications Table */}
              <div className="mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#817C95] light:text-[#777188] mb-2">
                  Prescribed Medications (Rx)
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#343347] light:border-[#DDD9E9]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#222233] light:bg-[#F0EFF7] text-[#817C95] light:text-[#777188] font-semibold uppercase text-[10px] border-b border-[#343347] light:border-[#DDD9E9]">
                      <tr>
                        <th className="py-2.5 px-3">Medication</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#343347] light:divide-[#DDD9E9]">
                      {selectedRx.medications?.map((med, idx) => (
                        <tr key={idx} className="hover:bg-[#222233]/40 light:hover:bg-[#F0EFF7]/40">
                          <td className="py-3 px-3 font-bold text-[#F4F2FA] light:text-[#242033] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                            {med.name}
                          </td>
                          <td className="py-3 px-3 font-medium text-[#AAA6BC] light:text-[#625D74]">{med.dosage}</td>
                          <td className="py-3 px-3 text-[#AAA6BC] light:text-[#625D74]">{med.duration}</td>
                          <td className="py-3 px-3 text-[#AAA6BC] light:text-[#625D74]">{med.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Doctor Advice & Follow-Up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#29293A] light:border-[#EAE7F1] text-xs">
                <div className="p-4 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9]">
                  <div className="font-bold text-[#F4F2FA] light:text-[#242033] flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] light:text-[#6D28D9]" />
                    <span>Clinical Guidance</span>
                  </div>
                  <p className="text-[#AAA6BC] light:text-[#625D74] text-[11px] leading-relaxed">
                    {selectedRx.advice || 'Follow medication schedule strictly. Maintain adequate hydration.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#222233] light:bg-[#F0EFF7] border border-[#343347] light:border-[#DDD9E9]">
                  <div className="font-bold text-[#F4F2FA] light:text-[#242033] flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[#8B5CF6] light:text-[#6D28D9]" />
                    <span>Follow-Up Review</span>
                  </div>
                  <p className="text-[#AAA6BC] light:text-[#625D74] text-[11px] leading-relaxed">
                    {selectedRx.follow_up || 'Return for review in 2 weeks or if symptoms persist.'}
                  </p>
                </div>
              </div>

              {/* Digital Verification */}
              <div className="mt-8 pt-4 border-t border-[#29293A] light:border-[#EAE7F1] flex items-center justify-between text-[11px] text-[#817C95] light:text-[#777188]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
                  <span>Digitally verified on ClinicQueue Outpatient EMR</span>
                </div>
                <div>Authorized Electronic Record</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
