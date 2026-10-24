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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#151D31] light:bg-white rounded-xl p-5 border border-[#29344D] light:border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F172A] light:bg-[#EFF6FF] text-[#60A5FA] light:text-[#2563EB] mb-1">
            <Pill className="w-3.5 h-3.5" />
            <span>Digital Clinical Records</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#F1F5F9] light:text-[#0F172A]">
            Outpatient Prescriptions (Rx)
          </h2>
          <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-0.5">
            Verified medical prescriptions, medication dosages, and follow-up guidance issued by your doctors.
          </p>
        </div>

        {selectedRx && (
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-[#60A5FA] hover:bg-[#3B82F6] light:bg-[#2563EB] text-[#0B1020] light:text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Rx</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-[#94A3B8]">Loading prescription records...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-[#151D31] light:bg-white rounded-xl p-12 text-center border border-[#29344D] light:border-[#E2E8F0]">
          <FileText className="w-10 h-10 text-[#64748B] mx-auto mb-2 opacity-60" />
          <h3 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">No Digital Prescriptions Found</h3>
          <p className="text-xs text-[#94A3B8] light:text-[#475569] mt-1 max-w-sm mx-auto">
            Prescriptions issued during your completed outpatient consultations will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Prescriptions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] px-1">
              Issued Records ({prescriptions.length})
            </h3>
            {prescriptions.map((rx) => {
              const isSelected = selectedRx?._id === rx._id;
              return (
                <div
                  key={rx._id}
                  onClick={() => setSelectedRx(rx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1B263D] border-[#60A5FA] shadow-xs'
                      : 'bg-[#151D31] light:bg-white border-[#29344D] light:border-[#E2E8F0] hover:border-[#60A5FA]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-[#60A5FA] light:text-[#2563EB]">
                      {rx.prescription_number || rx._id}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">{rx.issued_date || '2026-10-25'}</span>
                  </div>

                  <h4 className="font-bold text-sm text-[#F1F5F9] light:text-[#0F172A]">{rx.doctor_name}</h4>
                  <p className="text-xs text-[#94A3B8] light:text-[#475569]">{rx.diagnosis || 'General Consultation'}</p>

                  <div className="mt-3 pt-2 border-t border-[#1E293B] light:border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#60A5FA] font-medium">
                    <span>{rx.medications?.length || 0} Medications prescribed</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Detailed Printable Rx View */}
          {selectedRx && (
            <div className="lg:col-span-2 bg-[#151D31] light:bg-white rounded-xl border border-[#29344D] light:border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
              <div className="border-b-2 border-[#29344D] light:border-[#E2E8F0] pb-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#60A5FA] uppercase tracking-wider block">
                    MetroCare Apex Hospital • Outpatient Department
                  </span>
                  <h3 className="text-xl font-bold text-[#F1F5F9] light:text-[#0F172A] mt-0.5">
                    Dr. {selectedRx.doctor_name}
                  </h3>
                  <p className="text-xs text-[#94A3B8] light:text-[#475569]">{selectedRx.department_name} Specialist</p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="font-mono font-bold text-xs text-[#60A5FA] block">
                    Rx Ref: {selectedRx.prescription_number || selectedRx._id}
                  </span>
                  <span className="text-xs text-[#94A3B8] block mt-0.5">Date: {selectedRx.issued_date || '2026-10-25'}</span>
                </div>
              </div>

              {/* Patient info row */}
              <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-6">
                <div>
                  <span className="text-[#94A3B8] block text-[10px]">Patient Name:</span>
                  <strong className="text-[#F1F5F9] light:text-[#0F172A]">{selectedRx.patient_name || user?.name}</strong>
                </div>
                <div>
                  <span className="text-[#94A3B8] block text-[10px]">Primary Diagnosis:</span>
                  <strong className="text-[#60A5FA]">{selectedRx.diagnosis || 'Acute Outpatient Symptoms'}</strong>
                </div>
                <div>
                  <span className="text-[#94A3B8] block text-[10px]">Valid Until:</span>
                  <strong className="text-[#F1F5F9] light:text-[#0F172A]">30 Days from Issue</strong>
                </div>
              </div>

              {/* Medications Table */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Prescribed Medications</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1E293B] light:border-[#E2E8F0] text-[#94A3B8]">
                        <th className="py-2 px-2 font-semibold">Medicine Name</th>
                        <th className="py-2 px-2 font-semibold">Dosage</th>
                        <th className="py-2 px-2 font-semibold">Frequency</th>
                        <th className="py-2 px-2 font-semibold">Duration</th>
                        <th className="py-2 px-2 font-semibold">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] light:divide-[#E2E8F0]">
                      {selectedRx.medications?.map((med, i) => (
                        <tr key={i} className="hover:bg-[#1B263D]/20">
                          <td className="py-2.5 px-2 font-bold text-[#F1F5F9] light:text-[#0F172A]">{med.name}</td>
                          <td className="py-2.5 px-2 text-[#94A3B8]">{med.dosage}</td>
                          <td className="py-2.5 px-2 text-[#94A3B8]">{med.frequency}</td>
                          <td className="py-2.5 px-2 text-[#94A3B8]">{med.duration}</td>
                          <td className="py-2.5 px-2 text-[#60A5FA]">{med.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedRx.notes && (
                <div className="p-3.5 rounded-lg bg-[#0F172A] light:bg-[#F8FAFC] border border-[#29344D] light:border-[#E2E8F0] text-xs space-y-1">
                  <span className="font-bold text-[#F1F5F9] light:text-[#0F172A] block">Physician Clinical Advice:</span>
                  <p className="text-[#94A3B8] light:text-[#475569]">{selectedRx.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionsView;